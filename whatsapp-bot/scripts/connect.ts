// Pareia o WhatsApp de UM restaurante por vez: mostra o QR Code no terminal,
// espera a conexão abrir e encerra sozinho (a sessão já fica salva em
// sessions/<restaurantId>/ pra o processo principal — npm start — reusar
// depois, sem precisar escanear de novo).
//
// Uso: npm run connect -- <restaurantId>
import path from 'node:path';
import qrcodeTerminal from 'qrcode-terminal';
import { getRestaurantByIdIgnoringBotFlag } from '../src/restaurants';
import { BaileysAdapter } from '../src/messaging/baileys-adapter';

const SESSIONS_ROOT = path.join(__dirname, '..', 'sessions');

async function main(): Promise<void> {
  const restaurantId = process.argv[2];
  if (!restaurantId) {
    console.error('Uso: npm run connect -- <restaurantId>');
    process.exit(1);
  }

  const restaurant = await getRestaurantByIdIgnoringBotFlag(restaurantId);
  if (!restaurant) {
    console.error(`Restaurante ${restaurantId} não encontrado.`);
    process.exit(1);
  }

  console.log(`Pareando WhatsApp de "${restaurant.name}" (${restaurantId})...`);
  console.log('Escaneie o QR Code abaixo no WhatsApp do número da loja:');
  console.log('WhatsApp > Configurações > Dispositivos conectados > Conectar um dispositivo\n');

  const adapter = new BaileysAdapter({
    restaurantId,
    sessionsRoot: SESSIONS_ROOT,
    onQr: (qr) => {
      qrcodeTerminal.generate(qr, { small: true });
    },
  });

  adapter.onMessage(async () => {
    /* não responde mensagens durante o pareamento */
  });

  await adapter.start();

  console.log(
    '\nSe a conexão abriu sem erro acima, está pareado! Agora rode no SQL Editor do Supabase:\n' +
      `  update restaurants set whatsapp_bot_enabled = true where id = '${restaurantId}';\n` +
      'e suba o processo principal (npm start / PM2) pra esse restaurante passar a atender de verdade.'
  );

  // Dá um tempo pra credencial terminar de salvar em disco antes de encerrar.
  setTimeout(() => process.exit(0), 5000);
}

main().catch((err) => {
  console.error('Erro ao parear:', err);
  process.exit(1);
});
