import { diaCalendario, type FechaHora } from "@ticketright/shared-kernel";

const UN_DIA = 24 * 60 * 60 * 1000;

export function esDiaHabil(instante: FechaHora): boolean {
  const dia = instante.getDay();
  return dia >= 1 && dia <= 5;
}

export function diasHabilesTranscurridos(desde: FechaHora, hasta: FechaHora): number {
  const inicio = diaCalendario(desde);
  const fin = diaCalendario(hasta);
  if (fin < inicio) {
    return 0;
  }
  let dias = 0;
  for (let marca = inicio + UN_DIA; marca <= fin; marca += UN_DIA) {
    if (esDiaHabil(new Date(marca))) {
      dias += 1;
    }
  }
  return dias;
}
