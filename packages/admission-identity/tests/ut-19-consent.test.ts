import { fecha } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import { ConsentimientoNoVigente, Fan } from "../src/index.js";

describe("UT-19 el consentimiento revocado deniega la entrega de datos", () => {
  it("deniega la finalidad revocada, registra el intento y no acepta otra finalidad", () => {
    const fan = new Fan("fan-1", "ref-opaca-1");
    fan.otorgarConsentimiento("transferenciaAlPromotor", fecha("2026-09-01T09:00:00.000-05:00"));
    fan.revocarConsentimiento("transferenciaAlPromotor", fecha("2026-09-05T09:00:00.000-05:00"));

    expect(() => fan.autorizarCompartirDatos("transferenciaAlPromotor")).toThrow(
      ConsentimientoNoVigente,
    );
    expect(fan.intentosDenegados).toBe(1);

    const fanConEmision = new Fan("fan-2", "ref-opaca-2");
    fanConEmision.otorgarConsentimiento("emision", fecha("2026-09-01T09:00:00.000-05:00"));
    expect(() => fanConEmision.autorizarCompartirDatos("transferenciaAlPromotor")).toThrow(
      ConsentimientoNoVigente,
    );
    expect(fanConEmision.intentosDenegados).toBe(1);

    fanConEmision.otorgarConsentimiento(
      "transferenciaAlPromotor",
      fecha("2026-09-06T09:00:00.000-05:00"),
    );
    expect(() => fanConEmision.autorizarCompartirDatos("transferenciaAlPromotor")).not.toThrow();
  });
});
