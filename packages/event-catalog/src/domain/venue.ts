import { nuevoId, type UUID } from "@ticketright/shared-kernel";

import { AforoDelRecintoExcedido, DatoDeCatalogoInvalido } from "./errors.js";

/**
 * Recinto (RAÍZ, contexto Oferta de eventos). Lugar autorizado donde ocurre un evento.
 * `aforoMaximo` es el techo que ninguna suma de localidades puede superar (R1 del modelo de
 * dominio). El recinto no conoce las localidades (viven en el contexto de venta): solo
 * ofrece la verificación del techo para que la oferta se construya dentro de lo autorizado.
 */
export class Recinto {
  private constructor(
    readonly recintoId: UUID,
    readonly nombre: string,
    readonly ciudad: string,
    readonly aforoMaximo: number,
  ) {}

  static crear(nombre: string, ciudad: string, aforoMaximo: number, recintoId: UUID = nuevoId()): Recinto {
    if (nombre.trim() === "" || ciudad.trim() === "") {
      throw new DatoDeCatalogoInvalido("Recinto", "El recinto necesita nombre y ciudad.");
    }
    if (!Number.isInteger(aforoMaximo) || aforoMaximo <= 0) {
      throw new DatoDeCatalogoInvalido("aforoMaximo", `El aforo máximo del recinto debe ser un entero positivo (recibido: ${aforoMaximo}).`);
    }
    return new Recinto(recintoId, nombre, ciudad, aforoMaximo);
  }

  /**
   * R1: la suma de los aforos autorizados de las localidades de un evento en este recinto no
   * puede superar `aforoMaximo`. Lanza si se excede; se usa al configurar la oferta.
   */
  exigirCabe(aforoTotalLocalidades: number): void {
    if (aforoTotalLocalidades > this.aforoMaximo) {
      throw new AforoDelRecintoExcedido(this.recintoId, aforoTotalLocalidades, this.aforoMaximo);
    }
  }

  cabe(aforoTotalLocalidades: number): boolean {
    return aforoTotalLocalidades <= this.aforoMaximo;
  }
}
