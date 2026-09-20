import {
  nuevoId,
  type DatosDeEmision,
  type Dinero,
  type FechaHora,
  type IdOpaco,
  type UUID,
} from "@ticketright/shared-kernel";

import {
  BoletaAnulada,
  PrecioDeReventaExcedido,
  ReventaNoPermitida,
  TitularidadNoVigente,
  TransicionInvalida,
} from "./errors.js";
import { ReglasDeReventa, Reventa } from "./resale.js";

export type EstadoBoleta = "emitida" | "transferida" | "revendida" | "anulada";
export type EstadoTitular = "activo" | "anterior";
export type EstadoTitularidad = "activa" | "finalizada";
export type EstadoTransferencia = "solicitada" | "aceptada" | "rechazada" | "vencida";

export class CodigoBoleta {
  constructor(
    readonly valor: string,
    readonly version: number,
  ) {}

  siguiente(): CodigoBoleta {
    return new CodigoBoleta(`${this.valor}-v${this.version + 1}`, this.version + 1);
  }
}

export class Titular {
  private estadoActual: EstadoTitular;

  constructor(
    readonly titularId: UUID,
    readonly fanId: UUID,
    readonly identidadRef: IdOpaco,
    estado: EstadoTitular = "activo",
  ) {
    this.estadoActual = estado;
  }

  get estado(): EstadoTitular {
    return this.estadoActual;
  }

  marcarAnterior(): void {
    this.estadoActual = "anterior";
  }
}

export class Titularidad {
  private fin: FechaHora | undefined;
  private estadoActual: EstadoTitularidad;

  constructor(
    readonly titularidadId: UUID,
    readonly titular: Titular,
    readonly inicio: FechaHora,
    estado: EstadoTitularidad = "activa",
  ) {
    this.estadoActual = estado;
  }

  get estado(): EstadoTitularidad {
    return this.estadoActual;
  }

  get finEn(): FechaHora | undefined {
    return this.fin;
  }

  cerrar(en: FechaHora): void {
    if (this.estadoActual !== "activa") {
      throw new TransicionInvalida("R7", `La titularidad ${this.titularidadId} ya está finalizada`);
    }
    this.estadoActual = "finalizada";
    this.fin = en;
  }
}

export class Transferencia {
  constructor(
    readonly transferenciaId: UUID,
    readonly titularOrigenId: UUID,
    readonly fanDestinoId: UUID,
    readonly estado: EstadoTransferencia,
    readonly solicitadaEn: FechaHora,
    readonly aceptadaEn: FechaHora | undefined,
  ) {}
}

export class Boleta {
  private estadoActual: EstadoBoleta;
  private codigoActual: CodigoBoleta;
  private anuladaEnActual: FechaHora | undefined;

  private constructor(
    readonly boletaId: UUID,
    readonly eventoId: UUID,
    readonly localidadId: UUID,
    readonly sillaId: UUID | undefined,
    readonly pagoId: UUID,
    readonly precioNominal: Dinero,
    codigo: CodigoBoleta,
    estado: EstadoBoleta,
    readonly emitidaEn: FechaHora,
    anuladaEn: FechaHora | undefined,
    private readonly titularidadesActuales: Titularidad[],
    private readonly transferenciasActuales: Transferencia[],
    private readonly reventasActuales: Reventa[],
  ) {
    this.codigoActual = codigo;
    this.estadoActual = estado;
    this.anuladaEnActual = anuladaEn;
  }

  static emitir(datos: DatosDeEmision, ahora: FechaHora): Boleta {
    const titular = new Titular(nuevoId(), datos.fanId, datos.identidadRef);
    const titularidad = new Titularidad(nuevoId(), titular, ahora);
    return new Boleta(
      nuevoId(),
      datos.eventoId,
      datos.localidadId,
      datos.sillaId,
      datos.pagoId,
      datos.precioNominal,
      new CodigoBoleta(nuevoId(), 1),
      "emitida",
      ahora,
      undefined,
      [titularidad],
      [],
      [],
    );
  }

  static rehidratar(
    boletaId: UUID,
    eventoId: UUID,
    localidadId: UUID,
    sillaId: UUID | undefined,
    pagoId: UUID,
    precioNominal: Dinero,
    codigo: CodigoBoleta,
    estado: EstadoBoleta,
    emitidaEn: FechaHora,
    anuladaEn: FechaHora | undefined,
    titularidades: readonly Titularidad[],
    transferencias: readonly Transferencia[],
    reventas: readonly Reventa[],
  ): Boleta {
    return new Boleta(
      boletaId,
      eventoId,
      localidadId,
      sillaId,
      pagoId,
      precioNominal,
      codigo,
      estado,
      emitidaEn,
      anuladaEn,
      [...titularidades],
      [...transferencias],
      [...reventas],
    );
  }

  get id(): UUID {
    return this.boletaId;
  }

  get estado(): EstadoBoleta {
    return this.estadoActual;
  }

  get codigo(): CodigoBoleta {
    return this.codigoActual;
  }

  get titularidades(): readonly Titularidad[] {
    return this.titularidadesActuales;
  }

  get transferencias(): readonly Transferencia[] {
    return this.transferenciasActuales;
  }

  get reventas(): readonly Reventa[] {
    return this.reventasActuales;
  }

  get anuladaEn(): FechaHora | undefined {
    return this.anuladaEnActual;
  }

  titularActivo(): Titular {
    return this.titularidadActiva().titular;
  }

  transferir(
    titularidadOrigenId: UUID,
    fanDestinoId: UUID,
    identidadRefDestino: IdOpaco,
    ahora: FechaHora,
  ): Transferencia {
    if (this.estadoActual === "anulada") {
      throw new BoletaAnulada(this.boletaId);
    }
    const activa = this.titularidadActiva();
    if (activa.titularidadId !== titularidadOrigenId) {
      throw new TitularidadNoVigente(titularidadOrigenId);
    }
    activa.cerrar(ahora);
    activa.titular.marcarAnterior();
    const nuevoTitular = new Titular(nuevoId(), fanDestinoId, identidadRefDestino);
    this.titularidadesActuales.push(new Titularidad(nuevoId(), nuevoTitular, ahora));
    this.codigoActual = this.codigoActual.siguiente();
    const transferencia = new Transferencia(
      nuevoId(),
      titularidadOrigenId,
      fanDestinoId,
      "aceptada",
      ahora,
      ahora,
    );
    this.transferenciasActuales.push(transferencia);
    this.estadoActual = "transferida";
    return transferencia;
  }

  publicarReventa(
    titularVendedorId: UUID,
    precio: Dinero,
    ahora: FechaHora,
    reglas: ReglasDeReventa | undefined,
  ): Reventa {
    if (this.estadoActual === "anulada") {
      throw new BoletaAnulada(this.boletaId);
    }
    if (!reglas) {
      throw new ReventaNoPermitida("El evento no habilitó la reventa");
    }
    if (!reglas.ventanaIncluye(ahora)) {
      throw new ReventaNoPermitida("La publicación cae fuera de la ventana de reventa");
    }
    if (precio.mayorQue(reglas.precioMaximo)) {
      throw new PrecioDeReventaExcedido(
        `El precio ${precio.toString()} supera el máximo ${reglas.precioMaximo.toString()}`,
      );
    }
    const activa = this.titularidadActiva();
    if (activa.titular.fanId !== titularVendedorId) {
      throw new TitularidadNoVigente(activa.titularidadId);
    }
    const reventa = Reventa.publicar(
      titularVendedorId,
      precio,
      precio.aplicar(reglas.comision),
      ahora,
    );
    this.reventasActuales.push(reventa);
    return reventa;
  }

  anular(ahora: FechaHora): void {
    if (this.estadoActual === "anulada") {
      return;
    }
    const activa = this.titularidadActiva();
    activa.cerrar(ahora);
    activa.titular.marcarAnterior();
    this.estadoActual = "anulada";
    this.anuladaEnActual = ahora;
  }

  private titularidadActiva(): Titularidad {
    const activa = this.titularidadesActuales.find(
      (titularidad) => titularidad.estado === "activa",
    );
    if (!activa) {
      throw new TitularidadNoVigente(this.boletaId);
    }
    return activa;
  }
}
