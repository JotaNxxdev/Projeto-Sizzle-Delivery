'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_STATUS_LABEL, type Order } from '@/lib/types';

const STATUS_CLASS: Record<string, string> = {
  Pendente: 'pending',
  'Em Preparação': 'in-progress',
  Entregue: 'delivered',
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  in_process: 'pending',
  approved: 'delivered',
  rejected: 'cancelled',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await fetch('/api/orders');
        const body = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(body?.error || 'Erro ao carregar pedidos.');
        }
        setOrders(body.orders);
      } catch (err) {
        console.error('[Sizzle] Erro ao carregar pedidos:', err);
        if (!cancelled) setError('Não foi possível carregar seus pedidos agora.');
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Meus Pedidos</h1>
      </header>
      <main className="app-main-menu">
        <div id="orders-list">
          {error && <p className="empty-state">{error}</p>}
          {!error && orders === null && <p className="empty-state">Carregando pedidos...</p>}
          {!error && orders && orders.length === 0 && (
            <p className="empty-state">Você ainda não fez nenhum pedido.</p>
          )}
          {orders?.map((order) => (
            <div className="order-item" key={order.id}>
              <div className="order-header">
                <h4>Pedido #{order.id}</h4>
                <span className={`order-status ${STATUS_CLASS[order.status] ?? ''}`}>{order.status}</span>
              </div>
              <div className="order-details">
                <p>
                  <span className={`order-status ${PAYMENT_STATUS_CLASS[order.paymentStatus] ?? 'pending'}`}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                </p>
                <p>
                  <strong>Restaurante:</strong> {order.restaurantName}
                </p>
                <p>
                  <strong>Data:</strong> {order.date}
                </p>
                <p>
                  <strong>Observações:</strong> {order.notes || 'Nenhuma'}
                </p>
                <p>
                  <strong>Endereço:</strong> {order.address || 'Não informado'}
                </p>
                <p>
                  <strong>Itens:</strong>
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
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
