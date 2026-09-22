import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/** Firma HMAC-SHA256 en base64url (homólogo local de la firma con KMS). */
export function createHmacSignature(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

/** Comparación en tiempo constante de dos cadenas (evita ataques de temporización). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/**
 * Cifrado de datos personales con AES-256-GCM (AD-004 §3). Homólogo local de AWS KMS:
 * en producción la llave la administra KMS y rota; aquí se deriva de un secreto de ambiente
 * (que en Kubernetes vendría de Secrets Manager). Los campos identificables (nombre,
 * documento, correo, teléfono) se guardan cifrados; el resto del sistema usa un id opaco.
 */
export class CifradoDeCampos {
  private readonly clave: Buffer;

  constructor(secreto: string) {
    // Deriva una llave de 32 bytes del secreto. La sal fija es aceptable para la demo;
    // en producción KMS gestiona la llave y su rotación.
    this.clave = scryptSync(secreto, "ticketright-pii-salt", 32);
  }

  /** Cifra un valor; devuelve `iv:tag:ciphertext` en base64. */
  cifrar(textoPlano: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.clave, iv);
    const cifrado = Buffer.concat([cipher.update(textoPlano, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${cifrado.toString("base64")}`;
  }

  /** Descifra un valor producido por `cifrar`. */
  descifrar(cifrado: string): string {
    const partes = cifrado.split(":");
    const iv = Buffer.from(partes[0] ?? "", "base64");
    const tag = Buffer.from(partes[1] ?? "", "base64");
    const datosB64 = partes[2] ?? "";
    const decipher = createDecipheriv("aes-256-gcm", this.clave, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(datosB64, "base64")), decipher.final()]).toString("utf8");
  }
}
