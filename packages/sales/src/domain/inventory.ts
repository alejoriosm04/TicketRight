import { Dinero, type UUID } from "@ticketright/shared-kernel";

import { AforoExcedido, TransicionInvalida } from "./errors.js";

export type TipoLocalidad = "numerada" | "general";
export type EstadoSilla = "libre" | "reservada" | "vendida" | "bloqueada";

export class Aforo {
  constructor(
    readonly autorizado: number,
    readonly reservado: number = 0,
    readonly vendido: number = 0,
  ) {
    if (reservado < 0 || vendido < 0 || reservado + vendido > autorizado) {
      throw new Error(
        `Aforo inválido: autorizado ${autorizado}, reservado ${reservado}, vendido ${vendido}`,
      );
    }
  }

  disponible(): number {
    return this.autorizado - this.reservado - this.vendido;
  }

  conReserva(cantidad: number): Aforo {
    return new Aforo(this.autorizado, this.reservado + cantidad, this.vendido);
  }

  conVenta(cantidad: number): Aforo {
    if (cantidad > this.reservado) {
      throw new TransicionInvalida("R2", "No se puede vender inventario que no está reservado");
    }
    return new Aforo(this.autorizado, this.reservado - cantidad, this.vendido + cantidad);
  }

  conLiberacion(cantidad: number): Aforo {
    if (cantidad > this.reservado) {
      throw new TransicionInvalida("R3", "No se puede liberar más de lo reservado");
    }
    return new Aforo(this.autorizado, this.reservado - cantidad, this.vendido);
  }
}

export class Silla {
  private estadoActual: EstadoSilla;

  constructor(
    readonly sillaId: UUID,
    readonly fila: string,
    readonly numero: string,
    estado: EstadoSilla = "libre",
  ) {
    this.estadoActual = estado;
  }

  get estado(): EstadoSilla {
    return this.estadoActual;
  }

  reservar(): void {
    if (this.estadoActual !== "libre") {
      throw new TransicionInvalida("R2", `La silla ${this.sillaId} no está libre`);
    }
    this.estadoActual = "reservada";
  }

  liberar(): void {
    if (this.estadoActual !== "reservada") {
      throw new TransicionInvalida("R3", `La silla ${this.sillaId} no está reservada`);
    }
    this.estadoActual = "libre";
  }

  vender(): void {
    if (this.estadoActual !== "reservada") {
      throw new TransicionInvalida("R2", `La silla ${this.sillaId} no está reservada`);
    }
    this.estadoActual = "vendida";
  }
}

export class Localidad {
  private aforoActual: Aforo;

  constructor(
    readonly localidadId: UUID,
    readonly eventoId: UUID,
    readonly tipo: TipoLocalidad,
    aforo: Aforo,
    readonly precio: Dinero,
    private readonly sillas: Silla[] = [],
  ) {
    this.aforoActual = aforo;
  }

  static rehidratar(
    localidadId: UUID,
    eventoId: UUID,
    tipo: TipoLocalidad,
    aforo: Aforo,
    precio: Dinero,
    sillas: readonly Silla[] = [],
  ): Localidad {
    return new Localidad(localidadId, eventoId, tipo, aforo, precio, [...sillas]);
  }

  get aforo(): Aforo {
    return this.aforoActual;
  }

  get sillasActuales(): readonly Silla[] {
    return this.sillas;
  }

  precioNominal(): Dinero {
    return this.precio;
  }

  reservar(cantidad: number, sillaIds: readonly UUID[] = []): void {
    if (cantidad < 1) {
      throw new TransicionInvalida("R1", "La cantidad debe ser positiva");
    }
    if (this.tipo === "numerada") {
      this.exigirSillasDisponibles(cantidad, sillaIds);
      sillaIds.forEach((sillaId) => this.silla(sillaId).reservar());
      this.aforoActual = this.aforoActual.conReserva(cantidad);
      return;
    }
    if (this.aforoActual.disponible() < cantidad) {
      throw new AforoExcedido(
        this.localidadId,
        cantidad,
        this.aforoActual.disponible(),
        `El aforo no alcanza: solicitado ${cantidad}, disponible ${this.aforoActual.disponible()}`,
      );
    }
    this.aforoActual = this.aforoActual.conReserva(cantidad);
  }

  liberar(cantidad: number, sillaIds: readonly UUID[] = []): void {
    if (this.tipo === "numerada") {
      sillaIds.forEach((sillaId) => this.silla(sillaId).liberar());
    }
    this.aforoActual = this.aforoActual.conLiberacion(cantidad);
  }

  vender(cantidad: number, sillaIds: readonly UUID[] = []): void {
    if (this.tipo === "numerada") {
      this.exigirSillasReservadas(cantidad, sillaIds);
      sillaIds.forEach((sillaId) => this.silla(sillaId).vender());
    }
    this.aforoActual = this.aforoActual.conVenta(cantidad);
  }

  private exigirSillasDisponibles(cantidad: number, sillaIds: readonly UUID[]): void {
    if (sillaIds.length !== cantidad) {
      throw new AforoExcedido(
        this.localidadId,
        cantidad,
        this.aforoActual.disponible(),
        "La cantidad debe coincidir con las sillas solicitadas",
      );
    }
    for (const sillaId of sillaIds) {
      if (this.silla(sillaId).estado !== "libre") {
        throw new AforoExcedido(
          this.localidadId,
          cantidad,
          this.aforoActual.disponible(),
          `La silla ${sillaId} no está disponible`,
        );
      }
    }
  }

  private exigirSillasReservadas(cantidad: number, sillaIds: readonly UUID[]): void {
    if (sillaIds.length !== cantidad) {
      throw new AforoExcedido(
        this.localidadId,
        cantidad,
        this.aforoActual.disponible(),
        "La cantidad debe coincidir con las sillas vendidas",
      );
    }
    for (const sillaId of sillaIds) {
      if (this.silla(sillaId).estado !== "reservada") {
        throw new AforoExcedido(
          this.localidadId,
          cantidad,
          this.aforoActual.disponible(),
          `La silla ${sillaId} no está reservada`,
        );
      }
    }
  }

  private silla(sillaId: UUID): Silla {
    const silla = this.sillas.find((candidata) => candidata.sillaId === sillaId);
    if (!silla) {
      throw new TransicionInvalida("R2", `La silla ${sillaId} no pertenece a la localidad`);
    }
    return silla;
  }
}
