import path from 'node:path';
import { db } from './db';
import { createMessageHandler } from './engine';
import { BaileysAdapter } from './messaging/baileys-adapter';
import { catchUpPendingStatusNotifications, watchOrderStatus } from './status-watcher';

export const SESSIONS_ROOT = path.join(__dirname, '..', 'sessions');

export type PairingState =
  | { status: 'pairing'; qr: string | null }
  | { status: 'connected' }
  | { status: 'failed' };

// Registro em memória de quem já está rodando (bootado no startup ou
// pareado agora pela tela do painel) — evita abrir uma segunda conexão
// Baileys pro mesmo restaurantId, o que corromperia a sessão dos dois lados.
const runningAdapters = new Map<string, BaileysAdapter>();

// Último QR/estado de cada pareamento em andamento, consultado pelo
// pairing-server.ts enquanto o dono ainda não escaneou.
export const pairingState = new Map<string, PairingState>();

export function isRunning(restaurantId: string): boolean {
  return runningAdapters.has(restaurantId);
}

// Sobe (ou reaproveita, se já estiver de pé) a sessão do WhatsApp de um
// restaurante: usado tanto no boot (index.ts, pra quem já está pareado)
// quanto pelo pairing-server.ts (primeiro pareamento, QR novo). Os dois
// casos são o mesmo código — useMultiFileAuthState decide sozinho se
// reconecta direto (sessão salva) ou gera QR (sessão nova).
export async function startRestaurant(restaurantId: string, name: string): Promise<BaileysAdapter> {
  const existing = runningAdapters.get(restaurantId);
  if (existing) return existing;

  console.log(`[Bot] Subindo sessão de "${name}" (${restaurantId})...`);

  const adapter = new BaileysAdapter({
    restaurantId,
    sessionsRoot: SESSIONS_ROOT,
    onQr: (qr) => pairingState.set(restaurantId, { status: 'pairing', qr }),
    onOpen: () => {
      pairingState.set(restaurantId, { status: 'connected' });
      // Antes só dava pra ligar via SQL manual (ver README) — agora o
      // próprio pareamento (seja pelo painel ou por "npm run connect")
      // habilita a flag sozinho assim que a conexão abre de verdade.
      db.from('restaurants')
        .update({ whatsapp_bot_enabled: true })
        .eq('id', restaurantId)
        .then(({ error }) => {
          if (error) {
            console.error(`[Bot ${restaurantId}] Erro ao habilitar whatsapp_bot_enabled:`, error.message);
          }
        });
    },
  });

  adapter.onMessage(createMessageHandler(restaurantId, adapter));

  try {
    await adapter.start();
  } catch (err) {
    pairingState.set(restaurantId, { status: 'failed' });
    throw err;
  }

  runningAdapters.set(restaurantId, adapter);
  watchOrderStatus(restaurantId, adapter);
  await catchUpPendingStatusNotifications(restaurantId, adapter);

  return adapter;
}
