// Validação simples de telefone brasileiro com DDD (fixo: 10 dígitos,
// celular: 11 dígitos), aceitando qualquer formatação (parênteses, espaço,
// traço) já que só olhamos os dígitos.
export function isValidBrazilianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (digits[0] === '0') return false;
  return true;
}
