import { randomUUID } from "node:crypto";

export type UUID = string;
export type IdOpaco = string;
export type NIT = string;

export function nuevoId(): UUID {
  return randomUUID();
}
