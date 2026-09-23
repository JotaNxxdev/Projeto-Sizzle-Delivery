'use client';

import type { RestaurantReport } from '@/lib/restaurant-data';

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
}

export default function ExportCsvButton({ report }: { report: RestaurantReport }) {
  function handleExport() {
    const rows: (string | number)[][] = [
      ['Período', 'Pedidos', 'Faturamento'],
      ['Hoje', report.ordersToday, report.revenueToday.toFixed(2)],
      ['Últimos 7 dias', report.ordersWeek, report.revenueWeek.toFixed(2)],
      ['Este mês', report.ordersMonth, report.revenueMonth.toFixed(2)],
      ['Total', report.ordersTotal, report.revenueTotal.toFixed(2)],
      ['Ticket médio', '', report.averageTicket.toFixed(2)],
      [],
      ['Item mais vendido', 'Quantidade', 'Receita'],
      ...report.topItems.map((item) => [item.name, item.quantity, item.revenue.toFixed(2)]),
    ];

    // BOM no início pro Excel reconhecer UTF-8 corretamente (acentos etc.).
    const csv = '﻿' + toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-sizzle-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="quantity-btn admin-btn" onClick={handleExport}>
      <i className="fas fa-download" aria-hidden="true" /> Baixar CSV
    </button>
  );
}
