'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import type { MenuItem, Restaurant } from '@/lib/types';

export default function MenuClient({ restaurant }: { restaurant: Restaurant }) {
  const { addItem } = useCart();
  const router = useRouter();

  const groupedMenu = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of restaurant.menu) {
      const key = item.category || 'Geral';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [restaurant.menu]);

  function handleAdd(item: MenuItem) {
    const { blocked } = addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deliveryFee: restaurant.deliveryFee,
      onlinePaymentEnabled: restaurant.onlinePaymentEnabled,
      minOrderValue: restaurant.minOrderValue,
    });

    if (!blocked) {
      router.push('/cart');
    }
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
    </>
  );
}
