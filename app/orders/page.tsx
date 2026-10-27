'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import BackButton from '@/components/BackButton';
import StarRating from '@/components/StarRating';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatCurrency } from '@/lib/format';
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL, getPaymentStatusLabel, type Order } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';

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
  const confirm = useConfirm();
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
    const ok = await confirm({
      message: `Cancelar o pedido #${orderCode}? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Cancelar pedido',
      cancelLabel: 'Voltar',
      danger: true,
    });
    if (!ok) return;

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
          {error && <ErrorState description={error} />}
          {!error && orders === null && (
            <div className="order-item-skeletons">
              <Skeleton height={110} radius="lg" />
              <Skeleton height={110} radius="lg" />
            </div>
          )}
          {!error && orders && orders.length === 0 && (
            <EmptyState icon={ClipboardList} title="Você ainda não fez nenhum pedido" description="Seus pedidos aparecem aqui assim que você finalizar uma compra." />
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
                    {getPaymentStatusLabel(order.paymentMethod, order.paymentStatus)}
                  </span>
                </p>
                <p>
                  <strong>Restaurante:</strong> {order.restaurantName}
                </p>
                <p>
                  <strong>Data:</strong> {order.date}
                </p>
                {order.scheduledFor && (
                  <p>
                    <strong>Agendado para:</strong> {order.scheduledFor}
                  </p>
                )}
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
                        <span style={{ color: 'var(--color-text-muted)' }}> — {item.options.map((o) => o.optionName).join(', ')}</span>
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
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => handleCancel(order.id)}
                  loading={cancellingId === order.id}
                >
                  Cancelar pedido
                </Button>
              )}
              {order.status === 'Entregue' && (
                <div className="order-review-block">
                  {order.review ? (
                    <>
                      <p style={{ marginBottom: 'var(--space-1)' }}>
                        <strong>Sua avaliação:</strong>
                      </p>
                      <StarRating value={order.review.rating} readOnly size={18} />
                      {order.review.comment && <p style={{ marginTop: 'var(--space-1)' }}>{order.review.comment}</p>}
                      {order.review.restaurantReply && (
                        <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
                          <strong>Resposta do restaurante:</strong> {order.review.restaurantReply}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={{ marginBottom: 'var(--space-1)' }}>
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
                      <Textarea
                        placeholder="Comentário (opcional)"
                        value={reviewDrafts[order.id]?.comment ?? ''}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [order.id]: { rating: prev[order.id]?.rating ?? 0, comment: e.target.value },
                          }))
                        }
                        style={{ marginTop: 'var(--space-2)', minHeight: 60 }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSubmitReview(order.id)}
                        loading={submittingReviewId === order.id}
                      >
                        Enviar avaliação
                      </Button>
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
