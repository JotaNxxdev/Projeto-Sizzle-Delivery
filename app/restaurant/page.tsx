import Link from 'next/link';
import { Clock, Printer, ClipboardList } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getOrdersForRestaurant, getCouriersForRestaurant } from '@/lib/restaurant-data';
import { updateOrderStatusAsOwner, assignCourierToOrder, acceptOrder, rejectOrder } from './actions';
import {
  DELIVERY_METHOD_LABEL,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABEL,
  getPaymentStatusLabel,
  type DeliveryMethod,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import InlineSelect from '@/components/ui/InlineSelect';

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  in_process: 'pending',
  approved: 'delivered',
  rejected: 'cancelled',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

export const dynamic = 'force-dynamic';

export default async function RestaurantOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { error, status } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const activeStatus = status && (ORDER_STATUSES as string[]).includes(status) ? status : undefined;
  const [orders, couriers] = await Promise.all([
    getOrdersForRestaurant(restaurantId, activeStatus),
    getCouriersForRestaurant(restaurantId),
  ]);

  return (
    <div>
      {error && <ErrorState description={error} />}

      <div className="status-filter-tabs">
        <Link href="/restaurant" className={!activeStatus ? 'active' : undefined}>
          Todos
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/restaurant?status=${encodeURIComponent(s)}`}
            className={activeStatus === s ? 'active' : undefined}
          >
            {s}
          </Link>
        ))}
      </div>

      <h2>Pedidos ({orders.length})</h2>
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={activeStatus ? `Nenhum pedido com status "${activeStatus}"` : 'Nenhum pedido recebido ainda'}
        />
      ) : (
        orders.map((order) => (
          <div className="order-item" key={order.id}>
            <div className="order-header">
              <h4>
                Pedido #{order.orderCode}
                {order.origin === 'whatsapp' && (
                  <span style={{ marginLeft: 'var(--space-2)' }}>
                    <Badge tone="success">WhatsApp</Badge>
                  </span>
                )}
              </h4>
              <span className={`order-status ${PAYMENT_STATUS_CLASS[order.paymentStatus] ?? 'pending'}`}>
                {getPaymentStatusLabel(order.paymentMethod as PaymentMethod, order.paymentStatus as PaymentStatus)}
              </span>
            </div>
            <div className="order-details">
              <p>
                <strong>Recebido em:</strong> {order.createdAt}
              </p>
              {order.scheduledFor && (
                <p className="scheduled-notice">
                  <Clock size={14} aria-hidden="true" /> Agendado para: {order.scheduledFor}
                </p>
              )}
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
              <p>
                <strong>Pagamento:</strong>{' '}
                {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}
                {order.paymentMethod === 'cash' && order.changeFor != null && (
                  <> — troco para {formatCurrency(order.changeFor)}</>
                )}
              </p>
              <p>
                <strong>Observações:</strong> {order.notes || 'Nenhuma'}
              </p>
              {order.status === 'Recusado' && order.rejectionReason && (
                <p>
                  <strong>Motivo da recusa:</strong> {order.rejectionReason}
                </p>
              )}
              <p>
                <strong>Entregador:</strong> {order.courierName || 'Não atribuído'}
              </p>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.name} ({formatCurrency(item.price)})
                    {item.options.length > 0 && (
                      <span style={{ color: 'var(--color-text-muted)' }}> — {item.options.map((o) => o.optionName).join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Total:</strong> {formatCurrency(order.total)}
              </p>
            </div>
            {order.status === 'Pendente' && (
              <div className="order-actions-row">
                <form action={acceptOrder}>
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" variant="success" size="sm">
                    Aceitar pedido
                  </Button>
                </form>
                <form action={rejectOrder} className="admin-inline-form">
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="text" name="reason" placeholder="Motivo da recusa" required />
                  <Button type="submit" variant="danger" size="sm">
                    Recusar
                  </Button>
                </form>
              </div>
            )}
            <form action={updateOrderStatusAsOwner} className="admin-inline-form" style={{ marginTop: 'var(--space-3)' }}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="orderId" value={order.id} />
              <InlineSelect name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </InlineSelect>
              <Button type="submit" variant="secondary" size="sm">
                Atualizar status
              </Button>
              <a href={`/print/orders/${order.id}`} target="_blank" rel="noopener noreferrer" className="ui-button ui-button-secondary ui-button-sm">
                <Printer size={14} aria-hidden="true" /> Imprimir comanda
              </a>
            </form>
            {couriers.length > 0 && (
              <form action={assignCourierToOrder} className="admin-inline-form" style={{ marginTop: 'var(--space-3)' }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="orderId" value={order.id} />
                <InlineSelect name="courierId" defaultValue={order.courierId ?? ''}>
                  <option value="">Sem entregador</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.fullName || courier.email}
                    </option>
                  ))}
                </InlineSelect>
                <Button type="submit" variant="secondary" size="sm">
                  Atribuir entregador
                </Button>
              </form>
            )}
          </div>
        ))
      )}
    </div>
  );
}
