import path from 'node:path';
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from 'baileys';
import type { WASocket } from 'baileys';
import qrcodeTerminal from 'qrcode-terminal';
import { normalizeWhatsappPhone } from '../wa-phone';
import type { IncomingMessage, MessagingAdapter } from './adapter';

export interface BaileysAdapterOptions {
  restaurantId: string;
  sessionsRoot: string;
  // Se não for passado, o QR Code é só impresso no terminal (uso pelo
  // scripts/connect.ts). O index.ts (bootstrap de todos os restaurantes)
  // normalmente já espera a sessão existir — ver README sobre o pareamento.
  onQr?: (qr: string) => void;
}

function extractText(message: NonNullable<import('baileys').WAMessage['message']>): string | null {
  return message.conversation ?? message.extendedTextMessage?.text ?? null;
}

export class BaileysAdapter implements MessagingAdapter {
  private socket: WASocket | null = null;
  private handler: ((message: IncomingMessage) => Promise<void>) | null = null;

  constructor(private readonly options: BaileysAdapterOptions) {}

  onMessage(handler: (message: IncomingMessage) => Promise<void>): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    const authFolder = path.join(this.options.sessionsRoot, this.options.restaurantId);
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({ auth: state, version, printQRInTerminal: false });
    this.socket = socket;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
      if (update.qr) {
        if (this.options.onQr) {
          this.options.onQr(update.qr);
        } else {
          qrcodeTerminal.generate(update.qr, { small: true });
        }
      }

      if (update.connection === 'open') {
        console.log(`[Bot ${this.options.restaurantId}] Conectado ao WhatsApp.`);
      }

      if (update.connection === 'close') {
        const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.error(
            `[Bot ${this.options.restaurantId}] Sessão deslogada pelo WhatsApp — é preciso escanear o QR Code de novo (ver README, "npm run connect").`
          );
          return;
        }

        console.warn(`[Bot ${this.options.restaurantId}] Conexão caiu, reconectando...`);
        this.start().catch((err) => console.error(`[Bot ${this.options.restaurantId}] Erro ao reconectar:`, err));
      }
    });

    socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const jid = msg.key.remoteJid;
        const messageId = msg.key.id;
        if (!jid || !messageId) continue;
        // Ignora grupos e o status do WhatsApp — o bot só atende conversa
        // individual.
        if (jid.endsWith('@g.us') || jid === 'status@broadcast') continue;

        const text = extractText(msg.message);
        if (text === null) continue;

        const incoming: IncomingMessage = {
          waJid: jid,
          phone: normalizeWhatsappPhone(jid),
          text,
          messageId,
        };

        if (this.handler) {
          this.handler(incoming).catch((err) =>
            console.error(`[Bot ${this.options.restaurantId}] Erro ao processar mensagem de ${incoming.phone}:`, err)
          );
        }
      }
    });
  }

  async sendText(waJid: string, text: string): Promise<void> {
    if (!this.socket) throw new Error('Socket do WhatsApp ainda não conectado.');
    await this.socket.sendMessage(waJid, { text });
  }
}
