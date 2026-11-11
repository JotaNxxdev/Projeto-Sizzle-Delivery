import { supabase } from './supabase';

// Planos fixos de preço do destaque pago — valores de lançamento, ajustáveis
// conforme a demanda real (mesmo espírito dos preços colocados na landing
// /para-restaurantes).
export const PROMOTION_PLANS = [
  { days: 7, price: 49 },
  { days: 15, price: 89 },
  { days: 30, price: 149 },
] as const;

export type PromotionPlanDays = (typeof PROMOTION_PLANS)[number]['days'];

export function getPromotionPlanPrice(days: number): number | null {
  const plan = PROMOTION_PLANS.find((p) => p.days === days);
  return plan ? plan.price : null;
}

export interface ActivePromotion {
  id: string;
  title: string;
  imageUrl: string | null;
  restaurantId: string;
  restaurantName: string;
}

// Destaques ativos e dentro do período, pra montar o carrossel da home —
// sem registro nenhum a seção some (nunca mostra imagem de mentira).
export async function listActivePromotions(): Promise<ActivePromotion[]> {
  if (!supabase) return [];

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('restaurant_promotions')
    .select('id, title, image_url, restaurant_id')
    .eq('status', 'active')
    .lte('starts_at', nowIso)
    .gte('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) console.error('[Sizzle] Erro ao listar destaques ativos:', error.message);
    return [];
  }

  const restaurantIds = [...new Set(data.map((row) => row.restaurant_id))];
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, is_archived')
    .in('id', restaurantIds);

  const restaurantById = new Map((restaurants ?? []).map((r) => [r.id, r]));

  return data
    .filter((row) => {
      const restaurant = restaurantById.get(row.restaurant_id);
      return restaurant && !restaurant.is_archived;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      restaurantId: row.restaurant_id,
      restaurantName: restaurantById.get(row.restaurant_id)?.name ?? '',
    }));
}
