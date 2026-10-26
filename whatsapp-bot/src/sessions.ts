import { db } from './db';
import { config } from './config';
import { initialState } from './conversation/types';
import type { SessionState } from './conversation/types';

interface SessionRow {
  id: string;
  restaurant_id: string;
  phone: string;
  cart: unknown;
  draft: unknown;
  payment_method: string | null;
  paused_for_agent: boolean;
  paused_at: string | null;
  message_count: number;
  message_window_started_at: string;
  last_interaction_at: string;
}

export interface LoadedSession {
  id: string;
  state: SessionState;
  pausedForAgent: boolean;
  messageCount: number;
  messageWindowStartedAt: string;
}

// draft (jsonb) guarda TODO o SessionState — simples e suficiente pro
// tamanho dessa conversa. 'cart'/'payment_method' no banco existem só pra
// quem for olhar a tabela direto no SQL conseguir entender o que tem no
// carrinho sem precisar decodificar o jsonb do draft.
function stateToRow(state: SessionState) {
  return {
    cart: state.cart,
    draft: state,
    payment_method: state.paymentMethod,
  };
}

function rowToState(row: SessionRow): SessionState {
  if (row.draft && typeof row.draft === 'object') {
    return row.draft as SessionState;
  }
  return initialState();
}

// Toda busca de sessão exige restaurantId + phone (nunca uma sessão "solta"
// sem saber de qual restaurante é), consistente com o resto do bot.
export async function loadOrCreateSession(restaurantId: string, phone: string): Promise<LoadedSession> {
  if (!restaurantId || !phone) throw new Error('restaurantId e phone são obrigatórios.');

  const { data, error } = await db
    .from('whatsapp_customer_sessions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar sessão de ${phone} no restaurante ${restaurantId}: ${error.message}`);
  }

  if (!data) {
    const fresh = initialState();
    const { data: inserted, error: insertError } = await db
      .from('whatsapp_customer_sessions')
      .insert({
        restaurant_id: restaurantId,
        phone,
        step: fresh.step,
        ...stateToRow(fresh),
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      throw new Error(`Erro ao criar sessão de ${phone}: ${insertError?.message}`);
    }

    return {
      id: inserted.id,
      state: fresh,
      pausedForAgent: false,
      messageCount: 0,
      messageWindowStartedAt: new Date().toISOString(),
    };
  }

  const row = data as SessionRow;

  // Sessão inativa há mais tempo que o permitido: reseta a conversa (volta
  // pro início e esquece o carrinho), mas preserva o id da linha.
  const minutesSinceLastInteraction = (Date.now() - new Date(row.last_interaction_at).getTime()) / 60000;
  const state = minutesSinceLastInteraction > config.sessionExpiryMinutes ? initialState() : rowToState(row);

  return {
    id: row.id,
    state,
    pausedForAgent: row.paused_for_agent,
    messageCount: row.message_count,
    messageWindowStartedAt: row.message_window_started_at,
  };
}

export async function saveSession(sessionId: string, state: SessionState): Promise<void> {
  const { error } = await db
    .from('whatsapp_customer_sessions')
    .update({
      step: state.step,
      ...stateToRow(state),
      last_interaction_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Erro ao salvar sessão ${sessionId}: ${error.message}`);
  }
}

export async function pauseSessionForAgent(sessionId: string): Promise<void> {
  const { error } = await db
    .from('whatsapp_customer_sessions')
    .update({ paused_for_agent: true, paused_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) {
    throw new Error(`Erro ao pausar sessão ${sessionId}: ${error.message}`);
  }
}

// Rede de segurança: se ninguém reativar pelo painel, o bot volta a
// responder sozinho depois de PAUSE_AUTO_EXPIRE_HOURS. Varre só pausas
// expiradas, em qualquer restaurante — não precisa de restaurantId porque
// não devolve dados, só libera sessões (é uma manutenção, não uma leitura).
export async function autoExpireStalePauses(): Promise<void> {
  const cutoff = new Date(Date.now() - config.pauseAutoExpireHours * 60 * 60 * 1000).toISOString();
  const { error } = await db
    .from('whatsapp_customer_sessions')
    .update({ paused_for_agent: false, paused_at: null })
    .eq('paused_for_agent', true)
    .lt('paused_at', cutoff);
  if (error) {
    console.error('[Sizzle Bot] Erro ao expirar pausas antigas:', error.message);
  }
}

// Limite simples de mensagens por janela de tempo, pra evitar flood/spam de
// um número. Retorna true se a mensagem PODE ser processada. Recebe os
// dados já carregados por loadOrCreateSession, pra não precisar de uma
// segunda consulta só pra isso.
export async function checkRateLimit(session: LoadedSession): Promise<boolean> {
  const windowAgeSeconds = (Date.now() - new Date(session.messageWindowStartedAt).getTime()) / 1000;

  if (windowAgeSeconds > config.rateLimitWindowSeconds) {
    await db
      .from('whatsapp_customer_sessions')
      .update({ message_count: 1, message_window_started_at: new Date().toISOString() })
      .eq('id', session.id);
    return true;
  }

  if (session.messageCount >= config.rateLimitMaxMessages) {
    return false;
  }

  await db
    .from('whatsapp_customer_sessions')
    .update({ message_count: session.messageCount + 1 })
    .eq('id', session.id);
  return true;
}
