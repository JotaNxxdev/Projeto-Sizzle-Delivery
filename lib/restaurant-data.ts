import { supabase } from './supabase';

export interface OwnerOrderRow {
  id: string;
  orderCode: string;
  contact: string;
  address: string;
  receiverName: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  changeFor: number | null;
  notes: string | null;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { name: string; price: number; quantity: number }[];
}

export async function getOrdersForRestaurant(restaurantId: string): Promise<OwnerOrderRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_code, contact_number, delivery_address, receiver_name, delivery_method, payment_method, change_for, notes, status, payment_status, total, created_at, order_items(menu_item_name, price, quantity)'
    )
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar pedidos do restaurante:', error?.message);
    return [];
  }

  return data.map((o) => ({
    id: o.id,
    orderCode: o.order_code,
    contact: o.contact_number,
    address: o.delivery_address,
    receiverName: o.receiver_name,
    deliveryMethod: o.delivery_method,
    paymentMethod: o.payment_method,
    changeFor: o.change_for != null ? Number(o.change_for) : null,
    notes: o.notes,
    status: o.status,
    paymentStatus: o.payment_status,
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
    items: (o.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  }));
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
}

export async function getRestaurantSettings(restaurantId: string): Promise<RestaurantSettings | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, category, delivery_time, delivery_fee, image_url, brand_color, description, online_payment_enabled, mp_access_token'
    )
    .eq('id', restaurantId)
    .single();

  if (error || !data) {
    console.error('[Sizzle] Erro ao buscar dados da loja:', error?.message);
    return null;
  }

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
  };
}

export interface OwnerMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

export async function getMenuItemsForRestaurant(restaurantId: string): Promise<OwnerMenuItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url')
    .eq('restaurant_id', restaurantId)
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
  }));
}
