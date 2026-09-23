import { getAdminDashboardStats } from '@/lib/admin-data';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="report-grid">
        <div className="report-card">
          <h4>Pedidos hoje</h4>
          <p>{stats.ordersToday}</p>
        </div>
        <div className="report-card">
          <h4>Faturamento hoje</h4>
          <p>{formatCurrency(stats.revenueToday)}</p>
        </div>
        <div className="report-card">
          <h4>Restaurantes</h4>
          <p>{stats.totalRestaurants}</p>
          <span>{stats.openRestaurants} abertos agora</span>
        </div>
        <div className="report-card">
          <h4>Clientes</h4>
          <p>{stats.totalCustomers}</p>
        </div>
        <div className="report-card">
          <h4>Entregadores</h4>
          <p>{stats.totalCouriers}</p>
        </div>
        <div className="report-card">
          <h4>Pedidos em andamento</h4>
          <p>{stats.ordersInProgress}</p>
        </div>
        <div className="report-card">
          <h4>Pedidos cancelados</h4>
          <p>{stats.cancelledOrders}</p>
        </div>
        <div className="report-card">
          <h4>Ticket médio</h4>
          <p>{formatCurrency(stats.averageTicket)}</p>
        </div>
      </div>
    </div>
  );
}
