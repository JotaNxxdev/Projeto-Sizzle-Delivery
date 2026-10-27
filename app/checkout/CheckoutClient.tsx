'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import BackButton from '@/components/BackButton';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Radio from '@/components/ui/Radio';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { isValidBrazilianPhone } from '@/lib/phone';
import type { DeliveryMethod, PaymentMethod } from '@/lib/types';
import type { Address } from '@/lib/addresses';
import PixPayment from './PixPayment';

interface PendingPayment {
  orderCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

interface CompletedOrder {
  orderCode: string;
  total: number;
}

const NEW_ADDRESS_OPTION = '__new__';

// Formata pro formato que <input type="datetime-local"> espera
// (YYYY-MM-DDTHH:mm, sem timezone) usando o horário local do navegador.
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const { showToast } = useToast();

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
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(NEW_ADDRESS_OPTION);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/addresses')
      .then((response) => response.json())
      .then((body) => {
        if (cancelled) return;
        const addresses: Address[] = body?.addresses ?? [];
        setSavedAddresses(addresses);

        const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          applyAddress(defaultAddress);
        }
      })
      .catch((err) => console.error('[Sizzle] Erro ao carregar endereços salvos:', err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyAddress(address: Address) {
    setStreet(address.street);
    setStreetNumber(address.streetNumber);
    setComplement(address.complement ?? '');
    setNeighborhood(address.neighborhood);
    setCity(address.city);
    setReferencePoint(address.referencePoint ?? '');
  }

  function handleSelectAddress(addressId: string) {
    setSelectedAddressId(addressId);
    if (addressId === NEW_ADDRESS_OPTION) {
      setStreet('');
      setStreetNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setReferencePoint('');
      return;
    }
    const address = savedAddresses.find((a) => a.id === addressId);
    if (address) applyAddress(address);
  }

  const deliveryFee = cart[0]?.deliveryFee ?? 0;
  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal - discount + deliveryFee;

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    if (cart.length === 0) return;

    setApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: cart[0].restaurantId, code: couponInput, subtotal }),
      });
      const result = await response.json();

      if (!result.valid) {
        showToast(result.error || 'Cupom inválido.', 'error');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discount: result.discount });
      showToast(`Cupom aplicado! Desconto de ${formatCurrency(result.discount)}.`, 'success');
    } catch (err) {
      console.error('[Sizzle] Erro ao validar cupom:', err);
      showToast('Não foi possível validar o cupom agora.', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
  }

  async function handleSubmit() {
    // Trava extra contra clique duplo — o botão já fica disabled enquanto
    // submitting é true, isso aqui é só uma segunda camada de segurança.
    if (submitting) return;

    if (cart.length === 0) {
      showToast('Não há itens no carrinho.', 'error');
      router.push('/');
      return;
    }

    if (!receiverName.trim() || !contact.trim()) {
      showToast('Por favor, preencha o nome e o telefone para contato.', 'error');
      return;
    }

    if (!isValidBrazilianPhone(contact)) {
      showToast('Telefone inválido. Informe um número com DDD, ex: (11) 91234-5678.', 'error');
      return;
    }

    if (deliveryMethod === 'delivery' && (!street.trim() || !streetNumber.trim() || !neighborhood.trim() || !city.trim())) {
      showToast('Por favor, preencha rua, número, bairro e cidade para a entrega.', 'error');
      return;
    }

    if (paymentMethod === 'cash' && changeFor.trim()) {
      const changeForValue = Number(changeFor);
      if (!Number.isFinite(changeForValue) || changeForValue <= total) {
        showToast(`O troco precisa ser maior que o total do pedido (${formatCurrency(total)}).`, 'error');
        return;
      }
    }

    if (isScheduled && !scheduledFor) {
      showToast('Escolha o horário pra agendar o pedido.', 'error');
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
            selectedValueIds: item.selectedOptions.map((option) => option.valueId),
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
          couponCode: appliedCoupon?.code || undefined,
          scheduledFor: isScheduled && scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
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
          showToast(
            `Pedido #${body.orderCode} registrado, mas não conseguimos gerar o Pix agora. Combine o pagamento com o restaurante ou tente novamente pela tela de pedidos.`,
            'error'
          );
        }
        setCompletedOrder({ orderCode: body.orderCode, total });
      }
    } catch (err) {
      console.error('[Sizzle] Erro ao finalizar pedido:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível enviar o pedido.';
      showToast(`${message} Seu carrinho foi mantido — tente novamente.`, 'error');
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

  if (completedOrder) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Pedido confirmado</h1>
        </header>
        <main className="app-main-menu">
          <div className="checkout-form" style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--color-success)' }}>Pedido #{completedOrder.orderCode} enviado!</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              O restaurante já recebeu seu pedido e vai começar a preparar.
              <br />
              Total: {formatCurrency(completedOrder.total)}
            </p>
            <Button variant="primary" fullWidth onClick={() => router.push('/orders')}>
              Ver meus pedidos
            </Button>
            <Button variant="secondary" fullWidth style={{ marginTop: 'var(--space-3)' }} onClick={() => router.push('/')}>
              Voltar para o início
            </Button>
          </div>
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
          <Input
            label="Nome de quem vai receber"
            id="receiver-name"
            type="text"
            placeholder="Seu nome"
            value={receiverName}
            onChange={(event) => setReceiverName(event.target.value)}
          />
          <Input
            label="Número para contato"
            id="contact-number"
            type="tel"
            placeholder="(00) 00000-0000"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
          />

          <div className="ui-field">
            <span className="ui-field-label">Forma de entrega</span>
            <div className="radio-row">
              <Radio
                name="deliveryMethod"
                checked={deliveryMethod === 'delivery'}
                onChange={() => setDeliveryMethod('delivery')}
                label="Entrega"
              />
              <Radio
                name="deliveryMethod"
                checked={deliveryMethod === 'pickup'}
                onChange={() => setDeliveryMethod('pickup')}
                label="Retirada no local"
              />
            </div>
          </div>

          <div className="ui-field">
            <span className="ui-field-label">Quando entregar/retirar</span>
            <div className="radio-row" style={{ marginBottom: isScheduled ? 'var(--space-2)' : 0 }}>
              <Radio name="whenOrder" checked={!isScheduled} onChange={() => setIsScheduled(false)} label="Agora" />
              <Radio name="whenOrder" checked={isScheduled} onChange={() => setIsScheduled(true)} label="Agendar" />
            </div>
            {isScheduled && (
              <input
                type="datetime-local"
                className="ui-input"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                min={toDatetimeLocal(new Date(Date.now() + 30 * 60 * 1000))}
                max={toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
              />
            )}
          </div>

          {deliveryMethod === 'delivery' && (
            <>
              {savedAddresses.length > 0 && (
                <Select
                  label="Endereço salvo"
                  id="saved-address"
                  value={selectedAddressId}
                  onChange={(event) => handleSelectAddress(event.target.value)}
                >
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} — {address.street}, {address.streetNumber}
                    </option>
                  ))}
                  <option value={NEW_ADDRESS_OPTION}>Digitar outro endereço</option>
                </Select>
              )}
              <Input label="Rua" id="street" type="text" value={street} onChange={(event) => setStreet(event.target.value)} />
              <div className="form-row">
                <Input
                  label="Número"
                  id="street-number"
                  type="text"
                  value={streetNumber}
                  onChange={(event) => setStreetNumber(event.target.value)}
                />
                <Input
                  label="Complemento"
                  id="complement"
                  type="text"
                  placeholder="Apto, bloco... (opcional)"
                  value={complement}
                  onChange={(event) => setComplement(event.target.value)}
                />
              </div>
              <Input
                label="Bairro"
                id="neighborhood"
                type="text"
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              />
              <Input label="Cidade" id="city" type="text" value={city} onChange={(event) => setCity(event.target.value)} />
              <Input
                label="Ponto de referência"
                id="reference-point"
                type="text"
                placeholder="Opcional"
                value={referencePoint}
                onChange={(event) => setReferencePoint(event.target.value)}
              />
            </>
          )}

          <Textarea
            label="Observações do pedido"
            id="order-notes"
            rows={4}
            placeholder="Ex: Sem cebola, ponto da carne, etc."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <Select
            label="Forma de pagamento"
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          >
            {onlinePaymentEnabled && <option value="pix">Pix (pague agora pelo app)</option>}
            <option value="cash">Dinheiro na entrega</option>
            <option value="card">Cartão na entrega</option>
          </Select>

          {paymentMethod === 'cash' && (
            <Input
              label="Precisa de troco para quanto? (opcional)"
              id="change-for"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 100"
              value={changeFor}
              onChange={(event) => setChangeFor(event.target.value)}
            />
          )}

          <div className="ui-field">
            <span className="ui-field-label">Cupom de desconto</span>
            {appliedCoupon ? (
              <div className="coupon-row">
                <span className="coupon-applied">
                  <Tag size={14} aria-hidden="true" /> {appliedCoupon.code} aplicado (-{formatCurrency(appliedCoupon.discount)})
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={handleRemoveCoupon}>
                  Remover
                </Button>
              </div>
            ) : (
              <div className="coupon-row">
                <input
                  id="coupon-code"
                  type="text"
                  className="ui-input"
                  placeholder="Ex: BEMVINDO10"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleApplyCoupon} loading={applyingCoupon} disabled={!couponInput.trim()}>
                  Aplicar
                </Button>
              </div>
            )}
          </div>

          {discount > 0 && (
            <div className="summary-line">
              <span>Desconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="summary-line total" style={{ marginBottom: 'var(--space-5)' }}>
            <span>Total do pedido</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={submitting}>
            Confirmar Pedido
          </Button>
        </div>
      </main>
    </div>
  );
}
