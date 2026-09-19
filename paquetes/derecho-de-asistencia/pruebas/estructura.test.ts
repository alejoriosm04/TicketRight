import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const capas = ["dominio", "aplicacion", "puertos", "adaptadores"] as const;

describe("estructura hexagonal", () => {
  it.each(capas)("incluye la capa %s", (capa) => {
    const ruta = fileURLToPath(new URL(`../src/${capa}`, import.meta.url));
    expect(existsSync(ruta)).toBe(true);
  });
});
