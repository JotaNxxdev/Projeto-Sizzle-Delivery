import { describe, expect, it } from 'vitest';
import { formatCurrency } from './format';

// pt-BR usa espaço não separável (U+00A0) entre "R$" e o valor — por isso
// comparamos ignorando espaços em vez de usar um espaço comum na string esperada.
function normalize(value: string): string {
  return value.replace(/\s/g, ' ');
}

describe('formatCurrency', () => {
  it('formata valor inteiro em reais', () => {
    expect(normalize(formatCurrency(10))).toBe('R$ 10,00');
  });

  it('formata valor com centavos', () => {
    expect(normalize(formatCurrency(19.9))).toBe('R$ 19,90');
  });

  it('formata zero', () => {
    expect(normalize(formatCurrency(0))).toBe('R$ 0,00');
  });
});
