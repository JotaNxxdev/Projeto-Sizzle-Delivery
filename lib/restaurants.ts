import { cache } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { SEED_RESTAURANTS } from './seed-data';
import { isWithinBusinessHours } from './business-hours';
import { getRestaurantRatingAverages, type RatingAverage } from './reviews';
import { getOptionGroupsForMenuItems } from './menu-options';
import type { BusinessHours, Restaurant } from './types';

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  active: boolean;
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
  business_hours: BusinessHours | null;
  min_order_value: number;
  owner_id: string | null;
  is_archived: boolean;
  menu_items: MenuItemRow[] | null;
}

function mapRestaurant(row: RestaurantRow, ratingAverages: Map<string, RatingAverage>): Restaurant {
  const isOpen = row.is_open;
  const businessHours = row.business_hours;
  const ratingInfo = ratingAverages.get(row.id);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    // Usa a média das avaliações reais quando já existe alguma; caso
    // contrário mantém a nota estática cadastrada pelo dono/seed.
    rating: ratingInfo ? Number(ratingInfo.average.toFixed(1)) : Number(row.rating),
    reviewCount: ratingInfo?.count ?? 0,
    deliveryTime: row.delivery_time,
    deliveryFee: Number(row.delivery_fee),
    image: row.image_url ?? '',
    brandColor: row.brand_color,
    description: row.description,
    // Só oferece Pix se a loja tiver ativado E realmente tiver conectado
    // uma conta do Mercado Pago (o toggle sozinho não basta).
    onlinePaymentEnabled: row.online_payment_enabled && Boolean(row.mp_access_token),
    isOpen,
    businessHours,
    isOpenNow: isOpen && isWithinBusinessHours(businessHours),
    minOrderValue: Number(row.min_order_value),
    // Item inativo não aparece pro cliente, mas continua existindo pro dono
    // reativar quando quiser (ver getMenuItemsForRestaurant).
    menu: (row.menu_items ?? [])
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        price: Number(item.price),
        image: item.image_url ?? '',
        category: item.category,
        optionGroups: [], // preenchido depois, em getRestaurants, com uma busca em lote
      })),
  };
}

export async function getRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured || !supabase) {
    return SEED_RESTAURANTS;
  }

  const [{ data, error }, ratingAverages] = await Promise.all([
    supabase
      .from('restaurants')
      .select(
        'id, name, category, rating, delivery_time, delivery_fee, image_url, brand_color, description, online_payment_enabled, mp_access_token, is_open, business_hours, min_order_value, owner_id, is_archived, menu_items(id, name, description, price, image_url, category, active)'
      )
      .order('name', { ascending: true }),
    getRestaurantRatingAverages(),
  ]);

  if (error) {
    console.error('[Sizzle] Erro ao buscar restaurantes no Supabase:', error.message);
    return SEED_RESTAURANTS;
  }

  if (!data || data.length === 0) {
    return SEED_RESTAURANTS;
  }

  // Esconde da vitrine do cliente restaurantes arquivados, sem dono, ou sem
  // nenhum item ativo no cardápio — são criações incompletas/órfãs, não
  // lojas de verdade prontas pra receber pedido.
  const visibleRows = (data as unknown as RestaurantRow[]).filter(
    (row) => !row.is_archived && row.owner_id && (row.menu_items ?? []).some((item) => item.active)
  );

  const restaurants = visibleRows.map((row) => mapRestaurant(row, ratingAverages));

  // Busca os adicionais de todos os itens de uma vez (uma query em lote em
  // vez de uma por item) e liga cada grupo ao item correspondente.
  const allItemIds = restaurants.flatMap((restaurant) => restaurant.menu.map((item) => item.id));
  const optionGroupsByItem = await getOptionGroupsForMenuItems(allItemIds);
  for (const restaurant of restaurants) {
    for (const item of restaurant.menu) {
      item.optionGroups = optionGroupsByItem.get(item.id) ?? [];
    }
  }

  return restaurants;
}

// cache() deduplica dentro do mesmo request — a página do restaurante chama
// isso tanto em generateMetadata quanto no corpo da página, e sem isso
// seria uma busca dobrada (lista inteira de restaurantes) a cada acesso.
export const getRestaurantById = cache(async (id: string): Promise<Restaurant | null> => {
  const restaurants = await getRestaurants();
  return restaurants.find((restaurant) => restaurant.id === id) ?? null;
});
