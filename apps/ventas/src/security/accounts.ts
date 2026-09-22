import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

import type { Consultable } from "../db/pool.js";
import { CifradoDeCampos, createHmacSignature, timingSafeEqualStr } from "./crypto-utils.js";

/**
 * Cuentas de fan (contexto de identidad; homólogo local de Amazon Cognito, AD-004).
 * - La contraseña se guarda con hash scrypt + sal (nunca en claro).
 * - El nombre y el documento (PII) se guardan cifrados con AES-256-GCM (homólogo KMS).
 * - La sesión se representa con un JWT de sesión firmado (HS256).
 * El resto del sistema sigue usando un identificador opaco; la PII no sale de aquí.
 */
export interface Perfil {
  cuentaId: string;
  correo: string;
  nombre: string;
  documento: string;
}

function hashClave(clave: string, salHex?: string): string {
  const sal = salHex ?? randomBytes(16).toString("hex");
  const derivada = scryptSync(clave, sal, 32).toString("hex");
  return `${sal}:${derivada}`;
}
function verificarClave(clave: string, almacenado: string): boolean {
  const [sal, derivadaHex] = almacenado.split(":");
  if (!sal || !derivadaHex) return false;
  const esperado = scryptSync(clave, sal, 32);
  const actual = Buffer.from(derivadaHex, "hex");
  return esperado.length === actual.length && timingSafeEqual(esperado, actual);
}

export class ServicioDeCuentas {
  private readonly cifrado: CifradoDeCampos;

  constructor(
    private readonly db: Consultable,
    private readonly secretoSesion: string,
    secretoPii: string,
  ) {
    this.cifrado = new CifradoDeCampos(secretoPii);
  }

  async registrar(correo: string, clave: string, nombre: string, documento: string): Promise<{ token: string; perfil: Perfil }> {
    const existe = await this.db.query("select 1 from cuentas where correo = $1", [correo.toLowerCase()]);
    if (existe.rows.length > 0) {
      throw new Error("Ya existe una cuenta con ese correo");
    }
    const cuentaId = randomUUID();
    await this.db.query(
      `insert into cuentas (cuenta_id, correo, clave_hash, nombre_cifrado, documento_cifrado)
       values ($1, $2, $3, $4, $5)`,
      [cuentaId, correo.toLowerCase(), hashClave(clave), this.cifrado.cifrar(nombre), this.cifrado.cifrar(documento)],
    );
    const perfil: Perfil = { cuentaId, correo: correo.toLowerCase(), nombre, documento };
    return { token: this.firmarSesion(cuentaId, correo.toLowerCase()), perfil };
  }

  async ingresar(correo: string, clave: string): Promise<{ token: string; perfil: Perfil }> {
    const { rows } = await this.db.query(
      "select cuenta_id, correo, clave_hash, nombre_cifrado, documento_cifrado from cuentas where correo = $1",
      [correo.toLowerCase()],
    );
    const fila = rows[0];
    if (!fila || !verificarClave(clave, String(fila.clave_hash))) {
      throw new Error("Correo o contraseña incorrectos");
    }
    const perfil = this.aPerfil(fila);
    return { token: this.firmarSesion(perfil.cuentaId, perfil.correo), perfil };
  }

  async perfil(cuentaId: string): Promise<Perfil> {
    const { rows } = await this.db.query(
      "select cuenta_id, correo, nombre_cifrado, documento_cifrado from cuentas where cuenta_id = $1",
      [cuentaId],
    );
    if (!rows[0]) throw new Error("Cuenta no encontrada");
    return this.aPerfil(rows[0]);
  }

  async actualizar(cuentaId: string, nombre: string, documento: string): Promise<Perfil> {
    await this.db.query(
      "update cuentas set nombre_cifrado = $2, documento_cifrado = $3 where cuenta_id = $1",
      [cuentaId, this.cifrado.cifrar(nombre), this.cifrado.cifrar(documento)],
    );
    return this.perfil(cuentaId);
  }

  /** Valida el JWT de sesión y devuelve el cuentaId, o null si no es válido. */
  validarSesion(token: string): string | null {
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    const [cab, cuerpo, firma] = partes;
    if (!timingSafeEqualStr(firma ?? "", createHmacSignature(`${cab}.${cuerpo}`, this.secretoSesion))) return null;
    try {
      const datos = JSON.parse(Buffer.from(cuerpo ?? "", "base64url").toString("utf8"));
      if (datos.exp && Date.now() / 1000 >= datos.exp) return null;
      return String(datos.sub);
    } catch {
      return null;
    }
  }

  private firmarSesion(cuentaId: string, correo: string): string {
    const cab = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const cuerpo = Buffer.from(
      JSON.stringify({ sub: cuentaId, correo, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }),
    ).toString("base64url");
    return `${cab}.${cuerpo}.${createHmacSignature(`${cab}.${cuerpo}`, this.secretoSesion)}`;
  }

  private aPerfil(fila: Record<string, unknown>): Perfil {
    return {
      cuentaId: String(fila.cuenta_id),
      correo: String(fila.correo),
      nombre: fila.nombre_cifrado ? this.cifrado.descifrar(String(fila.nombre_cifrado)) : "",
      documento: fila.documento_cifrado ? this.cifrado.descifrar(String(fila.documento_cifrado)) : "",
    };
  }

  async inicializar(): Promise<void> {
    await this.db.query(
      `create table if not exists cuentas (
         cuenta_id uuid primary key,
         correo text not null unique,
         clave_hash text not null,
         nombre_cifrado text,
         documento_cifrado text,
         creada_en timestamptz not null default now()
       )`,
    );
  }
}
