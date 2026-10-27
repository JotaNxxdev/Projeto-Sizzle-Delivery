'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface TabBarItem {
  href: string;
  label: string;
  // Classe completa do Font Awesome, ex. "fas fa-store" (sólido) ou
  // "fab fa-whatsapp" (ícone de marca — fica em pacote CSS diferente).
  icon: string;
  // Só a página exata conta como ativa (nunca como "pai" de uma sub-rota).
  // Precisa em qualquer aba cujo href seja prefixo de outra (ex.: "/restaurant"
  // é prefixo de "/restaurant/menu" — sem isso as duas ficariam acesas juntas).
  exact?: boolean;
}

// Barra de abas escura com indicador deslizante (usada no painel do admin e
// no painel do dono do restaurante — mesmo visual nos dois, só muda a lista
// de abas). Client component por causa do usePathname (saber qual está
// ativa) e do getBoundingClientRect (medir a aba ativa pra mover o
// indicador até ela — a largura varia com o texto do label, não dá pra
// fazer só em CSS).
export default function TabBar({ tabs, ariaLabel }: { tabs: TabBarItem[]; ariaLabel: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const activeHref =
    tabs.find((tab) => pathname === tab.href)?.href ??
    tabs.find((tab) => !tab.exact && pathname.startsWith(`${tab.href}/`))?.href ??
    tabs[0]?.href;

  useEffect(() => {
    function measure() {
      const nav = navRef.current;
      const active = activeHref ? tabRefs.current[activeHref] : null;
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
    <nav className="admin-tabs" ref={navRef} aria-label={ariaLabel}>
      {tabs.map((tab) => {
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
            <i className={tab.icon} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      {indicator && <span className="admin-tab-indicator" style={{ left: indicator.left, width: indicator.width }} />}
    </nav>
  );
}
