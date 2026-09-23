import { supabase } from './supabase';

export interface CourierOrderRow {
  id: string;
  orderCode: string;
  status: string;
  receiverName: string | null;
  contact: string;
  address: string;
  referencePoint: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  changeFor: number | null;
  total: number;
  createdAt: string;
}

const COURIER_ORDER_SELECT =
  'id, order_code, status, receiver_name, contact_number, delivery_address, reference_point, delivery_method, payment_method, payment_status, change_for, total, created_at';

function mapCourierOrder(o: {
  id: string;
  order_code: string;
  status: string;
  receiver_name: string | null;
  contact_number: string;
  delivery_address: string;
  reference_point: string | null;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  change_for: number | string | null;
  total: number | string;
  created_at: string;
}): CourierOrderRow {
  return {
    id: o.id,
    orderCode: o.order_code,
    status: o.status,
    receiverName: o.receiver_name,
    contact: o.contact_number,
    address: o.delivery_address,
    referencePoint: o.reference_point,
    deliveryMethod: o.delivery_method,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    changeFor: o.change_for != null ? Number(o.change_for) : null,
    total: Number(o.total),
    createdAt: new Date(o.created_at).toLocaleString('pt-BR'),
  };
}

export async function getCourierActiveOrders(courierId: string): Promise<CourierOrderRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(COURIER_ORDER_SELECT)
    .eq('courier_id', courierId)
    .neq('status', 'Entregue')
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[Sizzle] Erro ao listar entregas do entregador:', error?.message);
    return [];
  }

  return data.map(mapCourierOrder);
}
