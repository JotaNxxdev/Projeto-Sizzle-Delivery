'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import BackButton from '@/components/BackButton';
import { formatCurrency } from '@/lib/format';
import type { DeliveryMethod, PaymentMethod } from '@/lib/types';
import PixPayment from './PixPayment';

interface PendingPayment {
  orderCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

export default function CheckoutClient({
  defaultContact,
  defaultReceiverName,
}: {
  defaultContact: string;
  defaultReceiverName: string;
}) {
  const { cart, subtotal, clearCart } = useCart();
  const router = useRouter();

  const onlinePaymentEnabled = cart[0]?.onlinePaymentEnabled ?? false;

  const [receiverName, setReceiverName] = useState(defaultReceiverName);
  const [contact, setContact] = useState(defaultContact);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(onlinePaymentEnabled ? 'pix' : 'cash');
  const [changeFor, setChangeFor] = useState('');
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

    if (!receiverName.trim() || !contact.trim()) {
      alert('Por favor, preencha o nome e o telefone para contato.');
      return;
    }

    if (deliveryMethod === 'delivery' && (!street.trim() || !streetNumber.trim() || !neighborhood.trim() || !city.trim())) {
      alert('Por favor, preencha rua, número, bairro e cidade para a entrega.');
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
          receiverName,
          deliveryMethod,
          street,
          streetNumber,
          complement,
          neighborhood,
          city,
          referencePoint,
          paymentMethod,
          changeFor: paymentMethod === 'cash' && changeFor.trim() ? Number(changeFor) : null,
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

  if (pendingPayment) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <BackButton />
          <h1>Finalizar Pedido</h1>
        </header>
        <main className="app-main-menu">
          <PixPayment
            orderCode={pendingPayment.orderCode}
            qrCode={pendingPayment.qrCode}
            qrCodeBase64={pendingPayment.qrCodeBase64}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Finalizar Pedido</h1>
      </header>
      <main className="app-main-menu">
        <div className="checkout-form">
          <div className="form-group">
            <label htmlFor="receiver-name">Nome de quem vai receber:</label>
            <input
              id="receiver-name"
              type="text"
              placeholder="Seu nome"
              value={receiverName}
              onChange={(event) => setReceiverName(event.target.value)}
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
            <label>Forma de entrega:</label>
            <div className="radio-group" style={{ marginBottom: 0 }}>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={deliveryMethod === 'delivery'}
                  onChange={() => setDeliveryMethod('delivery')}
                />
                Entrega
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => setDeliveryMethod('pickup')}
                />
                Retirada no local
              </label>
            </div>
          </div>

          {deliveryMethod === 'delivery' && (
            <>
              <div className="form-group">
                <label htmlFor="street">Rua:</label>
                <input id="street" type="text" value={street} onChange={(event) => setStreet(event.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="street-number">Número:</label>
                  <input
                    id="street-number"
                    type="text"
                    value={streetNumber}
                    onChange={(event) => setStreetNumber(event.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="complement">Complemento:</label>
                  <input
                    id="complement"
                    type="text"
                    placeholder="Apto, bloco... (opcional)"
                    value={complement}
                    onChange={(event) => setComplement(event.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="neighborhood">Bairro:</label>
                <input
                  id="neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">Cidade:</label>
                <input id="city" type="text" value={city} onChange={(event) => setCity(event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reference-point">Ponto de referência:</label>
                <input
                  id="reference-point"
                  type="text"
                  placeholder="Opcional"
                  value={referencePoint}
                  onChange={(event) => setReferencePoint(event.target.value)}
                />
              </div>
            </>
          )}

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
            <label htmlFor="payment-method">Forma de pagamento:</label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            >
              {onlinePaymentEnabled && <option value="pix">Pix (pague agora pelo app)</option>}
              <option value="cash">Dinheiro na entrega</option>
              <option value="card">Cartão na entrega</option>
            </select>
          </div>

          {paymentMethod === 'cash' && (
            <div className="form-group">
              <label htmlFor="change-for">Precisa de troco para quanto? (opcional)</label>
              <input
                id="change-for"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 100"
                value={changeFor}
                onChange={(event) => setChangeFor(event.target.value)}
              />
            </div>
          )}

          <div className="summary-line total" style={{ marginBottom: 20 }}>
            <span>Total do pedido</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button className="checkout-button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </main>
    </div>
  );
}
