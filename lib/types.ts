export interface MenuItemOptionValue {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  values: MenuItemOptionValue[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  optionGroups: MenuItemOptionGroup[];
}

export interface DayHours {
  enabled: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

// Array de 7 posições: domingo = índice 0 ... sábado = índice 6.
export type BusinessHours = DayHours[];

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
  isOpen: boolean; // toggle manual (pausar/reabrir loja)
  businessHours: BusinessHours | null;
  isOpenNow: boolean; // computado: isOpen && dentro do horário configurado
  minOrderValue: number;
  reviewCount: number;
  menu: MenuItem[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  valueId: string;
  valueName: string;
  priceDelta: number;
}

export interface CartItem {
  // Identifica uma combinação de item + adicionais escolhidos, pra poder ter
  // duas linhas diferentes do mesmo item no carrinho (ex: um X-Bacon com
  // bacon extra e outro sem). Igual ao menuItemId quando não há adicionais.
  cartItemId: string;
  menuItemId: string;
  name: string;
  price: number; // preço final por unidade, já somando os adicionais escolhidos
  image: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
  onlinePaymentEnabled: boolean;
  minOrderValue: number;
  selectedOptions: SelectedOption[];
}

export interface OrderItemOption {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  options: OrderItemOption[];
}

export type OrderStatus =
  | 'Pendente'
  | 'Em Preparação'
  | 'Saiu para entrega'
  | 'Entregue'
  | 'Recusado'
  | 'Cancelado';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pendente',
  'Em Preparação',
  'Saiu para entrega',
  'Entregue',
  'Recusado',
  'Cancelado',
];

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

export interface OrderReview {
  rating: number;
  comment: string | null;
  restaurantReply: string | null;
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
  rejectionReason: string | null;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  couponCode: string | null;
  discountAmount: number;
  total: number;
  date: string;
  review: OrderReview | null;
}
