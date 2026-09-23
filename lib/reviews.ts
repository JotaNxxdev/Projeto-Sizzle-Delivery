import { supabase } from './supabase';

export interface RatingAverage {
  average: number;
  count: number;
}

// Busca todas as avaliações de uma vez e agrupa em memória — evita N+1
// (uma query por restaurante) na listagem da home.
export async function getRestaurantRatingAverages(): Promise<Map<string, RatingAverage>> {
  if (!supabase) return new Map();

  const { data, error } = await supabase.from('reviews').select('restaurant_id, rating');
  if (error || !data) return new Map();

  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of data) {
    if (!r.restaurant_id) continue;
    const entry = sums.get(r.restaurant_id) ?? { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    sums.set(r.restaurant_id, entry);
  }

  const result = new Map<string, RatingAverage>();
  for (const [id, { sum, count }] of sums) {
    result.set(id, { average: sum / count, count });
  }
  return result;
}

export interface RestaurantReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  restaurantReply: string | null;
  reviewerName: string;
  createdAt: string;
}

export async function getReviewsForRestaurant(restaurantId: string): Promise<RestaurantReviewRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, restaurant_reply, user_id, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar avaliações:', error?.message);
    return [];
  }

  const userIds = Array.from(new Set(data.map((r) => r.user_id)));
  let nameById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email.split('@')[0]]));
  }

  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    restaurantReply: r.restaurant_reply,
    reviewerName: nameById.get(r.user_id) ?? 'Cliente',
    createdAt: new Date(r.created_at).toLocaleDateString('pt-BR'),
  }));
}
