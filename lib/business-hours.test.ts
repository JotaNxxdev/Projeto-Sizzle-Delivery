import { describe, expect, it } from 'vitest';
import { formatBusinessHoursSummary, isWithinBusinessHours } from './business-hours';
import type { BusinessHours, DayHours } from './types';

const CLOSED: DayHours = { enabled: false, open: '00:00', close: '00:00' };

function makeHours(overrides: Partial<Record<number, DayHours>>): BusinessHours {
  const base: BusinessHours = Array.from({ length: 7 }, () => ({ ...CLOSED }));
  for (const [index, hours] of Object.entries(overrides)) {
    if (hours) base[Number(index)] = hours;
  }
  return base;
}

// Horários em UTC escolhidos pra cair num horário conhecido em São Paulo
// (UTC-3, sem horário de verão atualmente).
function utcDate(isoWithoutTz: string): Date {
  return new Date(`${isoWithoutTz}Z`);
}

describe('isWithinBusinessHours', () => {
  it('considera sempre aberta quando não há horário configurado', () => {
    expect(isWithinBusinessHours(null)).toBe(true);
    expect(isWithinBusinessHours(makeHours({}))).toBe(true);
  });

  it('está aberta dentro do horário do dia (sexta 18:00-23:00)', () => {
    const hours = makeHours({ 5: { enabled: true, open: '18:00', close: '23:00' } });
    // 2026-10-23 é sexta-feira; 21:30 UTC = 18:30 em São Paulo.
    expect(isWithinBusinessHours(hours, utcDate('2026-10-23T21:30:00'))).toBe(true);
  });

  it('está fechada fora do horário do dia', () => {
    const hours = makeHours({ 5: { enabled: true, open: '18:00', close: '23:00' } });
    // 18:00 UTC = 15:00 em São Paulo, antes de abrir.
    expect(isWithinBusinessHours(hours, utcDate('2026-10-23T18:00:00'))).toBe(false);
  });

  it('considera aberta depois da meia-noite quando o turno atravessa o dia', () => {
    // Sexta 18:00 - sábado 02:00.
    const hours = makeHours({ 5: { enabled: true, open: '18:00', close: '02:00' } });
    // Sábado 01:00 em São Paulo = 04:00 UTC.
    expect(isWithinBusinessHours(hours, utcDate('2026-10-24T04:00:00'))).toBe(true);
  });

  it('fecha depois do horário de virada da madrugada', () => {
    const hours = makeHours({ 5: { enabled: true, open: '18:00', close: '02:00' } });
    // Sábado 03:00 em São Paulo = 06:00 UTC, já passou do close de 02:00.
    expect(isWithinBusinessHours(hours, utcDate('2026-10-24T06:00:00'))).toBe(false);
  });
});

describe('formatBusinessHoursSummary', () => {
  it('retorna vazio sem horário configurado', () => {
    expect(formatBusinessHoursSummary(null)).toEqual([]);
    expect(formatBusinessHoursSummary(makeHours({}))).toEqual([]);
  });

  it('agrupa dias consecutivos com o mesmo horário', () => {
    const sameHours: DayHours = { enabled: true, open: '18:00', close: '23:00' };
    const hours = makeHours({ 1: sameHours, 2: sameHours, 3: sameHours, 4: sameHours, 5: sameHours });
    expect(formatBusinessHoursSummary(hours)).toEqual(['Seg a Sex: 18:00 às 23:00']);
  });

  it('separa dias com horários diferentes', () => {
    const hours = makeHours({
      0: { enabled: true, open: '12:00', close: '16:00' },
      6: { enabled: true, open: '18:00', close: '23:00' },
    });
    expect(formatBusinessHoursSummary(hours)).toEqual(['Dom: 12:00 às 16:00', 'Sáb: 18:00 às 23:00']);
  });
});
