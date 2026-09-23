import { supabase } from './supabase';
import { isWithinBusinessHours } from './business-hours';
import type { BusinessHours } from './types';

export interface OwnerOrderItemOption {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface OwnerOrderRow {
  id: string;
  orderCode: string;
  contact: string;
  address: string;
  referencePoint: string | null;
  receiverName: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  changeFor: number | null;
  notes: string | null;
  status: string;
  rejectionReason: string | null;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  createdAtIso: string;
  courierId: string | null;
  courierName: string | null;
  items: { name: string; price: number; quantity: number; options: OwnerOrderItemOption[] }[];
}

const ORDER_ROW_SELECT =
  'id, order_code, contact_number, delivery_address, reference_point, receiver_name, delivery_method, payment_method, change_for, notes, status, rejection_reason, payment_status, subtotal, delivery_fee, total, created_at, courier_id, order_items(id, menu_item_name, price, quantity)';

// Busca os adicionais escolhidos de vários itens de pedido de uma vez
// (mesmo padrão de busca em lote já usado nesse arquivo).
async function fetchOptionsByItemId(
  db: NonNullable<typeof supabase>,
  orderItemIds: string[]
): Promise<Map<string, OwnerOrderItemOption[]>> {
  const result = new Map<string, OwnerOrderItemOption[]>();
  if (orderItemIds.length === 0) return result;

  const { data } = await db
    .from('order_item_options')
    .select('order_item_id, group_name, option_name, price_delta')
    .in('order_item_id', orderItemIds);

  for (const row of data ?? []) {
    const list = result.get(row.order_item_id) ?? [];
    list.push({ groupName: row.group_name, optionName: row.option_name, priceDelta: Number(row.price_delta) });
    result.set(row.order_item_id, list);
  }
  return result;
}

function mapOrderRow(
  o: {
    id: string;
    order_code: string;
    contact_number: string;
    delivery_address: string;
    reference_point: string | null;
    receiver_name: string | null;
    delivery_method: string;
    payment_method: string;
    change_for: number | string | null;
    notes: string | null;
    status: string;
    rejection_reason: string | null;
    payment_status: string;
    subtotal: number | string;
    delivery_fee: number | string;
    total: number | string;
    created_at: string;
    courier_id: string | null;
    order_items: { id: string; menu_item_name: string; price: number | string; quantity: number }[] | null;
  },
  optionsByItemId: Map<string, OwnerOrderItemOption[]>
): OwnerOrderRow {
  return {
    id: o.id,
    orderCode: o.order_code,
    contact: o.contact_number,
    address: o.delivery_address,
    referencePoint: o.reference_point,
    receiverName: o.receiver_name,
    deliveryMethod: o.delivery_method,
    paymentMethod: o.payment_method,
    changeFor: o.change_for != null ? Number(o.change_for) : null,
    notes: o.notes,
    status: o.status,
    rejectionReason: o.rejection_reason,
    paymentStatus: o.payment_status,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
    createdAtIso: o.created_at,
    courierId: o.courier_id,
    courierName: null, // preenchido depois por attachCourierNames
    items: (o.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
      options: optionsByItemId.get(item.id) ?? [],
    })),
  };
}

// Busca os nomes dos entregadores à parte (em vez de um embed do Supabase)
// pra não depender da tipagem incerta de relações to-one sem os tipos
// gerados do schema — mesmo padrão já usado em listRestaurantsWithOwner.
async function attachCourierNames(orders: OwnerOrderRow[]): Promise<OwnerOrderRow[]> {
  if (!supabase) return orders;

  const courierIds = Array.from(new Set(orders.map((o) => o.courierId).filter((id): id is string => Boolean(id))));
  if (courierIds.length === 0) return orders;

  const { data: couriers } = await supabase.from('profiles').select('id, full_name, email').in('id', courierIds);
  const nameById = new Map((couriers ?? []).map((c) => [c.id, c.full_name || c.email]));

  return orders.map((order) => ({
    ...order,
    courierName: order.courierId ? (nameById.get(order.courierId) ?? null) : null,
  }));
}

export async function getOrdersForRestaurant(restaurantId: string, status?: string): Promise<OwnerOrderRow[]> {
  if (!supabase) return [];

  let query = supabase.from('orders').select(ORDER_ROW_SELECT).eq('restaurant_id', restaurantId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar pedidos do restaurante:', error?.message);
    return [];
  }

  const orderItemIds = data.flatMap((o) => (o.order_items ?? []).map((item) => item.id));
  const optionsByItemId = await fetchOptionsByItemId(supabase, orderItemIds);

  return attachCourierNames(data.map((row) => mapOrderRow(row, optionsByItemId)));
}

export async function getOrderForOwner(restaurantId: string, orderId: string): Promise<OwnerOrderRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_ROW_SELECT)
    .eq('id', orderId)
    .eq('restaurant_id', restaurantId)
    .single();

  if (error || !data) return null;

  const orderItemIds = (data.order_items ?? []).map((item) => item.id);
  const optionsByItemId = await fetchOptionsByItemId(supabase, orderItemIds);

  const [order] = await attachCourierNames([mapOrderRow(data, optionsByItemId)]);
  return order;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  category: string;
  deliveryTime: string;
  deliveryFee: number;
  imageUrl: string | null;
  brandColor: string | null;
  description: string | null;
  onlinePaymentEnabled: boolean;
  // Só diz SE está conectado — o token em si nunca sai do servidor.
  mercadoPagoConnected: boolean;
  isOpen: boolean; // toggle manual (pausar/reabrir loja)
  businessHours: BusinessHours | null;
  isOpenNow: boolean; // computado: isOpen && dentro do horário configurado
  minOrderValue: number;
}

export async function getRestaurantSettings(restaurantId: string): Promise<RestaurantSettings | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, category, delivery_time, delivery_fee, image_url, brand_color, description, online_payment_enabled, mp_access_token, is_open, business_hours, min_order_value'
    )
    .eq('id', restaurantId)
    .single();

  if (error || !data) {
    console.error('[Sizzle] Erro ao buscar dados da loja:', error?.message);
    return null;
  }

  const isOpen = data.is_open;
  const businessHours = data.business_hours as BusinessHours | null;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    deliveryTime: data.delivery_time,
    deliveryFee: Number(data.delivery_fee),
    imageUrl: data.image_url,
    brandColor: data.brand_color,
    description: data.description,
    onlinePaymentEnabled: data.online_payment_enabled,
    mercadoPagoConnected: Boolean(data.mp_access_token),
    isOpen,
    businessHours,
    isOpenNow: isOpen && isWithinBusinessHours(businessHours),
    minOrderValue: Number(data.min_order_value),
  };
}

export interface OwnerMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  active: boolean;
}

export async function getMenuItemsForRestaurant(restaurantId: string): Promise<OwnerMenuItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url, category, active')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar cardápio do restaurante:', error?.message);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.image_url,
    category: item.category,
    active: item.active,
  }));
}

export interface RestaurantReport {
  ordersToday: number;
  revenueToday: number;
  ordersWeek: number;
  revenueWeek: number;
  ordersMonth: number;
  revenueMonth: number;
  ordersTotal: number;
  revenueTotal: number;
  averageTicket: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  paymentMethodBreakdown: { method: string; orders: number; revenue: number }[];
  cancelledOrders: number;
  rejectedOrders: number;
  totalDiscountGiven: number;
}

const EMPTY_REPORT: RestaurantReport = {
  ordersToday: 0,
  revenueToday: 0,
  ordersWeek: 0,
  revenueWeek: 0,
  ordersMonth: 0,
  revenueMonth: 0,
  ordersTotal: 0,
  revenueTotal: 0,
  averageTicket: 0,
  topItems: [],
  paymentMethodBreakdown: [],
  cancelledOrders: 0,
  rejectedOrders: 0,
  totalDiscountGiven: 0,
};

// Pedidos com pagamento recusado/cancelado não entram nas somas de receita.
const EXCLUDED_PAYMENT_STATUSES = new Set(['rejected', 'cancelled']);

export async function getRestaurantReport(restaurantId: string): Promise<RestaurantReport> {
  if (!supabase) return EMPTY_REPORT;

  const { data, error } = await supabase
    .from('orders')
    .select(
      'total, payment_status, payment_method, status, discount_amount, created_at, order_items(menu_item_name, price, quantity)'
    )
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) {
    console.error('[Sizzle] Erro ao gerar relatório do restaurante:', error?.message);
    return EMPTY_REPORT;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const itemStats = new Map<string, { quantity: number; revenue: number }>();
  const paymentStats = new Map<string, { orders: number; revenue: number }>();

  let ordersToday = 0;
  let revenueToday = 0;
  let ordersWeek = 0;
  let revenueWeek = 0;
  let ordersMonth = 0;
  let revenueMonth = 0;
  let ordersTotal = 0;
  let revenueTotal = 0;
  let cancelledOrders = 0;
  let rejectedOrders = 0;
  let totalDiscountGiven = 0;

  for (const order of data) {
    if (order.status === 'Cancelado') cancelledOrders += 1;
    if (order.status === 'Recusado') rejectedOrders += 1;

    if (EXCLUDED_PAYMENT_STATUSES.has(order.payment_status)) continue;

    const total = Number(order.total);
    const createdAt = new Date(order.created_at);

    ordersTotal += 1;
    revenueTotal += total;
    totalDiscountGiven += Number(order.discount_amount);

    const paymentEntry = paymentStats.get(order.payment_method) ?? { orders: 0, revenue: 0 };
    paymentEntry.orders += 1;
    paymentEntry.revenue += total;
    paymentStats.set(order.payment_method, paymentEntry);

    if (createdAt >= startOfMonth) {
      ordersMonth += 1;
      revenueMonth += total;
    }
    if (createdAt >= startOfWeek) {
      ordersWeek += 1;
      revenueWeek += total;
    }
    if (createdAt >= startOfToday) {
      ordersToday += 1;
      revenueToday += total;
    }

    for (const item of order.order_items ?? []) {
      const stats = itemStats.get(item.menu_item_name) ?? { quantity: 0, revenue: 0 };
      stats.quantity += item.quantity;
      stats.revenue += Number(item.price) * item.quantity;
      itemStats.set(item.menu_item_name, stats);
    }
  }

  const topItems = Array.from(itemStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const paymentMethodBreakdown = Array.from(paymentStats.entries())
    .map(([method, stats]) => ({ method, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    ordersToday,
    revenueToday,
    ordersWeek,
    revenueWeek,
    ordersMonth,
    revenueMonth,
    ordersTotal,
    revenueTotal,
    averageTicket: ordersTotal > 0 ? revenueTotal / ordersTotal : 0,
    topItems,
    paymentMethodBreakdown,
    cancelledOrders,
    rejectedOrders,
    totalDiscountGiven,
  };
}

export interface CourierRow {
  id: string;
  email: string;
  fullName: string | null;
}

export async function getCouriersForRestaurant(restaurantId: string): Promise<CourierRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('restaurant_id', restaurantId)
    .eq('role', 'courier')
    .order('full_name', { ascending: true });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar entregadores do restaurante:', error?.message);
    return [];
  }

  return data.map((courier) => ({ id: courier.id, email: courier.email, fullName: courier.full_name }));
}

export interface CouponRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerCustomer: number;
  active: boolean;
  timesUsed: number;
}

export async function getCouponsForRestaurant(restaurantId: string): Promise<CouponRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('coupons')
    .select(
      'id, code, discount_type, discount_value, min_order_value, max_discount, expires_at, usage_limit, usage_limit_per_customer, active'
    )
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar cupons:', error?.message);
    return [];
  }

  const couponIds = data.map((c) => c.id);
  const usageByCoupon = new Map<string, number>();
  if (couponIds.length > 0) {
    const { data: redemptions } = await supabase.from('coupon_redemptions').select('coupon_id').in('coupon_id', couponIds);
    for (const redemption of redemptions ?? []) {
      usageByCoupon.set(redemption.coupon_id, (usageByCoupon.get(redemption.coupon_id) ?? 0) + 1);
    }
  }

  return data.map((c) => ({
    id: c.id,
    code: c.code,
    discountType: c.discount_type,
    discountValue: Number(c.discount_value),
    minOrderValue: Number(c.min_order_value),
    maxDiscount: c.max_discount != null ? Number(c.max_discount) : null,
    expiresAt: c.expires_at,
    usageLimit: c.usage_limit,
    usageLimitPerCustomer: c.usage_limit_per_customer,
    active: c.active,
    timesUsed: usageByCoupon.get(c.id) ?? 0,
  }));
}
