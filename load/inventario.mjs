// Inventario de las pruebas de carga (volumetría, Entrega 3).
//
//   node --env-file-if-exists=.env load/inventario.mjs preparar <aforo>
//   node --env-file-if-exists=.env load/inventario.mjs verificar [archivo.json]
//
// «preparar» crea la localidad de carga en el evento de la demo, con el aforo escalado de
// las 5.000 boletas de la volumetría. Va después de `npm run db:seed`, que deja la base
// limpia. «verificar» mide, directo en PostgreSQL, lo que ninguna respuesta HTTP puede
// garantizar: que no hubo sobreventa (A-2) y que ningún turno compró dos veces.
import { writeFileSync } from "node:fs";

import pg from "pg";

// Mismos ids que usan main.ts y el guion de k6.
export const EVENTO_DEMO = "11111111-1111-4111-8111-111111111111";
export const LOCALIDAD_CARGA = "c4a60000-0000-4000-8000-000000000001";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgres://ticketright:ticketright@localhost:5433/ticketright",
});

async function preparar(aforo) {
  if (!Number.isInteger(aforo) || aforo <= 0) {
    throw new Error(`aforo inválido: ${aforo}`);
  }
  await pool.query(
    `insert into localidades (localidad_id, evento_id, nombre, tipo, precio_centavos,
       aforo_autorizado, aforo_reservado, aforo_vendido)
     values ($1, $2, 'Prueba de carga (k6)', 'general', 15000000, $3, 0, 0)
     on conflict (localidad_id) do update
       set aforo_autorizado = excluded.aforo_autorizado, aforo_reservado = 0, aforo_vendido = 0`,
    [LOCALIDAD_CARGA, EVENTO_DEMO, aforo],
  );
  console.log(`localidad de carga lista: ${LOCALIDAD_CARGA} · aforo ${aforo}`);
}

async function verificar(archivo) {
  const uno = async (sql) => (await pool.query(sql, [LOCALIDAD_CARGA])).rows[0];
  const localidad = await uno(
    `select aforo_autorizado, aforo_reservado, aforo_vendido from localidades where localidad_id = $1`,
  );
  if (!localidad) {
    throw new Error("no existe la localidad de carga; corre «preparar» antes de k6");
  }
  const reservas = (
    await pool.query(
      `select r.estado, count(distinct r.reserva_id)::int as reservas, sum(i.cantidad)::int as unidades
       from reservas r join items_reserva i on i.reserva_id = r.reserva_id
       where i.localidad_id = $1 group by r.estado order by r.estado`,
      [LOCALIDAD_CARGA],
    )
  ).rows;
  const { boletas } = await uno(
    `select count(*)::int as boletas from boletas where localidad_id = $1 and estado <> 'anulada'`,
  );
  const { turnos_repetidos } = await uno(
    `select count(*)::int as turnos_repetidos from (
       select r.turno_id from reservas r join items_reserva i on i.reserva_id = r.reserva_id
       where i.localidad_id = $1 group by r.turno_id having count(distinct r.reserva_id) > 1) t`,
  );
  const { discrepancias } = await uno(
    `select count(*)::int as discrepancias from discrepancias d
     join pagos p on p.pago_id = d.pago_id
     join items_reserva i on i.reserva_id = p.origen_id
     where i.localidad_id = $1 and d.resuelta_en is null`,
  );
  const vivas = reservas
    .filter((fila) => fila.estado === "vigente" || fila.estado === "enPago")
    .reduce((suma, fila) => suma + fila.unidades, 0);
  const comprometido = vivas + boletas;
  const informe = {
    localidad: LOCALIDAD_CARGA,
    aforo_autorizado: localidad.aforo_autorizado,
    contador_reservado: localidad.aforo_reservado,
    contador_vendido: localidad.aforo_vendido,
    unidades_en_reservas_vivas: vivas,
    boletas_validas: boletas,
    sobreventa: Math.max(0, comprometido - localidad.aforo_autorizado),
    contador_coherente:
      localidad.aforo_reservado === vivas && localidad.aforo_vendido === boletas,
    turnos_con_mas_de_una_reserva: turnos_repetidos,
    discrepancias_abiertas: discrepancias,
    reservas_por_estado: reservas,
  };
  console.log(JSON.stringify(informe, null, 2));
  if (archivo) {
    writeFileSync(archivo, JSON.stringify(informe, null, 2));
  }
  const aprobado =
    informe.sobreventa === 0 && informe.contador_coherente && informe.turnos_con_mas_de_una_reserva === 0;
  console.log(aprobado ? "INVENTARIO: OK" : "INVENTARIO: FALLA");
  return aprobado;
}

const [modo, argumento] = process.argv.slice(2);
try {
  if (modo === "preparar") {
    await preparar(Number(argumento));
  } else if (modo === "verificar") {
    process.exitCode = (await verificar(argumento)) ? 0 : 1;
  } else {
    console.error("uso: inventario.mjs preparar <aforo> | verificar [archivo.json]");
    process.exitCode = 2;
  }
} finally {
  await pool.end();
}
