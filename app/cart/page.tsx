'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import BackButton from '@/components/BackButton';
import { formatCurrency } from '@/lib/format';

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
            <p className="empty-state">Seu carrinho está vazio.</p>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.cartItemId}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>{formatCurrency(item.price)}</p>
                  {item.selectedOptions.length > 0 && (
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>
                      {item.selectedOptions.map((option) => option.valueName).join(', ')}
                    </p>
                  )}
                </div>
                <div className="item-quantity-price">
                  <div className="item-quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                      -
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      aria-label={`Aumentar quantidade de ${item.name}`}
                    >
                      +
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
            <p className="empty-state" style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12 }}>
              Pedido mínimo desse restaurante: {formatCurrency(minOrderValue)}. Faltam{' '}
              {formatCurrency(minOrderValue - subtotal)}.
            </p>
          )}
          <button className="checkout-button" onClick={handleCheckout} disabled={belowMinimum}>
            Finalizar Pedido
          </button>
        </div>
      </main>
    </div>
  );
}
