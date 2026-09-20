import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const layers = ["domain", "application", "ports", "adapters"] as const;

describe("hexagonal structure", () => {
  it.each(layers)("includes the %s layer", (layer) => {
    const path = fileURLToPath(new URL(`../src/${layer}`, import.meta.url));
    expect(existsSync(path)).toBe(true);
  });
});
