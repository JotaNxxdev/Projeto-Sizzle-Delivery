'use client';

import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/format';

// Mesmo teto validado no servidor (app/api/orders/route.ts) — só pra não
// deixar o botão "+" sugerir uma quantidade que o pedido vai recusar depois.
const MAX_ITEM_QUANTITY = 50;

export default function CartPage() {
  const { cart, updateQuantity, subtotal } = useCart();
  const router = useRouter();
  const { showToast } = useToast();

  const deliveryFee = cart[0]?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const minOrderValue = cart[0]?.minOrderValue ?? 0;
  const belowMinimum = minOrderValue > 0 && subtotal < minOrderValue;

  function handleCheckout() {
    if (cart.length === 0) {
      showToast('Seu carrinho está vazio. Adicione itens para continuar.', 'error');
      return;
    }
    if (belowMinimum) {
      showToast(`Pedido mínimo desse restaurante: ${formatCurrency(minOrderValue)}.`, 'error');
      return;
    }
    router.push('/checkout');
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Seu Carrinho</h1>
      </header>
      <main className="app-main-menu cart-main">
        <div id="cart-items-list">
          {cart.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Seu carrinho está vazio" description="Adicione itens de um restaurante para continuar." />
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.cartItemId}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>{formatCurrency(item.price)}</p>
                  {item.selectedOptions.length > 0 && (
                    <p className="cart-item-options">{item.selectedOptions.map((option) => option.valueName).join(', ')}</p>
                  )}
                </div>
                <div className="item-quantity-price">
                  <div className="item-quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      aria-label={`Aumentar quantidade de ${item.name}`}
                      disabled={item.quantity >= MAX_ITEM_QUANTITY}
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div id="cart-summary">
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Taxa de Entrega</span>
            <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}</span>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {belowMinimum && (
            <div className="closed-banner">
              Pedido mínimo desse restaurante: {formatCurrency(minOrderValue)}. Faltam{' '}
              {formatCurrency(minOrderValue - subtotal)}.
            </div>
          )}
          <button className="checkout-button" onClick={handleCheckout} disabled={belowMinimum}>
            Finalizar Pedido
          </button>
        </div>
      </main>
    </div>
  );
}
