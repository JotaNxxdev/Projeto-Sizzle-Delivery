import { Users } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getCustomersForRestaurant } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function RestaurantCustomersPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const customers = await getCustomersForRestaurant(profile.restaurantId);

  return (
    <div>
      <h2>Clientes ({customers.length})</h2>
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente fez pedido ainda" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Pedidos</th>
              <th>Total gasto</th>
              <th>Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.userId}>
                <Td label="Cliente">{customer.name}</Td>
                <Td label="Contato">
                  {customer.email}
                  {customer.phone && ` · ${customer.phone}`}
                </Td>
                <Td label="Pedidos">{customer.orderCount}</Td>
                <Td label="Total gasto">{formatCurrency(customer.totalSpent)}</Td>
                <Td label="Último pedido">{customer.lastOrderAt}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
