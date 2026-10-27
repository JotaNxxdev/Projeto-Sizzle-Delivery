'use client';

import { Receipt, LineChart, UtensilsCrossed, Bike, Tag, BookUser, MessageCircle, Star, Store } from 'lucide-react';
import TabBar, { type TabBarItem } from '@/components/TabBar';

const TABS: TabBarItem[] = [
  { href: '/restaurant', label: 'Pedidos', icon: Receipt, exact: true },
  { href: '/restaurant/reports', label: 'Relatórios', icon: LineChart },
  { href: '/restaurant/menu', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/restaurant/couriers', label: 'Entregadores', icon: Bike },
  { href: '/restaurant/coupons', label: 'Cupons', icon: Tag },
  { href: '/restaurant/customers', label: 'Clientes', icon: BookUser },
  { href: '/restaurant/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/restaurant/reviews', label: 'Avaliações', icon: Star },
  { href: '/restaurant/settings', label: 'Loja', icon: Store },
];

export default function RestaurantTabs() {
  return <TabBar tabs={TABS} ariaLabel="Seções do painel do restaurante" />;
}
