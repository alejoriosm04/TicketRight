import type { Dinero } from "./money.js";
import type { IdOpaco, UUID } from "./ids.js";

export interface DatosDeEmision {
  eventoId: UUID;
  localidadId: UUID;
  sillaId?: UUID;
  pagoId: UUID;
  fanId: UUID;
  identidadRef: IdOpaco;
  precioNominal: Dinero;
}

export interface BoletaEmitida {
  boletaId: UUID;
  codigo: string;
  version: number;
}

export interface EmisorDeBoletas {
  emitir(datos: DatosDeEmision): Promise<BoletaEmitida>;
}
