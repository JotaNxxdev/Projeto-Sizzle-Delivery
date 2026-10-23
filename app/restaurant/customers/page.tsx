import { getCurrentProfile } from '@/lib/auth';
import { getCustomersForRestaurant } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RestaurantCustomersPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const customers = await getCustomersForRestaurant(profile.restaurantId);

  return (
    <div>
      <h2>Clientes ({customers.length})</h2>
      {customers.length === 0 ? (
        <p className="empty-state">Nenhum cliente fez pedido ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
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
                  <td>{customer.name}</td>
                  <td>
                    {customer.email}
                    {customer.phone && ` · ${customer.phone}`}
                  </td>
                  <td>{customer.orderCount}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                  <td>{customer.lastOrderAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
