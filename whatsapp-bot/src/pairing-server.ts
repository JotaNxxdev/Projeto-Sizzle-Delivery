import http from 'node:http';
import { config } from './config';
import { getRestaurantByIdIgnoringBotFlag } from './restaurants';
import { isRunning, pairingState, startRestaurant } from './bot-runtime';

// Servidor HTTP minúsculo (sem framework — só duas rotas) que o site chama
// pra mostrar o QR Code de pareamento dentro do painel do dono, em vez de
// exigir "npm run connect" no terminal do VPS. Fica atrás de HTTPS/reverse
// proxy no VPS (ver README) — aqui só valida o token compartilhado com o
// site (o mesmo WHATSAPP_BOT_API_TOKEN usado na outra direção, bot -> site).
function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

async function handleStart(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const raw = await readBody(req);
  const restaurantId = (JSON.parse(raw || '{}') as { restaurantId?: string }).restaurantId;
  if (!restaurantId) return send(res, 400, { error: 'restaurantId é obrigatório.' });

  const restaurant = await getRestaurantByIdIgnoringBotFlag(restaurantId);
  if (!restaurant) return send(res, 404, { error: 'Restaurante não encontrado.' });

  if (isRunning(restaurantId)) return send(res, 200, { status: 'connected' });

  if (!pairingState.has(restaurantId)) {
    pairingState.set(restaurantId, { status: 'pairing', qr: null });
    startRestaurant(restaurantId, restaurant.name).catch((err) => {
      console.error(`[Bot ${restaurantId}] Erro ao parear pelo painel:`, err);
      pairingState.set(restaurantId, { status: 'failed' });
    });
  }

  send(res, 202, pairingState.get(restaurantId));
}

function handleStatus(url: URL, res: http.ServerResponse): void {
  const restaurantId = url.searchParams.get('restaurantId');
  if (!restaurantId) return send(res, 400, { error: 'restaurantId é obrigatório.' });

  if (isRunning(restaurantId)) return send(res, 200, { status: 'connected' });
  send(res, 200, pairingState.get(restaurantId) ?? { status: 'idle' });
}

export function startPairingServer(): void {
  const server = http.createServer((req, res) => {
    if (req.headers['x-sizzle-bot-token'] !== config.botApiToken) {
      return send(res, 401, { error: 'Token inválido.' });
    }

    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/pairing/start') {
      handleStart(req, res).catch(() => send(res, 400, { error: 'Requisição inválida.' }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/pairing/status') {
      handleStatus(url, res);
      return;
    }

    send(res, 404, { error: 'Rota não encontrada.' });
  });

  server.listen(config.pairingServerPort, () => {
    console.log(`[Bot] Servidor de pareamento ouvindo na porta ${config.pairingServerPort}.`);
  });
}
