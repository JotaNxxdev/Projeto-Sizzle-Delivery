'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print comanda-actions">
      <button type="button" onClick={() => window.print()}>
        Imprimir
      </button>
      <Link href="/restaurant">Voltar</Link>
    </div>
  );
}
