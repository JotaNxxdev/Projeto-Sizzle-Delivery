'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import BackButton from '@/components/BackButton';
import { formatCurrency } from '@/lib/format';
import PixPayment from './PixPayment';

interface PendingPayment {
  orderCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

export default function CheckoutClient({ defaultContact }: { defaultContact: string }) {
  const { cart, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState(defaultContact);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  const deliveryFee = cart[0]?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit() {
    if (cart.length === 0) {
      alert('Não há itens no carrinho.');
      router.push('/');
      return;
    }

    if (!contact.trim() || !address.trim()) {
      alert('Por favor, preencha o telefone e o endereço de entrega.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: cart[0].restaurantId,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
          notes,
          contact,
          address,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || 'Não foi possível enviar o pedido.');
      }

      clearCart();

      if (body.payment) {
        // Pagamento Pix configurado: mostra o QR Code em vez de navegar embora.
        setPendingPayment({
          orderCode: body.orderCode,
          qrCode: body.payment.qrCode,
          qrCodeBase64: body.payment.qrCodeBase64,
        });
      } else {
        if (body.paymentError) {
          alert(
            `Pedido #${body.orderCode} registrado, mas não conseguimos gerar o Pix agora. Combine o pagamento com o restaurante ou tente novamente pela tela de pedidos.`
          );
        }
        router.push('/orders');
      }
    } catch (err) {
      console.error('[Sizzle] Erro ao finalizar pedido:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível enviar o pedido.';
      alert(`${message} Seu carrinho foi mantido — tente novamente.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Finalizar Pedido</h1>
      </header>
      <main className="app-main-menu">
        {pendingPayment ? (
          <PixPayment
            orderCode={pendingPayment.orderCode}
            qrCode={pendingPayment.qrCode}
            qrCodeBase64={pendingPayment.qrCodeBase64}
          />
        ) : (
          <div className="checkout-form">
            <div className="form-group">
              <label htmlFor="order-notes">Observações do pedido:</label>
              <textarea
                id="order-notes"
                rows={4}
                placeholder="Ex: Sem cebola, ponto da carne, etc."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact-number">Número para contato:</label>
              <input
                id="contact-number"
                type="tel"
                placeholder="(00) 00000-0000"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="delivery-address">Endereço de Entrega:</label>
              <input
                id="delivery-address"
                type="text"
                placeholder="Rua, Número, Bairro, Cidade"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div className="summary-line total" style={{ marginBottom: 20 }}>
              <span>Total do pedido</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button className="checkout-button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
