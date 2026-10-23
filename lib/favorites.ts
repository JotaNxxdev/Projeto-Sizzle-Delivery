import { supabase } from './supabase';

export async function getFavoriteRestaurantIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();

  const { data, error } = await supabase.from('favorites').select('restaurant_id').eq('user_id', userId);
  if (error || !data) {
    console.error('[Sizzle] Erro ao buscar favoritos:', error?.message);
    return new Set();
  }

  return new Set(data.map((f) => f.restaurant_id));
}
