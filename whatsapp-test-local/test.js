// Teste isolado da biblioteca não-oficial Baileys (conecta como o WhatsApp Web).
// Rode SÓ no seu computador — nunca na Vercel, nunca em produção.
// Use de preferência um número separado (chip novo), não o seu pessoal.
//
// Como usar:
//   1. npm install
//   2. Edite TARGET_NUMBER abaixo com o número que vai RECEBER a mensagem de teste
//      (o seu próprio celular, formato só com dígitos + DDI 55, ex.: 5511999998888)
//   3. npm test
//   4. Escaneie o QR code que aparece no terminal com o WhatsApp do número que vai ENVIAR
//      (WhatsApp > Dispositivos conectados > Conectar um dispositivo)
//   5. Depois de conectar, o script envia uma mensagem de teste e encerra.

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const qrcode = require('qrcode-terminal');

const TARGET_NUMBER = '5511999998888'; // <-- troque pelo número que vai receber o teste

async function start() {
  // Guarda a sessão localmente (pasta ./auth) pra não precisar escanear o QR a cada vez.
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const socket = makeWASocket({
    auth: state,
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nEscaneie esse QR code com o WhatsApp (Dispositivos conectados > Conectar um dispositivo):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('\n✅ Conectado! Enviando mensagem de teste...');
      sendTestMessage(socket).catch((err) => {
        console.error('Erro ao enviar mensagem de teste:', err);
        process.exit(1);
      });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`\nConexão encerrada (loggedOut: ${loggedOut}).`);
      if (!loggedOut) {
        console.log('Tentando reconectar...');
        start();
      }
    }
  });
}

async function sendTestMessage(socket) {
  const jid = `${TARGET_NUMBER}@s.whatsapp.net`;
  await socket.sendMessage(jid, {
    text: 'Teste do Sizzle Delivery — se você recebeu essa mensagem, a automação funcionou! 🍔',
  });
  console.log(`✅ Mensagem enviada pra ${TARGET_NUMBER}.`);
  console.log('Encerrando em 3s...');
  setTimeout(() => process.exit(0), 3000);
}

start().catch((err) => {
  console.error('Erro ao iniciar:', err);
  process.exit(1);
});
