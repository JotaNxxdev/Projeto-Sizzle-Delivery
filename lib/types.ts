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
  onlinePaymentEnabled: boolean;
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
  onlinePaymentEnabled: boolean;
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

export type DeliveryMethod = 'delivery' | 'pickup';

export const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  delivery: 'Entrega',
  pickup: 'Retirada no local',
};

export type PaymentMethod = 'pix' | 'cash' | 'card';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  card: 'Cartão na entrega',
};

export interface OrderAddress {
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  referencePoint: string | null;
}

export interface Order {
  id: string;
  restaurantName: string;
  items: OrderItem[];
  notes: string | null;
  contact: string;
  address: string;
  receiverName: string | null;
  addressDetails: OrderAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  changeFor: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  date: string;
}
