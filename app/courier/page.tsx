import { getCurrentProfile } from '@/lib/auth';
import { getCourierActiveOrders } from '@/lib/courier-data';
import { markPickedUp, markDelivered } from './actions';
import ClaimForm from './ClaimForm';
import {
  DELIVERY_METHOD_LABEL,
  PAYMENT_METHOD_LABEL,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const STATUS_CLASS: Record<string, string> = {
  Pendente: 'pending',
  'Em Preparação': 'in-progress',
  'Saiu para entrega': 'out-for-delivery',
  Entregue: 'delivered',
  Recusado: 'cancelled',
  Cancelado: 'cancelled',
};

export const dynamic = 'force-dynamic';

export default async function CourierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const orders = await getCourierActiveOrders(profile.id);

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <ClaimForm />

      <h2 style={{ marginTop: 30 }}>Minhas entregas ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="empty-state">Nenhuma entrega atribuída a você no momento.</p>
      ) : (
        orders.map((order) => (
          <div className="order-item" key={order.id}>
            <div className="order-header">
              <h4>Pedido #{order.orderCode}</h4>
              <span className={`order-status ${STATUS_CLASS[order.status] ?? ''}`}>{order.status}</span>
            </div>
            <div className="order-details">
              <p>
                <strong>Recebido em:</strong> {order.createdAt}
              </p>
              <p>
                <strong>Recebe:</strong> {order.receiverName || 'Não informado'}
              </p>
              <p>
                <strong>Contato:</strong> {order.contact}
              </p>
              <p>
                <strong>Entrega:</strong>{' '}
                {DELIVERY_METHOD_LABEL[order.deliveryMethod as DeliveryMethod] ?? order.deliveryMethod}
              </p>
              <p>
                <strong>Endereço:</strong> {order.address}
              </p>
              {order.referencePoint && (
                <p>
                  <strong>Referência:</strong> {order.referencePoint}
                </p>
              )}
              <p>
                <strong>Pagamento:</strong>{' '}
                {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}
                {order.paymentMethod === 'cash' && order.changeFor != null && (
                  <> — troco para {formatCurrency(order.changeFor)}</>
                )}
              </p>
              <p>
                <strong>Total:</strong> {formatCurrency(order.total)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              {order.status !== 'Saiu para entrega' && (
                <form action={markPickedUp}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button type="submit" className="quantity-btn admin-btn">
                    Marcar como retirado
                  </button>
                </form>
              )}
              <form action={markDelivered}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="quantity-btn admin-btn">
                  Marcar como entregue
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
