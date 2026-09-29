'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: 'fa-home' },
  { href: '/orders', label: 'Pedidos', icon: 'fa-list-ul' },
  { href: '/cart', label: 'Carrinho', icon: 'fa-shopping-cart' },
  { href: '/profile', label: 'Perfil', icon: 'fa-user' },
];

// Painéis de dono de restaurante, admin e entregador têm a própria
// navegação e ocupam a tela inteira — a barra do cliente só atrapalha,
// sobrepondo conteúdo neles.
const HIDDEN_PREFIXES = ['/restaurant', '/admin', '/courier'];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

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
