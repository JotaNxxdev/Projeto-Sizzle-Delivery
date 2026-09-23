'use client';

import { useState } from 'react';
import { claimDelivery } from './actions';
import QrScanButton from './QrScanButton';

export default function ClaimForm() {
  const [code, setCode] = useState('');

  return (
    <div className="checkout-form">
      <h3 style={{ marginTop: 0 }}>Assumir uma entrega</h3>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0 }}>
        Digite o código do pedido (o mesmo que aparece na comanda) ou escaneie o QR code.
      </p>
      <QrScanButton onScan={(value) => setCode(value)} />
      <form action={claimDelivery}>
        <div className="form-group">
          <label htmlFor="code">Código do pedido</label>
          <input
            id="code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Ex: PED-AB12CD345"
            required
          />
        </div>
        <button type="submit" className="checkout-button">
          Assumir entrega
        </button>
      </form>
    </div>
  );
}
