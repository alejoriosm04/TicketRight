import { Boleta } from "@ticketright/entitlements";
import type { BoletaEmitida, DatosDeEmision, EmisorDeBoletas } from "@ticketright/shared-kernel";

import type { Consultable } from "../../db/pool.js";

export class EmisorDeBoletasPostgres implements EmisorDeBoletas {
  constructor(private readonly db: Consultable) {}

  async emitir(datos: DatosDeEmision): Promise<BoletaEmitida> {
    const boleta = Boleta.emitir(datos, new Date());
    const titularidad = boleta.titularidades[0];
    if (!titularidad) {
      throw new Error("La boleta nació sin titularidad");
    }
    const titular = titularidad.titular;
    await this.db.query(
      "insert into titulares (titular_id, fan_id, identidad_ref, estado) values ($1, $2, $3, $4)",
      [titular.titularId, titular.fanId, titular.identidadRef, titular.estado],
    );
    await this.db.query(
      `insert into boletas (boleta_id, evento_id, localidad_id, silla_id, pago_id, precio_nominal_centavos,
         moneda, codigo, version, estado, emitida_en, anulada_en)
       values ($1, $2, $3, $4, $5, $6, 'COP', $7, $8, $9, $10, $11)`,
      [
        boleta.boletaId,
        boleta.eventoId,
        boleta.localidadId,
        boleta.sillaId,
        boleta.pagoId,
        boleta.precioNominal.valorCentavos,
        boleta.codigo.valor,
        boleta.codigo.version,
        boleta.estado,
        boleta.emitidaEn,
        boleta.anuladaEn,
      ],
    );
    await this.db.query(
      `insert into titularidades (titularidad_id, boleta_id, titular_id, inicio, fin, estado)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        titularidad.titularidadId,
        boleta.boletaId,
        titular.titularId,
        titularidad.inicio,
        titularidad.finEn,
        titularidad.estado,
      ],
    );
    return {
      boletaId: boleta.boletaId,
      codigo: boleta.codigo.valor,
      version: boleta.codigo.version,
    };
  }
}

export interface BoletaResumen {
  boletaId: string;
  codigo: string;
  version: number;
  estado: string;
  sillaId: string | undefined;
  titularFanId: string | undefined;
}

export async function boletasPorPago(
  db: Consultable,
  pagoId: string,
): Promise<readonly BoletaResumen[]> {
  const { rows } = await db.query(
    `select b.boleta_id, b.codigo, b.version, b.estado, b.silla_id, t.fan_id
     from boletas b
     left join titularidades tt on tt.boleta_id = b.boleta_id and tt.estado = 'activa'
     left join titulares t on t.titular_id = tt.titular_id
     where b.pago_id = $1
     order by b.emitida_en, b.codigo`,
    [pagoId],
  );
  return rows.map((fila) => ({
    boletaId: String(fila.boleta_id),
    codigo: String(fila.codigo),
    version: Number(fila.version),
    estado: String(fila.estado),
    sillaId: fila.silla_id === null || fila.silla_id === undefined ? undefined : String(fila.silla_id),
    titularFanId: fila.fan_id === null || fila.fan_id === undefined ? undefined : String(fila.fan_id),
  }));
}
