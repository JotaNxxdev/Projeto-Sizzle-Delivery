'use client';

import { Gauge, Store, Receipt, Users, ShieldCheck } from 'lucide-react';
import TabBar, { type TabBarItem } from '@/components/TabBar';

const TABS: TabBarItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Gauge, exact: true },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: Store },
  { href: '/admin/orders', label: 'Pedidos', icon: Receipt },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/audit', label: 'Auditoria', icon: ShieldCheck },
];

export default function AdminTabs() {
  return <TabBar tabs={TABS} ariaLabel="Seções do painel do administrador" />;
}
