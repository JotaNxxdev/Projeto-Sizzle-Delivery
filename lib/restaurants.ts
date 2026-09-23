import { supabase, isSupabaseConfigured } from './supabase';
import { SEED_RESTAURANTS } from './seed-data';
import type { Restaurant } from './types';

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface RestaurantRow {
  id: string;
  name: string;
  category: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  image_url: string | null;
  brand_color: string | null;
  description: string | null;
  online_payment_enabled: boolean;
  mp_access_token: string | null;
  is_open: boolean;
  opening_hours: string | null;
  menu_items: MenuItemRow[] | null;
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    rating: Number(row.rating),
    deliveryTime: row.delivery_time,
    deliveryFee: Number(row.delivery_fee),
    image: row.image_url ?? '',
    brandColor: row.brand_color,
    description: row.description,
    // Só oferece Pix se a loja tiver ativado E realmente tiver conectado
    // uma conta do Mercado Pago (o toggle sozinho não basta).
    onlinePaymentEnabled: row.online_payment_enabled && Boolean(row.mp_access_token),
    isOpen: row.is_open,
    openingHours: row.opening_hours,
    menu: (row.menu_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      image: item.image_url ?? '',
    })),
  };
}

export async function getRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured || !supabase) {
    return SEED_RESTAURANTS;
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, category, rating, delivery_time, delivery_fee, image_url, brand_color, description, online_payment_enabled, mp_access_token, is_open, opening_hours, menu_items(id, name, description, price, image_url)'
    )
    .order('name', { ascending: true });

  if (error) {
    console.error('[Sizzle] Erro ao buscar restaurantes no Supabase:', error.message);
    return SEED_RESTAURANTS;
  }

  if (!data || data.length === 0) {
    return SEED_RESTAURANTS;
  }

  return (data as unknown as RestaurantRow[]).map(mapRestaurant);
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants();
  return restaurants.find((restaurant) => restaurant.id === id) ?? null;
}
