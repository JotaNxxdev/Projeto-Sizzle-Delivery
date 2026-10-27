'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const TABS = [
  { href: '/admin', label: 'Dashboard', icon: 'fa-gauge-high' },
  { href: '/admin/restaurants', label: 'Restaurantes', icon: 'fa-store' },
  { href: '/admin/orders', label: 'Pedidos', icon: 'fa-receipt' },
  { href: '/admin/users', label: 'Usuários', icon: 'fa-users' },
  { href: '/admin/audit', label: 'Auditoria', icon: 'fa-shield-halved' },
];

// Client component por dois motivos: usePathname pra saber qual aba está
// ativa (sem repetir essa lógica em cada page.tsx do admin), e pra medir a
// posição real do link ativo (getBoundingClientRect) e mover o indicador
// deslizante até ele — não dá pra fazer isso só com CSS porque a largura de
// cada aba varia com o texto.
export default function AdminTabs() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const activeHref =
    TABS.find((tab) => (tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)))?.href ?? TABS[0].href;

  useEffect(() => {
    function measure() {
      const nav = navRef.current;
      const active = tabRefs.current[activeHref];
      if (!nav || !active) return;
      const navRect = nav.getBoundingClientRect();
      const tabRect = active.getBoundingClientRect();
      setIndicator({ left: tabRect.left - navRect.left + nav.scrollLeft, width: tabRect.width });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeHref]);

  return (
    <nav className="admin-tabs" ref={navRef} aria-label="Seções do painel">
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            ref={(el) => {
              tabRefs.current[tab.href] = el;
            }}
            className={active ? 'admin-tab admin-tab-active' : 'admin-tab'}
            aria-current={active ? 'page' : undefined}
          >
            <i className={`fas ${tab.icon}`} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      {indicator && <span className="admin-tab-indicator" style={{ left: indicator.left, width: indicator.width }} />}
    </nav>
  );
}
