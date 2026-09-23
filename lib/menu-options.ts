import { supabase } from './supabase';
import type { MenuItemOptionGroup } from './types';

// Busca grupos + valores de vários itens de uma vez (2 queries batched em vez
// de N+1) e agrupa em memória — mesmo padrão já usado em lib/reviews.ts,
// lib/restaurant-data.ts etc. pra contornar a tipagem incerta de embeds
// to-many do supabase-js sem os tipos gerados do schema.
export async function getOptionGroupsForMenuItems(menuItemIds: string[]): Promise<Map<string, MenuItemOptionGroup[]>> {
  const result = new Map<string, MenuItemOptionGroup[]>();
  if (!supabase || menuItemIds.length === 0) return result;

  const { data: groups, error } = await supabase
    .from('menu_item_option_groups')
    .select('id, menu_item_id, name, min_selections, max_selections, sort_order')
    .in('menu_item_id', menuItemIds)
    .order('sort_order', { ascending: true });

  if (error || !groups || groups.length === 0) return result;

  const groupIds = groups.map((g) => g.id);
  const { data: values } = await supabase
    .from('menu_item_option_values')
    .select('id, group_id, name, price_delta, sort_order')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  const valuesByGroup = new Map<string, MenuItemOptionGroup['values']>();
  for (const v of values ?? []) {
    const list = valuesByGroup.get(v.group_id) ?? [];
    list.push({ id: v.id, name: v.name, priceDelta: Number(v.price_delta) });
    valuesByGroup.set(v.group_id, list);
  }

  for (const g of groups) {
    const list = result.get(g.menu_item_id) ?? [];
    list.push({
      id: g.id,
      name: g.name,
      minSelections: g.min_selections,
      maxSelections: g.max_selections,
      values: valuesByGroup.get(g.id) ?? [],
    });
    result.set(g.menu_item_id, list);
  }

  return result;
}
