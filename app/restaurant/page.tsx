import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth';
import { getOrdersForRestaurant, getCouriersForRestaurant } from '@/lib/restaurant-data';
import { updateOrderStatusAsOwner, assignCourierToOrder } from './actions';
import {
  DELIVERY_METHOD_LABEL,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type DeliveryMethod,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import { formatCurrency } from '@/lib/format';

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
      {error && <p className="empty-state">{error}</p>}

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
        <p className="empty-state">
          {activeStatus ? `Nenhum pedido com status "${activeStatus}".` : 'Nenhum pedido recebido ainda.'}
        </p>
      ) : (
        orders.map((order) => (
          <div className="order-item" key={order.id}>
            <div className="order-header">
              <h4>Pedido #{order.orderCode}</h4>
              <span className={`order-status ${PAYMENT_STATUS_CLASS[order.paymentStatus] ?? 'pending'}`}>
                {PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}
              </span>
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
              <p>
                <strong>Entregador:</strong> {order.courierName || 'Não atribuído'}
              </p>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.name} ({formatCurrency(item.price)})
                  </li>
                ))}
              </ul>
              <p>
                <strong>Total:</strong> {formatCurrency(order.total)}
              </p>
            </div>
            <form action={updateOrderStatusAsOwner} className="admin-inline-form" style={{ marginTop: 10 }}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="submit" className="quantity-btn admin-btn">
                Atualizar status
              </button>
              <a
                href={`/print/orders/${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="quantity-btn admin-btn"
              >
                <i className="fas fa-print" aria-hidden="true" /> Imprimir comanda
              </a>
            </form>
            {couriers.length > 0 && (
              <form action={assignCourierToOrder} className="admin-inline-form" style={{ marginTop: 10 }}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="orderId" value={order.id} />
                <select name="courierId" defaultValue={order.courierId ?? ''}>
                  <option value="">Sem entregador</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.fullName || courier.email}
                    </option>
                  ))}
                </select>
                <button type="submit" className="quantity-btn admin-btn">
                  Atribuir entregador
                </button>
              </form>
            )}
          </div>
        ))
      )}
    </div>
  );
}
