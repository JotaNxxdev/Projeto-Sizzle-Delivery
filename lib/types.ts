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

export interface Order {
  id: string;
  restaurantName: string;
  items: OrderItem[];
  notes: string | null;
  contact: string;
  address: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  date: string;
}
