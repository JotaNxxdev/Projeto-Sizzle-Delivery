'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const NAV_ITEMS = [
  { href: '/', label: 'Início', Icon: Home },
  { href: '/orders', label: 'Pedidos', Icon: ClipboardList },
  { href: '/cart', label: 'Carrinho', Icon: ShoppingCart },
  { href: '/profile', label: 'Perfil', Icon: User },
];

// Painéis de dono de restaurante, admin e entregador têm a própria
// navegação e ocupam a tela inteira — a barra do cliente só atrapalha,
// sobrepondo conteúdo neles.
const HIDDEN_PREFIXES = ['/restaurant', '/admin', '/courier'];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <footer className="app-footer">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav-item${isActive ? ' active' : ''}`}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon size={22} strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
              {href === '/cart' && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </footer>
  );
}
