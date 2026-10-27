// Chama o servidor de pareamento do whatsapp-bot (roda no VPS, nunca na
// Vercel) pra mostrar o QR Code de conexão dentro do painel do dono, em vez
// de exigir "npm run connect" no terminal. Usa o mesmo WHATSAPP_BOT_API_TOKEN
// já compartilhado com o bot — aqui só na direção contrária (site -> bot).
const botUrl = process.env.WHATSAPP_BOT_URL?.replace(/\/$/, '');
const botToken = process.env.WHATSAPP_BOT_API_TOKEN;

export const isWhatsappBotConfigured = Boolean(botUrl && botToken);

const API_TIMEOUT_MS = 15 * 1000;

export type PairingStatus =
  | { status: 'idle' }
  | { status: 'pairing'; qr: string | null }
  | { status: 'connected' }
  | { status: 'failed' };

// Sem timeout aqui, o bot fora do ar (VPS caiu, reverse proxy mal configurado)
// deixava a tela "Configurar WhatsApp" girando pra sempre — mesmo problema que
// já resolvemos do outro lado (bot -> site) em order-client.ts.
async function callBot(path: string, init: RequestInit): Promise<PairingStatus> {
  if (!botUrl || !botToken) {
    throw new Error('Bot de WhatsApp não configurado (WHATSAPP_BOT_URL / WHATSAPP_BOT_API_TOKEN).');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${botUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-sizzle-bot-token': botToken },
      signal: controller.signal,
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(typeof json.error === 'string' ? json.error : 'Não foi possível falar com o bot de WhatsApp.');
    }
    return json as PairingStatus;
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    if (aborted) throw new Error('O bot de WhatsApp demorou demais pra responder.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function startWhatsappPairing(restaurantId: string): Promise<PairingStatus> {
  return callBot('/pairing/start', { method: 'POST', body: JSON.stringify({ restaurantId }) });
}

export async function getWhatsappPairingStatus(restaurantId: string): Promise<PairingStatus> {
  return callBot(`/pairing/status?restaurantId=${encodeURIComponent(restaurantId)}`, { method: 'GET' });
}
