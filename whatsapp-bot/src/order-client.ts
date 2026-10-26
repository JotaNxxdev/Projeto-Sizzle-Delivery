import { config } from './config';
import { buildOrderRequestItems } from './conversation/flow';
import type { SessionState } from './conversation/types';

export type PreviewResult =
  | { ok: true; subtotal: number; deliveryFee: number; discountAmount: number; total: number }
  | { ok: false; error: string };

export type CreateOrderResult = { ok: true; orderCode: string; pixKey: string | null } | { ok: false; error: string };

async function callBotApi(path: string, body: unknown): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sizzle-bot-token': config.botApiToken },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, json };
}

// Junta as observações de cada item numa única anotação do pedido — o
// banco (order_items) não tem campo de observação por item, só o pedido
// como um todo (orders.notes), que é exatamente o que o site já usa.
function buildOrderNotes(state: SessionState): string | undefined {
  const parts = state.cart.filter((line) => line.note).map((line) => `${line.name}: ${line.note}`);
  return parts.length > 0 ? parts.join('; ') : undefined;
}

// SEMPRE passa pelo /api/orders/preview do site — nunca calcula total aqui.
export async function previewOrder(restaurantId: string, state: SessionState): Promise<PreviewResult> {
  const { ok, json } = await callBotApi('/api/orders/preview', {
    restaurantId,
    items: buildOrderRequestItems(state.cart),
    deliveryMethod: 'delivery',
  });

  if (!ok) {
    return { ok: false, error: typeof json.error === 'string' ? json.error : 'Erro ao calcular o pedido.' };
  }
  return {
    ok: true,
    subtotal: Number(json.subtotal),
    deliveryFee: Number(json.deliveryFee),
    discountAmount: Number(json.discountAmount),
    total: Number(json.total),
  };
}

// SEMPRE passa pelo /api/orders do site — o servidor recalcula tudo de novo
// e só ele decide o preço final (mesma garantia que o checkout do site tem).
export async function createOrder(restaurantId: string, phone: string, state: SessionState, pixKey: string | null): Promise<CreateOrderResult> {
  if (!state.address || !state.receiverName || !state.paymentMethod) {
    return { ok: false, error: 'Dados do pedido incompletos.' };
  }

  const { ok, json } = await callBotApi('/api/orders', {
    restaurantId,
    items: buildOrderRequestItems(state.cart),
    notes: buildOrderNotes(state),
    contact: phone,
    receiverName: state.receiverName,
    deliveryMethod: 'delivery',
    street: state.address.street,
    streetNumber: state.address.streetNumber,
    complement: state.address.complement ?? undefined,
    neighborhood: state.address.neighborhood,
    city: state.address.city,
    paymentMethod: state.paymentMethod,
    changeFor: state.changeFor ?? undefined,
  });

  if (!ok || typeof json.orderCode !== 'string') {
    return { ok: false, error: typeof json.error === 'string' ? json.error : 'Erro ao criar o pedido.' };
  }
  return { ok: true, orderCode: json.orderCode, pixKey };
}
