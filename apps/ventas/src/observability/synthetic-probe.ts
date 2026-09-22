import { recorridosCriticos } from "./metrics.js";

/**
 * Sonda sintética del recorrido crítico (A-9, disponibilidad ≥ 99,9%). Cada cierto
 * tiempo ejecuta desde fuera el camino admisión → reserva → pago → emisión contra la
 * API y registra si el recorrido completo tuvo éxito. Es la fuente de la métrica
 * ticketright_critical_journey_checks_total del entregable de observabilidad.
 */
export interface OpcionesDeSonda {
  baseUrl: string;
  localidadId: string;
  fanId: string;
  intervaloMs: number;
}

export class SondaSintetica {
  private temporizador: NodeJS.Timeout | undefined;

  constructor(private readonly opciones: OpcionesDeSonda) {}

  iniciar(): void {
    this.temporizador = setInterval(() => {
      void this.ejecutar();
    }, this.opciones.intervaloMs);
  }

  detener(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  async ejecutar(): Promise<void> {
    try {
      const ok = await this.recorrido();
      recorridosCriticos.inc({ result: ok ? "ok" : "fallo" });
    } catch {
      recorridosCriticos.inc({ result: "fallo" });
    }
  }

  private async pedir(metodo: string, ruta: string, cuerpo?: unknown): Promise<any> {
    // La sonda actúa como un cliente legítimo (identidad + UA de navegador) para pasar el borde.
    const init: RequestInit = {
      method: metodo,
      headers: { "x-fan-id": this.opciones.fanId, "user-agent": "Mozilla/5.0 (sonda) Chrome/120" },
    };
    if (cuerpo !== undefined) {
      (init.headers as Record<string, string>)["content-type"] = "application/json";
      init.body = JSON.stringify(cuerpo);
    }
    const r = await fetch(`${this.opciones.baseUrl}${ruta}`, init);
    const texto = await r.text();
    if (!r.ok) {
      throw new Error(`${metodo} ${ruta} -> ${r.status}`);
    }
    return texto ? JSON.parse(texto) : {};
  }

  private async recorrido(): Promise<boolean> {
    const { fanId, localidadId } = this.opciones;
    const entrada = await this.pedir("POST", "/fila/entrar", { fanId });
    let token: string | undefined;
    for (let i = 0; i < 12; i += 1) {
      const estado = await this.pedir("GET", `/fila/${entrada.turnoId}`);
      if (estado.estado === "admitido") {
        token = estado.token;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!token) {
      return false;
    }
    const compra = await this.pedir("POST", "/compras", {
      fanId,
      tokenAdmision: token,
      localidadId,
      cantidad: 1,
    });
    await this.pedir("POST", `/compras/${compra.compraId}/pago`, {});
    for (let i = 0; i < 10; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      const estado = await this.pedir("GET", `/compras/${compra.compraId}`);
      if (estado.pago && estado.pago.estado !== "confirmado") {
        await this.pedir("POST", `/demo/pasarela/confirmar/${estado.pago.pagoId}`);
      }
      if (estado.compra.paso === "emitida") {
        return true;
      }
    }
    return false;
  }
}
