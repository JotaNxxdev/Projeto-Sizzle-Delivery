import { getCurrentProfile } from '@/lib/auth';
import { getOrdersForRestaurant } from '@/lib/restaurant-data';
import { updateOrderStatusAsOwner } from './actions';
import { ORDER_STATUSES, PAYMENT_STATUS_LABEL, type PaymentStatus } from '@/lib/types';
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const orders = await getOrdersForRestaurant(restaurantId);

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <h2>Pedidos ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="empty-state">Nenhum pedido recebido ainda.</p>
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
                <strong>Contato:</strong> {order.contact}
              </p>
              <p>
                <strong>Endereço:</strong> {order.address}
              </p>
              <p>
                <strong>Observações:</strong> {order.notes || 'Nenhuma'}
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
            </form>
          </div>
        ))
      )}
    </div>
  );
}
