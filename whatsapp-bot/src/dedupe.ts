import { db } from './db';

// Baileys pode reentregar o mesmo evento de mensagem (reconexão, retry
// interno etc.) — isso grava o id da mensagem antes de processá-la, e
// quem chama confere o retorno pra decidir se já foi processada.
// Retorna true se essa mensagem é NOVA (deve ser processada); false se já
// tinha sido processada antes (deve ser ignorada).
export async function markMessageProcessed(restaurantId: string, messageId: string): Promise<boolean> {
  if (!restaurantId || !messageId) throw new Error('restaurantId e messageId são obrigatórios.');

  const { error } = await db.from('whatsapp_processed_messages').insert({
    restaurant_id: restaurantId,
    message_id: messageId,
  });

  if (!error) return true;

  // Violação da constraint unique (restaurant_id, message_id) = já tinha
  // sido processada. Qualquer outro erro de banco é tratado como "não
  // processar" também, por segurança (melhor ignorar uma mensagem do que
  // responder duas vezes ou criar pedido duplicado).
  if (error.code !== '23505') {
    console.error('[Sizzle Bot] Erro ao marcar mensagem como processada:', error.message);
  }
  return false;
}
