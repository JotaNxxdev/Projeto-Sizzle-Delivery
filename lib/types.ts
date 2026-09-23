export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  brandColor: string | null;
  description: string | null;
  menu: MenuItem[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'Pendente' | 'Em Preparação' | 'Entregue';

export const ORDER_STATUSES: OrderStatus[] = ['Pendente', 'Em Preparação', 'Entregue'];

// Status do pagamento Pix (Mercado Pago) — independente do status de
// preparo/entrega acima. 'pending' quando ainda não configuramos o
// Mercado Pago (pedido sem cobrança online).
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Aguardando pagamento',
  approved: 'Pago',
  rejected: 'Pagamento recusado',
  cancelled: 'Pagamento cancelado',
  refunded: 'Reembolsado',
  in_process: 'Pagamento em análise',
};

export interface Order {
  id: string;
  restaurantName: string;
  items: OrderItem[];
  notes: string | null;
  contact: string;
  address: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  date: string;
}
