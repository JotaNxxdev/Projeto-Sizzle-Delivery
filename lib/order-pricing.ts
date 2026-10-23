import type { MenuItemOptionGroup } from './types';

// Teto por item — impede pedidos absurdos (ex.: milhares de unidades) que
// contaminam relatórios/dashboard e não fazem sentido pra um delivery.
export const MAX_ITEM_QUANTITY = 50;

export interface PricableMenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  optionGroups: MenuItemOptionGroup[];
}

export interface ResolvedOrderItem {
  name: string;
  price: number; // preço final por unidade, já somando os adicionais escolhidos
  quantity: number;
  image: string;
  options: { groupName: string; optionName: string; priceDelta: number }[];
}

export type ResolveOrderItemResult = { ok: true; item: ResolvedOrderItem } | { ok: false; error: string };

// Núcleo do cálculo de preço de um item de pedido — nunca confia em nada
// vindo do cliente além de "qual item" e "quais opções"; o preço em si
// sempre vem do cardápio carregado no servidor (menuItem). Extraído como
// função pura pra poder testar o cálculo sem precisar de banco de dados.
export function resolveOrderItem(
  menuItem: PricableMenuItem | undefined,
  quantity: number,
  selectedValueIds: string[]
): ResolveOrderItemResult {
  if (!menuItem || !Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
    return { ok: false, error: `Item do pedido inválido (quantidade máxima por item: ${MAX_ITEM_QUANTITY}).` };
  }

  const options: ResolvedOrderItem['options'] = [];
  let optionsPriceDelta = 0;

  for (const group of menuItem.optionGroups) {
    const selectedInGroup = group.values.filter((value) => selectedValueIds.includes(value.id));
    if (selectedInGroup.length < group.minSelections || selectedInGroup.length > group.maxSelections) {
      return {
        ok: false,
        error: `Selecione entre ${group.minSelections} e ${group.maxSelections} opção(ões) em "${group.name}" para ${menuItem.name}.`,
      };
    }
    for (const value of selectedInGroup) {
      options.push({ groupName: group.name, optionName: value.name, priceDelta: value.priceDelta });
      optionsPriceDelta += value.priceDelta;
    }
  }

  const unitPrice = menuItem.price + optionsPriceDelta;
  return {
    ok: true,
    item: { name: menuItem.name, price: unitPrice, quantity, image: menuItem.image, options },
  };
}
