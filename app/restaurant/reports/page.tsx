import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantReport } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/types';
import ExportCsvButton from './ExportCsvButton';

export const dynamic = 'force-dynamic';

export default async function RestaurantReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const report = await getRestaurantReport(profile.restaurantId);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 15,
        }}
      >
        <h2 style={{ marginBottom: 0 }}>Relatórios</h2>
        <ExportCsvButton report={report} />
      </div>

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

      <div className="report-grid" style={{ marginBottom: 25 }}>
        <div className="report-card">
          <h4>Ticket médio</h4>
          <p>{formatCurrency(report.averageTicket)}</p>
        </div>
        <div className="report-card">
          <h4>Descontos concedidos</h4>
          <p>{formatCurrency(report.totalDiscountGiven)}</p>
        </div>
        <div className="report-card">
          <h4>Cancelados</h4>
          <p>{report.cancelledOrders}</p>
        </div>
        <div className="report-card">
          <h4>Recusados</h4>
          <p>{report.rejectedOrders}</p>
        </div>
      </div>

      <h3>Por forma de pagamento</h3>
      {report.paymentMethodBreakdown.length === 0 ? (
        <p className="empty-state">Ainda não há dados suficientes.</p>
      ) : (
        <div className="admin-table-wrapper" style={{ marginBottom: 25 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Forma de pagamento</th>
                <th>Pedidos</th>
                <th>Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {report.paymentMethodBreakdown.map((row) => (
                <tr key={row.method}>
                  <td>{PAYMENT_METHOD_LABEL[row.method as PaymentMethod] ?? row.method}</td>
                  <td>{row.orders}</td>
                  <td>{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
