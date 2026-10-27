import { validateCoupon } from './coupons';
import { isWithinBusinessHours } from './business-hours';
import { resolveOrderItem, type ResolvedOrderItem } from './order-pricing';
import type { DeliveryMethod, Restaurant } from './types';

// Janela permitida pra agendar um pedido: pelo menos 30min de antecedência
// (tempo mínimo de preparo) e no máximo 7 dias à frente.
export const MIN_SCHEDULE_LEAD_MINUTES = 30;
export const MAX_SCHEDULE_DAYS_AHEAD = 7;

export interface IncomingOrderItem {
  menuItemId: string;
  quantity: number;
  selectedValueIds?: string[];
}

export interface OrderPricingInput {
  restaurant: Restaurant;
  items: IncomingOrderItem[];
  deliveryMethod: DeliveryMethod;
  couponCode?: string;
  userId: string | null;
  scheduledForRaw?: string;
}

export type OrderPricingResult =
  | {
      ok: true;
      resolvedItems: ResolvedOrderItem[];
      subtotal: number;
      deliveryFee: number;
      discountAmount: number;
      total: number;
      appliedCouponId: string | null;
      scheduledFor: Date | null;
    }
  | { ok: false; status: number; error: string };

// Núcleo de cálculo/validação de um pedido — usado tanto na criação de
// verdade (app/api/orders/route.ts) quanto na pré-visualização
// (app/api/orders/preview/route.ts), pra nunca ter duas versões da mesma
// conta que podem divergir. Nunca confia em preço/desconto vindo do
// cliente: tudo é recalculado a partir do cardápio carregado no servidor.
export async function calculateOrderPricing(input: OrderPricingInput): Promise<OrderPricingResult> {
  const { restaurant, items, deliveryMethod, userId } = input;

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: 'Dados do pedido incompletos.' };
  }

  // Pedido agendado: valida a janela e o horário de funcionamento do
  // restaurante NO MOMENTO AGENDADO, em vez de exigir que esteja aberto
  // agora (afinal o pedido só vai ser preparado mais tarde).
  let scheduledFor: Date | null = null;
  if (input.scheduledForRaw) {
    const parsed = new Date(input.scheduledForRaw);
    const now = new Date();
    const minAllowed = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MINUTES * 60 * 1000);
    const maxAllowed = new Date(now.getTime() + MAX_SCHEDULE_DAYS_AHEAD * 24 * 60 * 60 * 1000);

    if (Number.isNaN(parsed.getTime()) || parsed < minAllowed || parsed > maxAllowed) {
      return {
        ok: false,
        status: 400,
        error: `Horário de agendamento inválido. Escolha entre ${MIN_SCHEDULE_LEAD_MINUTES} minutos e ${MAX_SCHEDULE_DAYS_AHEAD} dias a partir de agora.`,
      };
    }
    if (!isWithinBusinessHours(restaurant.businessHours, parsed)) {
      return {
        ok: false,
        status: 400,
        error: 'O restaurante está fechado nesse horário. Escolha outro horário dentro do funcionamento da loja.',
      };
    }
    scheduledFor = parsed;
  } else if (!restaurant.isOpenNow) {
    return { ok: false, status: 400, error: 'Este restaurante está fechado no momento.' };
  }

  let subtotal = 0;
  const resolvedItems: ResolvedOrderItem[] = [];

  for (const incoming of items) {
    const menuItem = restaurant.menu.find((item) => item.id === incoming.menuItemId);
    const selectedValueIds = Array.isArray(incoming.selectedValueIds) ? incoming.selectedValueIds : [];
    const result = resolveOrderItem(menuItem, incoming.quantity, selectedValueIds);

    if (!result.ok) {
      return { ok: false, status: 400, error: result.error };
    }

    subtotal += result.item.price * result.item.quantity;
    resolvedItems.push(result.item);
  }

  if (restaurant.minOrderValue > 0 && subtotal < restaurant.minOrderValue) {
    return {
      ok: false,
      status: 400,
      error: `Pedido mínimo desse restaurante: ${restaurant.minOrderValue.toFixed(2)} (sem contar a entrega).`,
    };
  }

  // Revalida o cupom de novo aqui (nunca confia no desconto calculado pelo
  // navegador, mesmo que a pré-visualização já tenha validado antes).
  let discountAmount = 0;
  let appliedCouponId: string | null = null;
  const couponCode = input.couponCode?.trim();
  const isSeedRestaurant = restaurant.id.startsWith('seed-');
  if (couponCode && !isSeedRestaurant) {
    const couponResult = await validateCoupon(restaurant.id, couponCode, subtotal, userId);
    if (!couponResult.valid) {
      return { ok: false, status: 400, error: couponResult.error || 'Cupom inválido.' };
    }
    discountAmount = couponResult.discount ?? 0;
    appliedCouponId = couponResult.couponId ?? null;
  }

  const deliveryFee = deliveryMethod === 'pickup' ? 0 : restaurant.deliveryFee;
  const total = subtotal - discountAmount + deliveryFee;

  return {
    ok: true,
    resolvedItems,
    subtotal,
    deliveryFee,
    discountAmount,
    total,
    appliedCouponId,
    scheduledFor,
  };
}
