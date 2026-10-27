import { Bike } from 'lucide-react';
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
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
      {error && <ErrorState description={error} />}

      <ClaimForm />

      <h2 style={{ marginTop: 'var(--space-8)' }}>Minhas entregas ({orders.length})</h2>
      {orders.length === 0 ? (
        <EmptyState icon={Bike} title="Nenhuma entrega atribuída a você no momento" />
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
            <div className="order-actions-row">
              {order.status !== 'Saiu para entrega' && (
                <form action={markPickedUp}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Marcar como retirado
                  </Button>
                </form>
              )}
              <form action={markDelivered}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" variant="success" size="sm">
                  Marcar como entregue
                </Button>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
