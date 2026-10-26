import { config } from './config';
import { getCatalog } from './catalog';
import { getRestaurantForBot } from './restaurants';
import { loadOrCreateSession, saveSession, pauseSessionForAgent, checkRateLimit } from './sessions';
import { markMessageProcessed } from './dedupe';
import { applyOrderResult, applyPreviewResult, handleMessage } from './conversation/flow';
import { createOrder, previewOrder } from './order-client';
import type { IncomingMessage, MessagingAdapter } from './messaging/adapter';

// Liga tudo: dedupe -> sessão -> pausa/rate limit -> máquina de estados ->
// (se precisar) chamada pro site -> salva sessão -> responde. É a única
// peça do bot que tem efeito colateral (I/O) ao mesmo tempo que usa a
// lógica pura de flow.ts — propositalmente separada dela pra flow.ts
// continuar 100% testável sem mock de rede/banco.
export function createMessageHandler(restaurantId: string, adapter: MessagingAdapter) {
  return async function handleIncoming(message: IncomingMessage): Promise<void> {
    const isNewMessage = await markMessageProcessed(restaurantId, message.messageId);
    if (!isNewMessage) return;

    const session = await loadOrCreateSession(restaurantId, message.phone);
    if (session.pausedForAgent) return;

    const allowed = await checkRateLimit(session);
    if (!allowed) {
      await adapter.sendText(message.waJid, 'Você enviou muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.');
      return;
    }

    const catalog = await getCatalog(restaurantId);
    if (!catalog) {
      await adapter.sendText(message.waJid, 'Desculpe, não consegui acessar o cardápio agora. Tente de novo em alguns minutos.');
      return;
    }

    const websiteUrl = `${config.apiBaseUrl}/restaurants/${restaurantId}`;
    let result = handleMessage(session.state, catalog, websiteUrl, message.text);

    if (result.effect.type === 'pause_for_agent') {
      await pauseSessionForAgent(session.id);
    } else if (result.effect.type === 'request_preview') {
      const preview = await previewOrder(restaurantId, result.state);
      result = applyPreviewResult(result.state, preview);
    } else if (result.effect.type === 'create_order') {
      const restaurant = await getRestaurantForBot(restaurantId);
      const created = await createOrder(restaurantId, message.phone, result.state, restaurant?.manualPixKey ?? null);
      result = applyOrderResult(result.state, catalog, websiteUrl, created);
    }

    await saveSession(session.id, result.state);

    for (const text of result.replies) {
      await adapter.sendText(message.waJid, text);
    }
  };
}
