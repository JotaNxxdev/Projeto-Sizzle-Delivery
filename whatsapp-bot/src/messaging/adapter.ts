export interface IncomingMessage {
  // JID completo do WhatsApp (ex.: "5511999998888@s.whatsapp.net") — usado só
  // pra responder a mesma conversa, nunca salvo como está no banco.
  waJid: string;
  // Telefone normalizado (DDD + número, sem código do país) — é o que vira
  // chave da sessão e "contact" no pedido criado via API.
  phone: string;
  text: string;
  messageId: string;
}

// Camada de mensageria isolada da lógica de conversa (flow.ts) — pra trocar
// o Baileys por Twilio/Meta Cloud API no futuro, basta escrever um novo
// adapter implementando essa mesma interface; nada no resto do bot muda.
export interface MessagingAdapter {
  start(): Promise<void>;
  sendText(waJid: string, text: string): Promise<void>;
  onMessage(handler: (message: IncomingMessage) => Promise<void>): void;
}
