import { disconnectMercadoPago, toggleOnlinePayment } from '../actions';

export default function MercadoPagoConnection({
  restaurantId,
  connected,
  onlinePaymentEnabled,
}: {
  restaurantId: string;
  connected: boolean;
  onlinePaymentEnabled: boolean;
}) {
  return (
    <div className="checkout-form" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Pagamento online (Pix)</h3>

      {!connected ? (
        <>
          <p style={{ color: '#666' }}>
            Conecte a sua própria conta do Mercado Pago para receber os pagamentos Pix dos seus clientes direto na
            sua conta — a Sizzle Delivery não fica com o dinheiro em nenhum momento.
          </p>
          <a href="/api/mercadopago/connect" className="checkout-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Conectar com Mercado Pago
          </a>
        </>
      ) : (
        <>
          <p style={{ color: '#43B55C', fontWeight: 600 }}>✓ Conta do Mercado Pago conectada</p>

          <form action={toggleOnlinePayment} className="admin-inline-form" style={{ marginBottom: 15 }}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="enabled" value={(!onlinePaymentEnabled).toString()} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={onlinePaymentEnabled} readOnly />
              Aceitar pagamento online (Pix) neste restaurante
            </label>
            <button type="submit" className="quantity-btn admin-btn">
              {onlinePaymentEnabled ? 'Desativar' : 'Ativar'}
            </button>
          </form>

          <form action={disconnectMercadoPago}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <button type="submit" className="quantity-btn admin-btn">
              Desconectar conta do Mercado Pago
            </button>
          </form>
        </>
      )}
    </div>
  );
}
