'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import type { CartItem } from '@/lib/types';

const STORAGE_KEY = 'sizzle_cart';

interface CartContextValue {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => { blocked: boolean };
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pendingItem, setPendingItem] = useState<Omit<CartItem, 'quantity'> | null>(null);
  const { showToast } = useToast();

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

  function insertItem(item: Omit<CartItem, 'quantity'>, base: CartItem[]): CartItem[] {
    const existing = base.find((cartItem) => cartItem.cartItemId === item.cartItemId);
    if (existing) {
      return base.map((cartItem) =>
        cartItem.cartItemId === item.cartItemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
    }
    return [...base, { ...item, quantity: 1 }];
  }

  function addItem(item: Omit<CartItem, 'quantity'>): { blocked: boolean } {
    if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
      // Pede confirmação (modal próprio, ver abaixo) em vez de adicionar
      // direto — trocar de restaurante esvazia o carrinho atual.
      setPendingItem(item);
      return { blocked: true };
    }

    setCart((prev) => insertItem(item, prev));
    showToast(`${item.name} adicionado ao carrinho.`, 'success');
    return { blocked: false };
  }

  function confirmPendingItem() {
    if (!pendingItem) return;
    setCart([{ ...pendingItem, quantity: 1 }]);
    showToast(`${pendingItem.name} adicionado ao carrinho.`, 'success');
    setPendingItem(null);
  }

  function cancelPendingItem() {
    setPendingItem(null);
  }

  function updateQuantity(cartItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item))
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
      {pendingItem && (
        <div className="modal-overlay" onClick={cancelPendingItem}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Trocar de restaurante?</h3>
            <p style={{ color: '#666' }}>
              Seu carrinho tem itens de outro restaurante. Adicionar &quot;{pendingItem.name}&quot; esvazia o
              carrinho atual e começa um pedido novo em {pendingItem.restaurantName}.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button type="button" className="checkout-button" style={{ marginTop: 0 }} onClick={confirmPendingItem}>
                Esvaziar e adicionar
              </button>
              <button type="button" className="add-to-cart-button" onClick={cancelPendingItem}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
