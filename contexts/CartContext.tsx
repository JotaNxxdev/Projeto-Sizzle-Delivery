'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '@/lib/types';

const STORAGE_KEY = 'sizzle_cart';

interface CartContextValue {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => { blocked: boolean };
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage não existe no servidor, então a leitura só pode
    // acontecer depois da montagem no cliente — é isso que este efeito faz.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setCart(JSON.parse(stored));
    } catch (err) {
      console.error('[Sizzle] Não foi possível ler o carrinho salvo:', err);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  function addItem(item: Omit<CartItem, 'quantity'>): { blocked: boolean } {
    if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
      const confirmClear = window.confirm(
        'Seu carrinho contém itens de outro restaurante. Deseja limpar o carrinho e adicionar este item?'
      );
      if (!confirmClear) return { blocked: true };
      setCart([{ ...item, quantity: 1 }]);
      return { blocked: false };
    }

    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.menuItemId === item.menuItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    return { blocked: false };
  }

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
