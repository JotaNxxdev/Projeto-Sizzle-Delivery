'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: 'fa-home' },
  { href: '/orders', label: 'Pedidos', icon: 'fa-list-ul' },
  { href: '/cart', label: 'Carrinho', icon: 'fa-shopping-cart' },
  { href: '/profile', label: 'Perfil', icon: 'fa-user' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="app-footer">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-item${isActive ? ' active' : ''}`}>
            <i className={`fas ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </footer>
  );
}
