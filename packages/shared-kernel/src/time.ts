export type FechaHora = Date;

export function fecha(iso: string): FechaHora {
  return new Date(iso);
}

export class Duracion {
  private constructor(readonly milisegundos: number) {}

  static segundos(n: number): Duracion {
    return new Duracion(n * 1000);
  }

  static minutos(n: number): Duracion {
    return new Duracion(n * 60 * 1000);
  }

  static horas(n: number): Duracion {
    return new Duracion(n * 60 * 60 * 1000);
  }

  static dias(n: number): Duracion {
    return new Duracion(n * 24 * 60 * 60 * 1000);
  }

  sumarA(instante: FechaHora): FechaHora {
    return new Date(instante.getTime() + this.milisegundos);
  }

  restarA(instante: FechaHora): FechaHora {
    return new Date(instante.getTime() - this.milisegundos);
  }
}

export interface RangoFecha {
  readonly inicio: FechaHora;
  readonly fin: FechaHora;
}

export function rango(inicio: FechaHora, fin: FechaHora): RangoFecha {
  if (fin.getTime() < inicio.getTime()) {
    throw new Error("El fin del rango no puede ser anterior al inicio");
  }
  return { inicio, fin };
}

export function dentroDelRango(fecha: FechaHora, rangoFecha: RangoFecha): boolean {
  return fecha.getTime() >= rangoFecha.inicio.getTime() && fecha.getTime() <= rangoFecha.fin.getTime();
}

export function diaCalendario(instante: FechaHora): number {
  return Date.UTC(instante.getFullYear(), instante.getMonth(), instante.getDate());
}
