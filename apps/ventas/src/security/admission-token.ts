import { createHmacSignature, timingSafeEqualStr } from "./crypto-utils.js";

/**
 * Token de admisión JWT firmado (AD-004 §2 y AD-006). Homólogo local de la firma con KMS y
 * de Amazon Cognito: en producción el JWT lo firma un proveedor OIDC / KMS; aquí se firma
 * con HMAC-SHA256 y un secreto de ambiente (que en Kubernetes vendría de Secrets Manager).
 *
 * El token es corto, de un solo uso lógico (`jti`) y ligado a evento, usuario, audiencia y
 * expiración. Autoriza a INTENTAR reservar; no promete inventario. El gateway valida firma,
 * emisor, audiencia, expiración y evento antes de dejar pasar al checkout.
 */
const EMISOR = "ticketright-admision";
const AUDIENCIA = "ticketright-checkout";

export interface ContenidoTokenAdmision {
  sub: string; // identificador opaco del fan (no dato personal)
  event_id: string;
  jti: string; // uso único lógico
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export class EmisorDeTokenAdmision {
  constructor(
    private readonly secreto: string,
    private readonly vigenciaSegundos = 180, // 3 minutos (AD-004)
  ) {}

  /** Emite un JWT de admisión firmado para un fan y evento. */
  emitir(subOpaco: string, eventId: string, jti: string, ahoraMs = Date.now()): string {
    const iat = Math.floor(ahoraMs / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload: ContenidoTokenAdmision = {
      sub: subOpaco,
      event_id: eventId,
      jti,
      iat,
      exp: iat + this.vigenciaSegundos,
      iss: EMISOR,
      aud: AUDIENCIA,
    };
    const cabecera = base64url(JSON.stringify(header));
    const cuerpo = base64url(JSON.stringify(payload));
    const firma = createHmacSignature(`${cabecera}.${cuerpo}`, this.secreto);
    return `${cabecera}.${cuerpo}.${firma}`;
  }
}

export type ResultadoValidacion =
  | { valido: true; contenido: ContenidoTokenAdmision }
  | { valido: false; motivo: string };

export class ValidadorDeTokenAdmision {
  constructor(private readonly secreto: string) {}

  /** Valida firma, emisor, audiencia y expiración. No decide inventario. */
  validar(token: string, eventIdEsperado: string, ahoraMs = Date.now()): ResultadoValidacion {
    const partes = token.split(".");
    if (partes.length !== 3) {
      return { valido: false, motivo: "formato" };
    }
    const cabecera = partes[0] ?? "";
    const cuerpo = partes[1] ?? "";
    const firma = partes[2] ?? "";
    const firmaEsperada = createHmacSignature(`${cabecera}.${cuerpo}`, this.secreto);
    if (!timingSafeEqualStr(firma, firmaEsperada)) {
      return { valido: false, motivo: "firma" };
    }
    let contenido: ContenidoTokenAdmision;
    try {
      contenido = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    } catch {
      return { valido: false, motivo: "cuerpo" };
    }
    if (contenido.iss !== EMISOR) return { valido: false, motivo: "emisor" };
    if (contenido.aud !== AUDIENCIA) return { valido: false, motivo: "audiencia" };
    if (contenido.event_id !== eventIdEsperado) return { valido: false, motivo: "evento" };
    if (Math.floor(ahoraMs / 1000) >= contenido.exp) return { valido: false, motivo: "expirado" };
    return { valido: true, contenido };
  }
}
