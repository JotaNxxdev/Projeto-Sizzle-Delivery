import { db } from './db';

export interface CatalogOptionValue {
  id: string;
  name: string;
  priceDelta: number;
}

export interface CatalogOptionGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  values: CatalogOptionValue[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  optionGroups: CatalogOptionGroup[];
}

export interface CatalogCategory {
  name: string;
  items: CatalogItem[];
}

export interface Catalog {
  restaurantId: string;
  name: string;
  deliveryFee: number;
  minOrderValue: number;
  manualPixKey: string | null;
  isOpenNow: boolean;
  categories: CatalogCategory[];
}

// Só pra MOSTRAR o cardápio pro cliente no WhatsApp (nome, preço, adicionais).
// O preço final de verdade é sempre recalculado pelo site, em
// app/api/orders/route.ts e app/api/orders/preview/route.ts — o bot nunca
// decide um total por conta própria. Sempre exige restaurantId (nunca busca
// cardápio "de todo mundo" de uma vez).
export async function getCatalog(restaurantId: string): Promise<Catalog | null> {
  if (!restaurantId) throw new Error('restaurantId é obrigatório.');

  const { data: restaurant, error: restaurantError } = await db
    .from('restaurants')
    .select('id, name, delivery_fee, min_order_value, manual_pix_key, is_open, business_hours')
    .eq('id', restaurantId)
    .single();

  if (restaurantError || !restaurant) {
    return null;
  }

  const { data: items, error: itemsError } = await db
    .from('menu_items')
    .select(
      'id, name, description, price, category, menu_item_option_groups(id, name, min_selections, max_selections, sort_order, menu_item_option_values(id, name, price_delta, sort_order))'
    )
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('category', { ascending: true });

  if (itemsError) {
    throw new Error(`Erro ao buscar cardápio do restaurante ${restaurantId}: ${itemsError.message}`);
  }

  const categoriesByName = new Map<string, CatalogItem[]>();
  for (const row of items ?? []) {
    const optionGroups: CatalogOptionGroup[] = (row.menu_item_option_groups ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group) => ({
        id: group.id,
        name: group.name,
        minSelections: group.min_selections,
        maxSelections: group.max_selections,
        values: (group.menu_item_option_values ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((value) => ({ id: value.id, name: value.name, priceDelta: Number(value.price_delta) })),
      }));

    const item: CatalogItem = {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: Number(row.price),
      category: row.category,
      optionGroups,
    };

    const list = categoriesByName.get(item.category) ?? [];
    list.push(item);
    categoriesByName.set(item.category, list);
  }

  return {
    restaurantId: restaurant.id,
    name: restaurant.name,
    deliveryFee: Number(restaurant.delivery_fee),
    minOrderValue: Number(restaurant.min_order_value),
    manualPixKey: restaurant.manual_pix_key,
    // Simplificado em relação ao lib/business-hours.ts do site (que trata
    // virada de madrugada) — aqui só evita abrir pedido com a loja fechada
    // no toggle manual; o site valida de novo de qualquer forma na hora de
    // criar o pedido de verdade, então um falso "aberto" aqui nunca passa.
    isOpenNow: restaurant.is_open,
    categories: Array.from(categoriesByName.entries()).map(([name, catItems]) => ({ name, items: catItems })),
  };
}
