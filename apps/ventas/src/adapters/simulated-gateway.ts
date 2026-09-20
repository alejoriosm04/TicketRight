import type { ConfirmarPago, Pago, PasarelaDePago } from "@ticketright/sales";

export type PerfilDePasarela = "normal" | "tardia" | "repetida" | "rechaza";

export interface OpcionesDePasarelaSimulada {
  perfil: PerfilDePasarela;
  retrasoMs: number;
  webhookUrl: string;
}

export class PasarelaSimulada implements PasarelaDePago {
  readonly cobros: Pago[] = [];

  constructor(private readonly opciones: OpcionesDePasarelaSimulada) {}

  async cobrar(pago: Pago, _tokenTarjeta: string): Promise<void> {
    this.cobros.push(pago);
    const aprobado = this.opciones.perfil !== "rechaza";
    const demora =
      this.opciones.perfil === "tardia"
        ? Math.max(this.opciones.retrasoMs, 45000)
        : this.opciones.retrasoMs;
    setTimeout(() => {
      void this.enviarWebhook(pago, aprobado);
    }, demora);
  }

  async verificarFirma(_cmd: ConfirmarPago): Promise<boolean> {
    return true;
  }

  async confirmarManualmente(pago: Pago): Promise<void> {
    await this.enviarWebhook(pago, true);
  }

  private async enviarWebhook(pago: Pago, aprobado: boolean): Promise<void> {
    const cuerpo = {
      pagoId: pago.id,
      referenciaExterna: `simulada-${pago.claveIdempotencia}`,
      aprobado,
      firma: "simulada",
    };
    const enviar = () =>
      fetch(this.opciones.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
    try {
      await enviar();
      if (this.opciones.perfil === "repetida") {
        setTimeout(() => {
          void enviar();
        }, 3000);
      }
    } catch (error) {
      console.error("la pasarela simulada no pudo entregar el webhook", error);
    }
  }
}
