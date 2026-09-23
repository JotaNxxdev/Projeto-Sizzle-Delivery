import { notFound, redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { getOrderForOwner } from '@/lib/restaurant-data';
import { formatCurrency } from '@/lib/format';
import { DELIVERY_METHOD_LABEL, PAYMENT_METHOD_LABEL, type DeliveryMethod, type PaymentMethod } from '@/lib/types';
import AutoPrint from './AutoPrint';

export const dynamic = 'force-dynamic';

export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/print/orders/${id}`);
  if (profile.role !== 'restaurant_owner' || !profile.restaurantId) redirect('/');

  const order = await getOrderForOwner(profile.restaurantId, id);
  if (!order) notFound();

  return (
    <div className="comanda">
      <AutoPrint />

      <h2>Sizzle Delivery</h2>
      <p className="comanda-code">Pedido #{order.orderCode}</p>
      <p style={{ textAlign: 'center', margin: 0 }}>{order.createdAt}</p>

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
        <strong>Pagamento:</strong> {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}
        {order.paymentMethod === 'cash' && order.changeFor != null && (
          <> — troco para {formatCurrency(order.changeFor)}</>
        )}
      </p>
      {order.notes && (
        <p>
          <strong>Obs:</strong> {order.notes}
        </p>
      )}
    </div>
  );
}
