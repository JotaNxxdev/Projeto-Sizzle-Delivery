import QRCode from 'qrcode';
import { notFound, redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { getOrderForOwner, getRestaurantSettings } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';
import {
  DELIVERY_METHOD_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type DeliveryMethod,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/types';
import AutoPrint from './AutoPrint';

export const dynamic = 'force-dynamic';

const PAYMENT_STATUS_TONE: Record<string, string> = {
  approved: 'positive',
  pending: 'warning',
  in_process: 'warning',
  rejected: 'negative',
  cancelled: 'negative',
  refunded: 'negative',
};

export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/print/orders/${id}`);
  if (profile.role !== 'restaurant_owner' || !profile.restaurantId) redirect('/');

  const [order, restaurant] = await Promise.all([
    getOrderForOwner(profile.restaurantId, id),
    getRestaurantSettings(profile.restaurantId),
  ]);
  if (!order) notFound();

  // Código que o entregador vai escanear pra bater com o pedido — só o
  // código do pedido por enquanto (formato simples, fácil de conferir
  // manualmente se a câmera falhar).
  const qrDataUrl = await QRCode.toDataURL(order.orderCode, { margin: 1, width: 240 });

  const createdAt = new Date(order.createdAtIso);
  const dateLabel = createdAt.toLocaleDateString('pt-BR');
  const timeLabel = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="comanda">
      <AutoPrint />

      <header className="comanda-header">
        <div className="comanda-header-brand">
          <h1>{restaurant?.name || 'Sizzle Delivery'}</h1>
          <p>Comanda de entrega</p>
        </div>
        <div className="comanda-header-meta">
          <p className="comanda-order-code">#{order.orderCode}</p>
          <p className="comanda-datetime">
            {dateLabel} • {timeLabel}
          </p>
        </div>
      </header>

      <section className="comanda-section">
        <p className="comanda-label">Cliente</p>
        <p className="comanda-value">{order.receiverName || 'Não informado'}</p>

        <p className="comanda-label">Telefone</p>
        <p className="comanda-value">{order.contact}</p>

        <p className="comanda-label">Entrega</p>
        <p className="comanda-value">
          {DELIVERY_METHOD_LABEL[order.deliveryMethod as DeliveryMethod] ?? order.deliveryMethod}
        </p>

        <p className="comanda-label">Endereço</p>
        <p className="comanda-value" style={{ marginBottom: order.referencePoint ? 4 : undefined }}>
          {order.address}
        </p>

        {order.referencePoint && (
          <>
            <p className="comanda-label">Referência</p>
            <p className="comanda-value">{order.referencePoint}</p>
          </>
        )}

        <p className="comanda-label">Entregador</p>
        <p className="comanda-value">{order.courierName || 'Não atribuído'}</p>
      </section>

      <hr className="comanda-divider" />

      <section>
        <h2 className="comanda-section-title">Itens do pedido</h2>
        <table className="comanda-table">
          <thead>
            <tr>
              <th>Qtd</th>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{String(item.quantity).padStart(2, '0')}</td>
                <td>
                  {item.name}
                  {item.options.length > 0 && (
                    <>
                      <br />
                      <span style={{ fontSize: '0.85em', color: '#555' }}>
                        {item.options.map((o) => o.optionName).join(', ')}
                      </span>
                    </>
                  )}
                </td>
                <td>{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="comanda-totals">
        <p className="comanda-line">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </p>
        <p className="comanda-line">
          <span>Taxa de entrega</span>
          <span>{formatCurrency(order.deliveryFee)}</span>
        </p>
        <p className="comanda-total">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </p>

        {order.paymentMethod === 'pix' ? (
          <p className={`comanda-payment-status ${PAYMENT_STATUS_TONE[order.paymentStatus] ?? 'warning'}`}>
            Pagamento: Pix • {PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}
          </p>
        ) : (
          <p className="comanda-payment-status neutral">
            Pagamento: {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod} na entrega
            {order.paymentMethod === 'cash' && order.changeFor != null && (
              <> • troco para {formatCurrency(order.changeFor)}</>
            )}
          </p>
        )}
      </div>

      {order.notes && (
        <>
          <hr className="comanda-divider" />
          <p className="comanda-label">Observações</p>
          <p className="comanda-value">{order.notes}</p>
        </>
      )}

      <div className="comanda-qr">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URI gerado no servidor, não é uma imagem otimizável */}
        <img src={qrDataUrl} alt={`Código de retirada do pedido ${order.orderCode}`} width={180} height={180} />
        <p className="comanda-qr-caption">Escaneie para conferir o pedido</p>
        <p className="comanda-qr-code">{order.orderCode}</p>
      </div>
    </div>
  );
}
