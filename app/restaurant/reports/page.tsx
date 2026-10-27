import { BarChart3 } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantReport } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/types';
import ExportCsvButton from './ExportCsvButton';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function RestaurantReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const report = await getRestaurantReport(profile.restaurantId);

  return (
    <div>
      <div className="section-header">
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

      <div className="report-grid" style={{ marginBottom: 'var(--space-6)' }}>
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
        <EmptyState icon={BarChart3} title="Ainda não há dados suficientes" />
      ) : (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Table>
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
                  <Td label="Forma de pagamento">{PAYMENT_METHOD_LABEL[row.method as PaymentMethod] ?? row.method}</Td>
                  <Td label="Pedidos">{row.orders}</Td>
                  <Td label="Faturamento">{formatCurrency(row.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h3>Mais vendidos</h3>
      {report.topItems.length === 0 ? (
        <EmptyState icon={BarChart3} title="Ainda não há dados suficientes" />
      ) : (
        <Table>
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
                <Td label="Item">{item.name}</Td>
                <Td label="Qtd. vendida">{item.quantity}</Td>
                <Td label="Receita">{formatCurrency(item.revenue)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
