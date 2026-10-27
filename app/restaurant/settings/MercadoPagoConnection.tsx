'use client';

import { useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { disconnectMercadoPago, toggleOnlinePayment } from '../actions';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';

export default function MercadoPagoConnection({
  restaurantId,
  connected,
  onlinePaymentEnabled,
}: {
  restaurantId: string;
  connected: boolean;
  onlinePaymentEnabled: boolean;
}) {
  const toggleFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="checkout-form" style={{ marginBottom: 'var(--space-5)' }}>
      <h3 style={{ marginTop: 0 }}>Pagamento online (Pix)</h3>

      {!connected ? (
        <>
          <p className="hint-text">
            Conecte a sua própria conta do Mercado Pago para receber os pagamentos Pix dos seus clientes direto na
            sua conta — a Sizzle Delivery não fica com o dinheiro em nenhum momento.
          </p>
          <a href="/api/mercadopago/connect" className="ui-button ui-button-primary ui-button-md ui-button-block">
            Conectar com Mercado Pago
          </a>
        </>
      ) : (
        <>
          <p className="mp-connected-notice">
            <CheckCircle2 size={16} aria-hidden="true" /> Conta do Mercado Pago conectada
          </p>

          <form ref={toggleFormRef} action={toggleOnlinePayment} style={{ marginBottom: 'var(--space-4)' }}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="enabled" value={(!onlinePaymentEnabled).toString()} />
            <Switch
              label="Aceitar pagamento online (Pix) neste restaurante"
              checked={onlinePaymentEnabled}
              onChange={() => toggleFormRef.current?.requestSubmit()}
            />
          </form>

          <form action={disconnectMercadoPago}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <Button type="submit" variant="secondary" size="sm">
              Desconectar conta do Mercado Pago
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
