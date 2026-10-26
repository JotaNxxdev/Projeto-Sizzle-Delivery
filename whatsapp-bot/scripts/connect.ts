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

  // Tempo máximo esperando você escanear. O QR Code em si expira bem antes
  // disso (uns 20-60s), mas o adaptador gera um novo automaticamente
  // (reconecta sozinho) sempre que o anterior expira — por isso dá pra
  // esperar bastante aqui sem problema, o processo só encerra de verdade
  // quando a conexão abre (pareamento concluído) ou esse prazo acaba.
  const TIMEOUT_MS = 2 * 60 * 1000;

  const opened = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), TIMEOUT_MS);

    const adapter = new BaileysAdapter({
      restaurantId,
      sessionsRoot: SESSIONS_ROOT,
      onQr: (qr) => {
        console.log('\nNovo QR Code (escaneie assim que aparecer, ele expira rápido):\n');
        qrcodeTerminal.generate(qr, { small: true });
      },
      onOpen: () => {
        clearTimeout(timer);
        resolve(true);
      },
    });

    adapter.onMessage(async () => {
      /* não responde mensagens durante o pareamento */
    });

    adapter.start().catch((err) => {
      clearTimeout(timer);
      console.error('Erro ao iniciar a conexão:', err);
      resolve(false);
    });
  });

  if (!opened) {
    console.error(
      `\nNinguém escaneou o QR Code em ${TIMEOUT_MS / 1000}s — encerrando. Rode "npm run connect -- ${restaurantId}" de novo quando puder escanear na hora.`
    );
    process.exit(1);
  }

  // Dá um tempo pra credencial terminar de salvar em disco antes de encerrar
  // (o evento 'creds.update' que grava em sessions/ pode disparar um
  // instante depois do 'open').
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(
    '\n✅ Pareado com sucesso! Agora rode no SQL Editor do Supabase:\n' +
      `  update restaurants set whatsapp_bot_enabled = true where id = '${restaurantId}';\n` +
      'e suba o processo principal (npm start / PM2) pra esse restaurante passar a atender de verdade.'
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao parear:', err);
  process.exit(1);
});
