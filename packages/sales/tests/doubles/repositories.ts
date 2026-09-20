import type { FechaHora, UUID } from "@ticketright/shared-kernel";

import type {
  RepositorioDeCompras,
  RepositorioDeDiscrepancias,
  RepositorioDeLocalidades,
  RepositorioDePagos,
  RepositorioDeReservas,
} from "../../src/index.js";
import type { CompraEnCurso } from "../../src/index.js";
import type { Discrepancia } from "../../src/index.js";
import type { Localidad } from "../../src/index.js";
import type { Pago } from "../../src/index.js";
import type { Reserva } from "../../src/index.js";

export class InMemoryLocalidades implements RepositorioDeLocalidades {
  private readonly items = new Map<UUID, Localidad>();

  agregar(localidad: Localidad): void {
    this.items.set(localidad.localidadId, localidad);
  }

  async obtenerParaActualizar(localidadId: UUID): Promise<Localidad> {
    return this.exigir(this.items.get(localidadId), localidadId);
  }

  async guardar(localidad: Localidad): Promise<void> {
    this.items.set(localidad.localidadId, localidad);
  }

  private exigir(localidad: Localidad | undefined, localidadId: UUID): Localidad {
    if (!localidad) {
      throw new Error(`No existe la localidad ${localidadId}`);
    }
    return localidad;
  }
}

export class InMemoryReservas implements RepositorioDeReservas {
  private readonly items = new Map<UUID, Reserva>();

  agregar(reserva: Reserva): void {
    this.items.set(reserva.reservaId, reserva);
  }

  async obtener(reservaId: UUID): Promise<Reserva> {
    const reserva = this.items.get(reservaId);
    if (!reserva) {
      throw new Error(`No existe la reserva ${reservaId}`);
    }
    return reserva;
  }

  async guardar(reserva: Reserva): Promise<void> {
    this.items.set(reserva.reservaId, reserva);
  }

  async vencidasA(ahora: FechaHora): Promise<readonly Reserva[]> {
    return [...this.items.values()].filter(
      (reserva) =>
        (reserva.estado === "vigente" || reserva.estado === "enPago") &&
        reserva.venceEn.getTime() <= ahora.getTime(),
    );
  }
}

export class InMemoryPagos implements RepositorioDePagos {
  private readonly items = new Map<UUID, Pago>();

  async obtener(pagoId: UUID): Promise<Pago> {
    const pago = this.items.get(pagoId);
    if (!pago) {
      throw new Error(`No existe el pago ${pagoId}`);
    }
    return pago;
  }

  async porClaveIdempotencia(clave: string): Promise<Pago | undefined> {
    return [...this.items.values()].find((pago) => pago.claveIdempotencia === clave);
  }

  async porReserva(reservaId: UUID): Promise<Pago | undefined> {
    return [...this.items.values()].find(
      (pago) => pago.origen.tipo === "reserva" && pago.origen.referenciaId === reservaId,
    );
  }

  async guardar(pago: Pago): Promise<void> {
    this.items.set(pago.pagoId, pago);
  }
}

export class InMemoryCompras implements RepositorioDeCompras {
  private readonly items = new Map<UUID, CompraEnCurso>();

  async obtener(compraId: UUID): Promise<CompraEnCurso> {
    const compra = this.items.get(compraId);
    if (!compra) {
      throw new Error(`No existe la compra ${compraId}`);
    }
    return compra;
  }

  async porReserva(reservaId: UUID): Promise<CompraEnCurso | undefined> {
    return [...this.items.values()].find((compra) => compra.reservaId === reservaId);
  }

  async porPago(pagoId: UUID): Promise<CompraEnCurso | undefined> {
    return [...this.items.values()].find((compra) => compra.pagoId === pagoId);
  }

  async guardar(compra: CompraEnCurso): Promise<void> {
    this.items.set(compra.compraId, compra);
  }
}

export class InMemoryDiscrepancias implements RepositorioDeDiscrepancias {
  private readonly items: Discrepancia[] = [];

  get todas(): readonly Discrepancia[] {
    return this.items;
  }

  async guardar(discrepancia: Discrepancia): Promise<void> {
    const indice = this.items.findIndex((existente) => existente.id === discrepancia.id);
    if (indice >= 0) {
      this.items[indice] = discrepancia;
      return;
    }
    this.items.push(discrepancia);
  }

  async abiertasPorPago(pagoId: UUID): Promise<readonly Discrepancia[]> {
    return this.items.filter(
      (discrepancia) => discrepancia.pagoId === pagoId && discrepancia.estaAbierta,
    );
  }
}
