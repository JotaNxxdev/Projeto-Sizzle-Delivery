'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import StarRating from '@/components/StarRating';
import { formatCurrency } from '@/lib/format';
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type Order } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';

const STATUS_CLASS: Record<string, string> = {
  Pendente: 'pending',
  'Em Preparação': 'in-progress',
  'Saiu para entrega': 'out-for-delivery',
  Entregue: 'delivered',
  Recusado: 'cancelled',
  Cancelado: 'cancelled',
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  in_process: 'pending',
  approved: 'delivered',
  rejected: 'cancelled',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

async function fetchOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error || 'Erro ao carregar pedidos.');
  }
  return body.orders;
}

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchOrders()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch((err) => {
        console.error('[Sizzle] Erro ao carregar pedidos:', err);
        if (!cancelled) setError('Não foi possível carregar seus pedidos agora.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCancel(orderCode: string) {
    if (!window.confirm(`Cancelar o pedido #${orderCode}? Essa ação não pode ser desfeita.`)) return;

    setCancellingId(orderCode);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/cancel`, { method: 'POST' });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || 'Não foi possível cancelar o pedido.');
      }
      showToast('Pedido cancelado.', 'success');
      const refreshed = await fetchOrders();
      setOrders(refreshed);
    } catch (err) {
      console.error('[Sizzle] Erro ao cancelar pedido:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível cancelar o pedido.';
      showToast(message, 'error');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleSubmitReview(orderCode: string) {
    const draft = reviewDrafts[orderCode];
    if (!draft || draft.rating < 1) {
      showToast('Escolha de 1 a 5 estrelas antes de enviar.', 'error');
      return;
    }

    setSubmittingReviewId(orderCode);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: draft.rating, comment: draft.comment }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || 'Não foi possível enviar sua avaliação.');
      }
      showToast('Avaliação enviada, obrigado!', 'success');
      const refreshed = await fetchOrders();
      setOrders(refreshed);
    } catch (err) {
      console.error('[Sizzle] Erro ao enviar avaliação:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível enviar sua avaliação.';
      showToast(message, 'error');
    } finally {
      setSubmittingReviewId(null);
    }
  }

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
                  <strong>Recebe:</strong> {order.receiverName || 'Não informado'}
                </p>
                <p>
                  <strong>Entrega:</strong> {DELIVERY_METHOD_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
                </p>
                <p>
                  <strong>Endereço:</strong> {order.address || 'Não informado'}
                </p>
                <p>
                  <strong>Pagamento:</strong> {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                  {order.paymentMethod === 'cash' && order.changeFor != null && (
                    <> — troco para {formatCurrency(order.changeFor)}</>
                  )}
                </p>
                <p>
                  <strong>Observações:</strong> {order.notes || 'Nenhuma'}
                </p>
                {order.status === 'Recusado' && order.rejectionReason && (
                  <p>
                    <strong>Motivo da recusa:</strong> {order.rejectionReason}
                  </p>
                )}
                <p>
                  <strong>Itens:</strong>
                </p>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.quantity}x {item.name} ({formatCurrency(item.price)})
                      {item.options.length > 0 && (
                        <span style={{ color: '#666' }}> — {item.options.map((o) => o.optionName).join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {order.discountAmount > 0 && (
                  <p>
                    <strong>Desconto ({order.couponCode}):</strong> -{formatCurrency(order.discountAmount)}
                  </p>
                )}
                <p>
                  <strong>Total:</strong> {formatCurrency(order.total)}
                </p>
              </div>
              {order.status === 'Pendente' && (
                <button
                  type="button"
                  className="quantity-btn admin-btn"
                  style={{ marginTop: 10 }}
                  onClick={() => handleCancel(order.id)}
                  disabled={cancellingId === order.id}
                >
                  {cancellingId === order.id ? 'Cancelando...' : 'Cancelar pedido'}
                </button>
              )}
              {order.status === 'Entregue' && (
                <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #eee' }}>
                  {order.review ? (
                    <>
                      <p style={{ marginBottom: 5 }}>
                        <strong>Sua avaliação:</strong>
                      </p>
                      <StarRating value={order.review.rating} readOnly size={18} />
                      {order.review.comment && <p style={{ marginTop: 5 }}>{order.review.comment}</p>}
                      {order.review.restaurantReply && (
                        <p style={{ marginTop: 5, color: '#666' }}>
                          <strong>Resposta do restaurante:</strong> {order.review.restaurantReply}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={{ marginBottom: 5 }}>
                        <strong>Avalie esse pedido:</strong>
                      </p>
                      <StarRating
                        value={reviewDrafts[order.id]?.rating ?? 0}
                        onChange={(rating) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [order.id]: { rating, comment: prev[order.id]?.comment ?? '' },
                          }))
                        }
                      />
                      <textarea
                        placeholder="Comentário (opcional)"
                        value={reviewDrafts[order.id]?.comment ?? ''}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [order.id]: { rating: prev[order.id]?.rating ?? 0, comment: e.target.value },
                          }))
                        }
                        style={{ display: 'block', width: '100%', marginTop: 8, minHeight: 60 }}
                      />
                      <button
                        type="button"
                        className="quantity-btn admin-btn"
                        style={{ marginTop: 8 }}
                        onClick={() => handleSubmitReview(order.id)}
                        disabled={submittingReviewId === order.id}
                      >
                        {submittingReviewId === order.id ? 'Enviando...' : 'Enviar avaliação'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
