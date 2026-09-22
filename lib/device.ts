// Identifica este navegador para associar pedidos a ele, enquanto o app não
// tem autenticação de verdade (ver README para o próximo passo: Supabase Auth).
const STORAGE_KEY = 'sizzle_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
