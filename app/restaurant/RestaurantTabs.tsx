import TabBar, { type TabBarItem } from '@/components/TabBar';

const TABS: TabBarItem[] = [
  { href: '/restaurant', label: 'Pedidos', icon: 'fas fa-receipt', exact: true },
  { href: '/restaurant/reports', label: 'Relatórios', icon: 'fas fa-chart-line' },
  { href: '/restaurant/menu', label: 'Cardápio', icon: 'fas fa-utensils' },
  { href: '/restaurant/couriers', label: 'Entregadores', icon: 'fas fa-motorcycle' },
  { href: '/restaurant/coupons', label: 'Cupons', icon: 'fas fa-tag' },
  { href: '/restaurant/customers', label: 'Clientes', icon: 'fas fa-address-book' },
  { href: '/restaurant/whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
  { href: '/restaurant/reviews', label: 'Avaliações', icon: 'fas fa-star' },
  { href: '/restaurant/settings', label: 'Loja', icon: 'fas fa-store' },
];

export default function RestaurantTabs() {
  return <TabBar tabs={TABS} ariaLabel="Seções do painel do restaurante" />;
}
