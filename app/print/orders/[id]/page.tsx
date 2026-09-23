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
  const qrDataUrl = await QRCode.toDataURL(order.orderCode, { margin: 1, width: 200 });

  return (
    <div className="comanda">
      <AutoPrint />

      <h2 style={restaurant?.brandColor ? { color: restaurant.brandColor } : undefined}>
        {restaurant?.name || 'Sizzle Delivery'}
      </h2>
      {restaurant?.category && <p className="comanda-subtitle">{restaurant.category}</p>}
      <p className="comanda-subtitle">Pedido via Sizzle Delivery</p>

      <hr />

      <p className="comanda-code">Pedido #{order.orderCode}</p>
      <p style={{ textAlign: 'center', margin: 0 }}>{order.createdAt}</p>
      <p className="comanda-line" style={{ marginTop: 8 }}>
        <span>Status</span>
        <span>{order.status}</span>
      </p>
      <p className="comanda-line">
        <span>Pagamento</span>
        <span>{PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}</span>
      </p>

      <hr />

      <p>
        <strong>Cliente:</strong> {order.receiverName || 'Não informado'}
      </p>
      <p>
        <strong>Contato:</strong> {order.contact}
      </p>
      <p>
        <strong>Entrega:</strong> {DELIVERY_METHOD_LABEL[order.deliveryMethod as DeliveryMethod] ?? order.deliveryMethod}
      </p>
      <p>
        <strong>Endereço:</strong> {order.address}
      </p>

      <hr />

      <ul className="comanda-items">
        {order.items.map((item, index) => (
          <li key={index}>
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <hr />

      <p className="comanda-line">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </p>
      <p className="comanda-line">
        <span>Entrega</span>
        <span>{formatCurrency(order.deliveryFee)}</span>
      </p>
      <p className="comanda-line comanda-total">
        <span>Total</span>
        <span>{formatCurrency(order.total)}</span>
      </p>

      <hr />

      <p>
        <strong>Forma de pagamento:</strong>{' '}
        {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}
        {order.paymentMethod === 'cash' && order.changeFor != null && (
          <> — troco para {formatCurrency(order.changeFor)}</>
        )}
      </p>
      {order.notes && (
        <p>
          <strong>Obs:</strong> {order.notes}
        </p>
      )}

      <hr />

      <div className="comanda-qr">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URI gerado no servidor, não é uma imagem otimizável */}
        <img src={qrDataUrl} alt={`Código de retirada do pedido ${order.orderCode}`} width={140} height={140} />
        <p>Código de retirada: {order.orderCode}</p>
      </div>
    </div>
  );
}
