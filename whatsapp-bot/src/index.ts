import path from 'node:path';
import { getEnabledRestaurants } from './restaurants';
import { BaileysAdapter } from './messaging/baileys-adapter';
import { createMessageHandler } from './engine';
import { catchUpPendingStatusNotifications, watchOrderStatus } from './status-watcher';
import { autoExpireStalePauses } from './sessions';

const SESSIONS_ROOT = path.join(__dirname, '..', 'sessions');

async function startRestaurant(restaurantId: string, name: string): Promise<void> {
  console.log(`[Bot] Subindo sessão de "${name}" (${restaurantId})...`);

  const adapter = new BaileysAdapter({ restaurantId, sessionsRoot: SESSIONS_ROOT });
  adapter.onMessage(createMessageHandler(restaurantId, adapter));
  await adapter.start();

  watchOrderStatus(restaurantId, adapter);
  await catchUpPendingStatusNotifications(restaurantId, adapter);
}

async function main(): Promise<void> {
  const restaurants = await getEnabledRestaurants();

  if (restaurants.length === 0) {
    console.warn(
      '[Bot] Nenhum restaurante com whatsapp_bot_enabled=true. Rode "npm run connect -- <restaurantId>" pra parear um número e depois habilite a flag no banco (ver README).'
    );
  }

  for (const restaurant of restaurants) {
    await startRestaurant(restaurant.id, restaurant.name).catch((err) => {
      console.error(`[Bot] Falha ao subir "${restaurant.name}" (${restaurant.id}):`, err);
    });
  }

  // Rede de segurança do "atendente": libera pausas esquecidas de tempos em
  // tempos, mesmo que ninguém reative pelo painel.
  setInterval(() => {
    autoExpireStalePauses().catch((err) => console.error('[Bot] Erro ao expirar pausas antigas:', err));
  }, 15 * 60 * 1000);
}

main().catch((err) => {
  console.error('[Bot] Erro fatal ao iniciar:', err);
  process.exit(1);
});
