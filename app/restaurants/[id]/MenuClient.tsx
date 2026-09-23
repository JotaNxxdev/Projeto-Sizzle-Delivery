'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import type { MenuItem, Restaurant } from '@/lib/types';

export default function MenuClient({ restaurant }: { restaurant: Restaurant }) {
  const { addItem } = useCart();
  const router = useRouter();

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
      {restaurant.menu.map((item) => (
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
              disabled={!restaurant.isOpen}
              style={!restaurant.isOpen ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {restaurant.isOpen ? 'Adicionar' : 'Fechado'}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
