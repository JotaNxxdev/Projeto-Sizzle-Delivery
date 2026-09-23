import { supabase } from './supabase';
import { isWithinBusinessHours } from './business-hours';
import type { BusinessHours } from './types';

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
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  createdAtIso: string;
  items: { name: string; price: number; quantity: number }[];
}

const ORDER_ROW_SELECT =
  'id, order_code, contact_number, delivery_address, reference_point, receiver_name, delivery_method, payment_method, change_for, notes, status, payment_status, subtotal, delivery_fee, total, created_at, order_items(menu_item_name, price, quantity)';

function mapOrderRow(o: {
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
  payment_status: string;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  created_at: string;
  order_items: { menu_item_name: string; price: number | string; quantity: number }[] | null;
}): OwnerOrderRow {
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
    paymentStatus: o.payment_status,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
    createdAtIso: o.created_at,
    items: (o.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
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

  return data.map(mapOrderRow);
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

  return mapOrderRow(data);
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
}

export async function getRestaurantSettings(restaurantId: string): Promise<RestaurantSettings | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, category, delivery_time, delivery_fee, image_url, brand_color, description, online_payment_enabled, mp_access_token, is_open, business_hours'
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
  };
}

export interface OwnerMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
}

export async function getMenuItemsForRestaurant(restaurantId: string): Promise<OwnerMenuItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url, category')
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
};

// Pedidos com pagamento recusado/cancelado não entram nas somas de receita.
const EXCLUDED_PAYMENT_STATUSES = new Set(['rejected', 'cancelled']);

export async function getRestaurantReport(restaurantId: string): Promise<RestaurantReport> {
  if (!supabase) return EMPTY_REPORT;

  const { data, error } = await supabase
    .from('orders')
    .select('total, payment_status, created_at, order_items(menu_item_name, price, quantity)')
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

  let ordersToday = 0;
  let revenueToday = 0;
  let ordersWeek = 0;
  let revenueWeek = 0;
  let ordersMonth = 0;
  let revenueMonth = 0;
  let ordersTotal = 0;
  let revenueTotal = 0;

  for (const order of data) {
    if (EXCLUDED_PAYMENT_STATUSES.has(order.payment_status)) continue;

    const total = Number(order.total);
    const createdAt = new Date(order.created_at);

    ordersTotal += 1;
    revenueTotal += total;

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
  };
}
