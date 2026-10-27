'use client';

import { useState } from 'react';
import { claimDelivery } from './actions';
import QrScanButton from './QrScanButton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ClaimForm() {
  const [code, setCode] = useState('');

  return (
    <div className="checkout-form">
      <h3 style={{ marginTop: 0 }}>Assumir uma entrega</h3>
      <p className="hint-text" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
        Digite o código do pedido (o mesmo que aparece na comanda) ou escaneie o QR code.
      </p>
      <QrScanButton onScan={(value) => setCode(value)} />
      <form action={claimDelivery}>
        <Input
          label="Código do pedido"
          id="code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ex: PED-AB12CD345"
          required
        />
        <Button type="submit" variant="primary" fullWidth style={{ marginTop: 'var(--space-4)' }}>
          Assumir entrega
        </Button>
      </form>
    </div>
  );
}
