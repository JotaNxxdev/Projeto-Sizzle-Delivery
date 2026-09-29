// Bloqueia salvar uma imagem inteira em base64 (ou qualquer string absurda)
// direto num campo de URL — isso é o que inflava a home pra vários MB antes
// de existir o upload de verdade (ver app/api/upload/route.ts). URLs reais
// de imagem hospedada nunca chegam perto desse tamanho.
const MAX_IMAGE_URL_LENGTH = 600;

export function isValidImageUrl(value: string): boolean {
  if (!value) return true; // campo opcional na maioria dos formulários
  if (value.length > MAX_IMAGE_URL_LENGTH) return false;
  if (value.startsWith('data:')) return false;
  return true;
}
