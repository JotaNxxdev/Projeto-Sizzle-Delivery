import { describe, expect, it } from 'vitest';
import { resolveOrderItem, type PricableMenuItem } from './order-pricing';

const BURGER: PricableMenuItem = {
  id: 'item-1',
  name: 'Burger Clássico',
  price: 25,
  image: '/burger.jpg',
  optionGroups: [
    {
      id: 'group-1',
      name: 'Ponto da carne',
      minSelections: 1,
      maxSelections: 1,
      values: [
        { id: 'val-mal', name: 'Mal passado', priceDelta: 0 },
        { id: 'val-bem', name: 'Bem passado', priceDelta: 0 },
      ],
    },
    {
      id: 'group-2',
      name: 'Adicionais',
      minSelections: 0,
      maxSelections: 2,
      values: [
        { id: 'val-bacon', name: 'Bacon', priceDelta: 5 },
        { id: 'val-queijo', name: 'Queijo extra', priceDelta: 3 },
      ],
    },
  ],
};

describe('resolveOrderItem', () => {
  it('resolve preço base sem adicionais', () => {
    const result = resolveOrderItem(BURGER, 1, ['val-mal']);
    expect(result).toEqual({
      ok: true,
      item: {
        name: 'Burger Clássico',
        price: 25,
        quantity: 1,
        image: '/burger.jpg',
        options: [{ groupName: 'Ponto da carne', optionName: 'Mal passado', priceDelta: 0 }],
      },
    });
  });

  it('soma o priceDelta dos adicionais selecionados', () => {
    const result = resolveOrderItem(BURGER, 2, ['val-bem', 'val-bacon', 'val-queijo']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item.price).toBe(33); // 25 + 5 + 3
      expect(result.item.quantity).toBe(2);
      expect(result.item.options).toHaveLength(3);
    }
  });

  it('rejeita item inexistente', () => {
    const result = resolveOrderItem(undefined, 1, []);
    expect(result.ok).toBe(false);
  });

  it('rejeita quantidade não inteira, zero ou negativa', () => {
    expect(resolveOrderItem(BURGER, 0, ['val-mal']).ok).toBe(false);
    expect(resolveOrderItem(BURGER, -1, ['val-mal']).ok).toBe(false);
    expect(resolveOrderItem(BURGER, 1.5, ['val-mal']).ok).toBe(false);
  });

  it('rejeita quantidade acima do máximo permitido', () => {
    expect(resolveOrderItem(BURGER, 51, ['val-mal']).ok).toBe(false);
  });

  it('rejeita quando um grupo obrigatório não tem seleção', () => {
    const result = resolveOrderItem(BURGER, 1, []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Ponto da carne');
  });

  it('rejeita quando excede o máximo de seleções de um grupo', () => {
    const result = resolveOrderItem(BURGER, 1, ['val-mal', 'val-bacon', 'val-queijo', 'val-bem']);
    // 'val-mal' e 'val-bem' juntos excedem maxSelections=1 do grupo "Ponto da carne"
    expect(result.ok).toBe(false);
  });

  it('ignora ids de seleção que não pertencem ao item', () => {
    const result = resolveOrderItem(BURGER, 1, ['val-mal', 'id-de-outro-item']);
    expect(result.ok).toBe(true);
  });
});
