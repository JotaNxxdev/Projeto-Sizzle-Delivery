'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import BackButton from '@/components/BackButton';
import { formatCurrency } from '@/lib/format';

export default function CartPage() {
  const { cart, updateQuantity, subtotal } = useCart();
  const router = useRouter();

  const deliveryFee = cart[0]?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  function handleCheckout() {
    if (cart.length === 0) {
      alert('Seu carrinho está vazio. Adicione itens para continuar.');
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
              <div className="cart-item" key={item.menuItemId}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>{formatCurrency(item.price)}</p>
                </div>
                <div className="item-quantity-price">
                  <div className="item-quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                      -
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
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
          <button className="checkout-button" onClick={handleCheckout}>
            Finalizar Pedido
          </button>
        </div>
      </main>
    </div>
  );
}
