import { supabase } from './supabase';

export interface OwnerOrderRow {
  id: string;
  orderCode: string;
  contact: string;
  address: string;
  notes: string | null;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; price: number; quantity: number }[];
}

export async function getOrdersForRestaurant(restaurantId: string): Promise<OwnerOrderRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_code, contact_number, delivery_address, notes, status, total, created_at, order_items(menu_item_name, price, quantity)'
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
    notes: o.notes,
    status: o.status,
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
    items: (o.order_items ?? []).map((item) => ({
      name: item.menu_item_name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  }));
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
