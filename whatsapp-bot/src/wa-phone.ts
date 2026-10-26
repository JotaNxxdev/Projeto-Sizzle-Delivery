// Normaliza o número de um JID do WhatsApp (ex.: "5511999998888@s.whatsapp.net"
// ou "5511999998888:12@s.whatsapp.net") pro formato que o site espera em
// lib/phone.ts (DDD + número, SEM o código do país) — é o mesmo "contact"
// que vai em app/api/orders. Números fora do padrão brasileiro de 12/13
// dígitos com "55" na frente passam direto; a validação do lado do site
// acaba rejeitando e o cliente recebe o erro de volta no WhatsApp.
export function normalizeWhatsappPhone(jid: string): string {
  const userPart = jid.split('@')[0].split(':')[0];
  const digits = userPart.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  return digits;
}

// Caminho inverso — usado só pro status-watcher reconstruir o JID a partir
// do telefone salvo em orders.contact_number (sempre sem o "55" na frente,
// igual todo "contact" do site) pra conseguir mandar a mensagem de volta.
export function toWhatsappJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `55${digits}@s.whatsapp.net`;
}
