import { describe, expect, it } from 'vitest';
import { isValidImageUrl } from './image-url';

describe('isValidImageUrl', () => {
  it('aceita string vazia (campo opcional)', () => {
    expect(isValidImageUrl('')).toBe(true);
  });

  it('aceita URL normal de imagem', () => {
    expect(isValidImageUrl('https://exemplo.com/imagem.jpg')).toBe(true);
  });

  it('rejeita data URLs (base64 embutido)', () => {
    expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgoAAAANS')).toBe(false);
  });

  it('rejeita strings maiores que o limite', () => {
    expect(isValidImageUrl('https://exemplo.com/' + 'a'.repeat(600))).toBe(false);
  });
});
