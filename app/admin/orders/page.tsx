import { ClipboardList } from 'lucide-react';
import { listAllOrders } from '@/lib/admin-data';
import { updateOrderStatusAsAdmin } from '../actions';
import { ORDER_STATUSES, getPaymentStatusLabel, type PaymentMethod, type PaymentStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import InlineSelect from '@/components/ui/InlineSelect';
import Button from '@/components/ui/Button';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

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
      {error && <ErrorState description={error} />}

      <h2>Todos os pedidos ({orders.length})</h2>
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum pedido ainda" />
      ) : (
        <Table>
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
                <Td label="Pedido">{order.orderCode}</Td>
                <Td label="Restaurante">{order.restaurantName}</Td>
                <Td label="Total">{formatCurrency(order.total)}</Td>
                <Td label="Data">{order.createdAt}</Td>
                <Td label="Pagamento">{getPaymentStatusLabel(order.paymentMethod as PaymentMethod, order.paymentStatus as PaymentStatus)}</Td>
                <Td label="Status">
                  <form action={updateOrderStatusAsAdmin} className="admin-inline-form">
                    <input type="hidden" name="orderId" value={order.id} />
                    <InlineSelect name="status" defaultValue={order.status}>
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </InlineSelect>
                    <Button type="submit" variant="secondary" size="sm">
                      Salvar
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
