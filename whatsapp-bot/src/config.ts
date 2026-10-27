import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}. Veja .env.example.`);
  }
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  apiBaseUrl: requireEnv('SIZZLE_API_BASE_URL').replace(/\/$/, ''),
  botApiToken: requireEnv('WHATSAPP_BOT_API_TOKEN'),
  sessionExpiryMinutes: intEnv('SESSION_EXPIRY_MINUTES', 30),
  rateLimitMaxMessages: intEnv('RATE_LIMIT_MAX_MESSAGES', 20),
  rateLimitWindowSeconds: intEnv('RATE_LIMIT_WINDOW_SECONDS', 60),
  pauseAutoExpireHours: intEnv('PAUSE_AUTO_EXPIRE_HOURS', 4),
};
