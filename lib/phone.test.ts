import { describe, expect, it } from 'vitest';
import { isValidBrazilianPhone } from './phone';

describe('isValidBrazilianPhone', () => {
  it('aceita celular com 11 dígitos formatado', () => {
    expect(isValidBrazilianPhone('(11) 91234-5678')).toBe(true);
  });

  it('aceita fixo com 10 dígitos sem formatação', () => {
    expect(isValidBrazilianPhone('1133334444')).toBe(true);
  });

  it('rejeita quantidade de dígitos errada', () => {
    expect(isValidBrazilianPhone('123456789')).toBe(false);
    expect(isValidBrazilianPhone('123456789012')).toBe(false);
  });

  it('rejeita DDD começando com 0', () => {
    expect(isValidBrazilianPhone('01123456789')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidBrazilianPhone('')).toBe(false);
  });
});
