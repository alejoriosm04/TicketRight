import { nuevoId, type FechaHora, type RangoFecha, type UUID } from "@ticketright/shared-kernel";

import { TransicionInvalida, TurnoDeOtroFan, TurnoVencido } from "./errors.js";

export type ModoAdmision = "pasoDirecto" | "filaVisible";
export type EstadoFila = "programada" | "abierta" | "cerrada";
export type CriterioOrden = "ordenDeLlegada" | "aleatorioPorLote";
export type EstadoTurno = "enEspera" | "admitido" | "usado" | "vencido" | "rechazado";

export class PoliticaFila {
  constructor(
    readonly criterio: CriterioOrden,
    readonly tasaAdmision: number,
    readonly vigencia: RangoFecha,
  ) {}
}

export class Turno {
  private estadoActual: EstadoTurno;
  private posicionActual: number;
  private admitido: FechaHora | undefined;

  constructor(
    readonly turnoId: UUID,
    readonly fanId: UUID,
    readonly ingresoEn: FechaHora,
    readonly venceEn: FechaHora,
    readonly claveIdempotencia: string,
    posicion: number,
    estado: EstadoTurno = "enEspera",
  ) {
    this.posicionActual = posicion;
    this.estadoActual = estado;
  }

  get posicion(): number {
    return this.posicionActual;
  }

  get estado(): EstadoTurno {
    return this.estadoActual;
  }

  get admitidoEn(): FechaHora | undefined {
    return this.admitido;
  }

  reasignarPosicion(posicion: number): void {
    this.posicionActual = posicion;
  }

  admitir(en: FechaHora): void {
    if (this.estadoActual === "usado" || this.estadoActual === "vencido" || this.estadoActual === "rechazado") {
      throw new TransicionInvalida("R6", `El turno ${this.turnoId} está ${this.estadoActual}`);
    }
    this.estadoActual = "admitido";
    this.admitido = en;
  }

  usar(ahora: FechaHora): void {
    if (this.estadoActual === "usado") {
      throw new TransicionInvalida("R6", `El turno ${this.turnoId} ya fue usado`);
    }
    if (ahora.getTime() >= this.venceEn.getTime()) {
      this.estadoActual = "vencido";
      throw new TurnoVencido(this.turnoId, this.venceEn);
    }
    if (this.estadoActual === "vencido" || this.estadoActual === "rechazado") {
      throw new TurnoVencido(this.turnoId, this.venceEn);
    }
    this.estadoActual = "usado";
  }

  estaVencido(ahora: FechaHora): boolean {
    return this.estadoActual === "vencido" || ahora.getTime() >= this.venceEn.getTime();
  }
}

export class FilaDeVenta {
  private readonly turnosActuales: Turno[] = [];
  private readonly porClave = new Map<string, Turno>();

  constructor(
    readonly filaId: UUID,
    readonly eventoId: UUID,
    readonly modo: ModoAdmision,
    private estadoActual: EstadoFila,
    readonly politica: PoliticaFila,
  ) {}

  get estado(): EstadoFila {
    return this.estadoActual;
  }

  get turnos(): readonly Turno[] {
    return this.turnosActuales;
  }

  abrir(): void {
    this.estadoActual = "abierta";
  }

  ingresar(
    fanId: UUID,
    claveIdempotencia: string,
    ingresoEn: FechaHora,
    venceEn: FechaHora,
  ): Turno {
    const existente = this.porClave.get(claveIdempotencia);
    if (existente) {
      return existente;
    }
    const turno = new Turno(
      nuevoId(),
      fanId,
      ingresoEn,
      venceEn,
      claveIdempotencia,
      0,
      "enEspera",
    );
    this.turnosActuales.push(turno);
    this.porClave.set(claveIdempotencia, turno);
    this.reordenarSegunPolitica();
    return turno;
  }

  usarTurno(turnoId: UUID, fanId: UUID, ahora: FechaHora): Turno {
    const turno = this.buscar(turnoId);
    if (turno.fanId !== fanId) {
      throw new TurnoDeOtroFan(turnoId);
    }
    turno.usar(ahora);
    return turno;
  }

  expirarTurnos(ahora: FechaHora): number {
    let vencidos = 0;
    for (const turno of this.turnosActuales) {
      if (!turno.estaVencido(ahora)) {
        continue;
      }
      if (turno.estado === "enEspera" || turno.estado === "admitido") {
        turno.usar(ahora);
        vencidos += 1;
      }
    }
    return vencidos;
  }

  private buscar(turnoId: UUID): Turno {
    const turno = this.turnosActuales.find((candidato) => candidato.turnoId === turnoId);
    if (!turno) {
      throw new TransicionInvalida("R6", `El turno ${turnoId} no existe en la fila`);
    }
    return turno;
  }

  private reordenarSegunPolitica(): void {
    if (this.politica.criterio !== "ordenDeLlegada") {
      return;
    }
    [...this.turnosActuales]
      .sort((a, b) => {
        const porIngreso = a.ingresoEn.getTime() - b.ingresoEn.getTime();
        return porIngreso !== 0 ? porIngreso : a.turnoId.localeCompare(b.turnoId);
      })
      .forEach((turno, indice) => turno.reasignarPosicion(indice + 1));
  }
}
