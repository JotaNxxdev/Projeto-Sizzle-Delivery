import { getEnabledRestaurants } from './restaurants';
import { startRestaurant } from './bot-runtime';
import { startPairingServer } from './pairing-server';
import { autoExpireStalePauses } from './sessions';

async function main(): Promise<void> {
  const restaurants = await getEnabledRestaurants();

  if (restaurants.length === 0) {
    console.warn(
      '[Bot] Nenhum restaurante com whatsapp_bot_enabled=true ainda — pareie um pelo painel do dono (tela "WhatsApp" > "Configurar WhatsApp") ou via "npm run connect".'
    );
  }

  for (const restaurant of restaurants) {
    await startRestaurant(restaurant.id, restaurant.name).catch((err) => {
      console.error(`[Bot] Falha ao subir "${restaurant.name}" (${restaurant.id}):`, err);
    });
  }

  startPairingServer();

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
