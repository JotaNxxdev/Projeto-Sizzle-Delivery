import { listAllOrders } from '@/lib/admin-data';
import { updateOrderStatusAsAdmin } from '../actions';
import { ORDER_STATUSES, PAYMENT_STATUS_LABEL, type PaymentStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const orders = await listAllOrders();

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}

      <h2>Todos os pedidos ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="empty-state">Nenhum pedido ainda.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Restaurante</th>
              <th>Total</th>
              <th>Data</th>
              <th>Pagamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderCode}</td>
                <td>{order.restaurantName}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>{order.createdAt}</td>
                <td>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}
                </td>
                <td>
                  <form action={updateOrderStatusAsAdmin} className="admin-inline-form">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select name="status" defaultValue={order.status}>
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="quantity-btn admin-btn">
                      Salvar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
