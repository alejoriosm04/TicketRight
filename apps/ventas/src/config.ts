export interface Config {
  port: number;
  databaseUrl: string;
  pasarelaPerfil: "normal" | "tardia" | "repetida" | "rechaza";
  pasarelaRetrasoMs: number;
  intervaloVencimientoMs: number;
  maxIntentosEmision: number;
}

export function cargarConfig(): Config {
  const perfil = process.env.PASARELA_PERFIL ?? "normal";
  if (!["normal", "tardia", "repetida", "rechaza"].includes(perfil)) {
    throw new Error(`PASARELA_PERFIL inválido: ${perfil}`);
  }
  return {
    port: Number(process.env.PORT ?? 3000),
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgres://ticketright:ticketright@localhost:5433/ticketright",
    pasarelaPerfil: perfil as Config["pasarelaPerfil"],
    pasarelaRetrasoMs: Number(process.env.PASARELA_RETRASO_MS ?? 500),
    intervaloVencimientoMs: Number(process.env.VENCIMIENTO_INTERVALO_MS ?? 30000),
    maxIntentosEmision: Number(process.env.MAX_INTENTOS_EMISION ?? 5),
  };
}
