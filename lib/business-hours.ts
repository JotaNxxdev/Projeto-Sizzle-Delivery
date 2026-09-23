import type { BusinessHours } from './types';

export const DAY_LABELS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const WEEKDAY_TO_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function crossesMidnight(open: string, close: string): boolean {
  return timeToMinutes(close) <= timeToMinutes(open);
}

function isWithinRange(minutes: number, open: string, close: string): boolean {
  const openM = timeToMinutes(open);
  const closeM = timeToMinutes(close);
  if (closeM > openM) {
    return minutes >= openM && minutes < closeM;
  }
  // horário atravessa a meia-noite (ex.: 18:00 - 02:00)
  return minutes >= openM || minutes < closeM;
}

// Usa o fuso de São Paulo explicitamente — o servidor (Vercel) roda em UTC,
// então "new Date().getHours()" cru daria o horário errado pro dono no Brasil.
export function getSaoPauloDayAndMinutes(date: Date = new Date()): { day: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { day: WEEKDAY_TO_INDEX[weekday] ?? 0, minutes: hour * 60 + minute };
}

// Sem horário configurado (nenhum dia habilitado) = considera sempre aberta,
// pra não fechar sozinha uma loja que ainda não configurou nada — só o
// toggle manual de "pausar loja" continua valendo nesse caso.
export function isWithinBusinessHours(businessHours: BusinessHours | null | undefined, date: Date = new Date()): boolean {
  if (!businessHours || businessHours.length !== 7 || businessHours.every((day) => !day.enabled)) {
    return true;
  }

  const { day, minutes } = getSaoPauloDayAndMinutes(date);

  const today = businessHours[day];
  if (today?.enabled && isWithinRange(minutes, today.open, today.close)) {
    return true;
  }

  // Pode estar aberto depois da meia-noite com base no horário de ONTEM,
  // quando o turno de ontem atravessa pra hoje (ex.: sexta 18:00 - sábado 02:00).
  const yesterday = businessHours[(day + 6) % 7];
  if (yesterday?.enabled && crossesMidnight(yesterday.open, yesterday.close) && minutes < timeToMinutes(yesterday.close)) {
    return true;
  }

  return false;
}

// Agrupa dias consecutivos com o mesmo horário numa linha só, tipo
// "Seg a Sex: 18:00 às 23:00", pra exibir de forma compacta.
export function formatBusinessHoursSummary(businessHours: BusinessHours | null | undefined): string[] {
  if (!businessHours || businessHours.length !== 7 || businessHours.every((day) => !day.enabled)) {
    return [];
  }

  const lines: string[] = [];
  let i = 0;
  while (i < 7) {
    const day = businessHours[i];
    if (!day.enabled) {
      i += 1;
      continue;
    }
    let j = i;
    while (
      j + 1 < 7 &&
      businessHours[j + 1].enabled &&
      businessHours[j + 1].open === day.open &&
      businessHours[j + 1].close === day.close
    ) {
      j += 1;
    }
    const label = i === j ? DAY_LABELS_SHORT[i] : `${DAY_LABELS_SHORT[i]} a ${DAY_LABELS_SHORT[j]}`;
    lines.push(`${label}: ${day.open} às ${day.close}`);
    i = j + 1;
  }
  return lines;
}
