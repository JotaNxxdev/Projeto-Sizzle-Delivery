import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantReport } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RestaurantReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const report = await getRestaurantReport(profile.restaurantId);

  return (
    <div>
      <h2>Relatórios</h2>

      <div className="report-grid">
        <div className="report-card">
          <h4>Hoje</h4>
          <p>{formatCurrency(report.revenueToday)}</p>
          <span>{report.ordersToday} pedido(s)</span>
        </div>
        <div className="report-card">
          <h4>Últimos 7 dias</h4>
          <p>{formatCurrency(report.revenueWeek)}</p>
          <span>{report.ordersWeek} pedido(s)</span>
        </div>
        <div className="report-card">
          <h4>Este mês</h4>
          <p>{formatCurrency(report.revenueMonth)}</p>
          <span>{report.ordersMonth} pedido(s)</span>
        </div>
        <div className="report-card">
          <h4>Total</h4>
          <p>{formatCurrency(report.revenueTotal)}</p>
          <span>{report.ordersTotal} pedido(s)</span>
        </div>
      </div>

      <div className="report-card" style={{ textAlign: 'left', marginBottom: 25 }}>
        <h4>Ticket médio</h4>
        <p>{formatCurrency(report.averageTicket)}</p>
      </div>

      <h3>Mais vendidos</h3>
      {report.topItems.length === 0 ? (
        <p className="empty-state">Ainda não há dados suficientes.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd. vendida</th>
                <th>Receita</th>
              </tr>
            </thead>
            <tbody>
              {report.topItems.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
