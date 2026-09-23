'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import MenuItemOptionsModal from '@/components/MenuItemOptionsModal';
import type { MenuItem, Restaurant, SelectedOption } from '@/lib/types';

export default function MenuClient({ restaurant }: { restaurant: Restaurant }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [optionsModalItem, setOptionsModalItem] = useState<MenuItem | null>(null);

  const groupedMenu = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of restaurant.menu) {
      const key = item.category || 'Geral';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [restaurant.menu]);

  function addToCart(item: MenuItem, selectedOptions: SelectedOption[], unitPrice: number) {
    // O cartItemId identifica a combinação item + adicionais escolhidos, pra
    // duas escolhas diferentes do mesmo item virarem linhas separadas no carrinho.
    const cartItemId =
      selectedOptions.length === 0
        ? item.id
        : `${item.id}:${selectedOptions
            .map((o) => o.valueId)
            .sort()
            .join(',')}`;

    const { blocked } = addItem({
      cartItemId,
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      image: item.image,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deliveryFee: restaurant.deliveryFee,
      onlinePaymentEnabled: restaurant.onlinePaymentEnabled,
      minOrderValue: restaurant.minOrderValue,
      selectedOptions,
    });

    if (!blocked) {
      router.push('/cart');
    }
  }

  function handleAdd(item: MenuItem) {
    if (item.optionGroups.length > 0) {
      setOptionsModalItem(item);
      return;
    }
    addToCart(item, [], item.price);
  }

  if (restaurant.menu.length === 0) {
    return <p className="empty-state">Este restaurante ainda não tem itens no cardápio.</p>;
  }

  return (
    <>
      {groupedMenu.map(([category, items]) => (
        <section key={category} className="menu-category">
          <h3 className="menu-category-title">{category}</h3>
          {items.map((item) => (
            <div className="menu-item" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div className="menu-item-info">
                <h4>{item.name}</h4>
                <p>{item.description}</p>
              </div>
              <div className="menu-item-price">
                <span>{formatCurrency(item.price)}</span>
                <button
                  className="add-to-cart-button"
                  onClick={() => handleAdd(item)}
                  disabled={!restaurant.isOpenNow}
                  style={!restaurant.isOpenNow ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  {restaurant.isOpenNow ? 'Adicionar' : 'Fechado'}
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}

      {optionsModalItem && (
        <MenuItemOptionsModal
          item={optionsModalItem}
          onClose={() => setOptionsModalItem(null)}
          onConfirm={(selectedOptions, unitPrice) => {
            addToCart(optionsModalItem, selectedOptions, unitPrice);
            setOptionsModalItem(null);
          }}
        />
      )}
    </>
  );
}
