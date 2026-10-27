import TabBar, { type TabBarItem } from '@/components/TabBar';

const TABS: TabBarItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'fas fa-gauge-high', exact: true },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: 'fas fa-store' },
  { href: '/admin/orders', label: 'Pedidos', icon: 'fas fa-receipt' },
  { href: '/admin/users', label: 'Usuários', icon: 'fas fa-users' },
  { href: '/admin/audit', label: 'Auditoria', icon: 'fas fa-shield-halved' },
];

export default function AdminTabs() {
  return <TabBar tabs={TABS} ariaLabel="Seções do painel do administrador" />;
}
