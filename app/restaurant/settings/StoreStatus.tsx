'use client';

import { useRef } from 'react';
import { toggleStoreOpen } from '../actions';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';

export default function StoreStatus({
  restaurantId,
  isOpen,
  isOpenNow,
}: {
  restaurantId: string;
  isOpen: boolean;
  isOpenNow: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  let tone: 'success' | 'danger' | 'warning' = 'success';
  let statusText = 'Aberta — recebendo pedidos';
  if (!isOpen) {
    tone = 'danger';
    statusText = 'Pausada manualmente — não aparece pra novos pedidos';
  } else if (!isOpenNow) {
    tone = 'warning';
    statusText = 'Fechada agora — fora do horário de funcionamento configurado';
  }

  return (
    <div className="checkout-form" style={{ marginBottom: 'var(--space-5)' }}>
      <h3 style={{ marginTop: 0 }}>Status da loja</h3>
      <div className="store-status-row">
        <Badge tone={tone}>{statusText}</Badge>
      </div>
      <form ref={formRef} action={toggleStoreOpen}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="isOpen" value={(!isOpen).toString()} />
        <Switch
          label={isOpen ? 'Loja aberta (toque pra pausar)' : 'Loja pausada (toque pra reabrir)'}
          checked={isOpen}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </form>
    </div>
  );
}
