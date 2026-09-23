'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentStatus } from '@/lib/types';
import { PAYMENT_STATUS_LABEL } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';

const POLL_INTERVAL_MS = 4000;
const TERMINAL_STATUSES: PaymentStatus[] = ['approved', 'rejected', 'cancelled', 'refunded'];

export default function PixPayment({
  orderCode,
  qrCode,
  qrCodeBase64,
}: {
  orderCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/payment-status`);
        const body = await response.json();
        if (cancelled) return;

        const newStatus = (body?.paymentStatus ?? 'pending') as PaymentStatus;
        setStatus(newStatus);

        if (!TERMINAL_STATUSES.includes(newStatus)) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        console.error('[Sizzle] Erro ao consultar status do pagamento:', err);
        if (!cancelled) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [orderCode]);

  async function handleCopy() {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Não foi possível copiar. Selecione o código manualmente.', 'error');
    }
  }

  if (status === 'approved') {
    return (
      <div className="checkout-form" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#43B55C' }}>Pagamento confirmado!</h2>
        <p>Seu pedido #{orderCode} foi pago e já foi enviado para o restaurante.</p>
        <button className="checkout-button" onClick={() => router.push('/orders')}>
          Ver meus pedidos
        </button>
      </div>
    );
  }

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="checkout-form" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#F26666' }}>{PAYMENT_STATUS_LABEL[status]}</h2>
        <p>O pagamento do pedido #{orderCode} não foi concluído. Você pode tentar novamente pela tela de pedidos.</p>
        <button className="checkout-button" onClick={() => router.push('/orders')}>
          Ver meus pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-form" style={{ textAlign: 'center' }}>
      <h2>Pague com Pix para confirmar</h2>
      <p style={{ color: '#666' }}>Pedido #{orderCode} — escaneie o QR Code ou copie o código abaixo</p>

      {qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code Pix"
          style={{ width: 220, height: 220, margin: '15px auto', display: 'block' }}
        />
      )}

      {qrCode && (
        <>
          <textarea
            readOnly
            value={qrCode}
            rows={3}
            style={{ width: '100%', fontSize: '0.75rem', marginBottom: 10, resize: 'none' }}
            onFocus={(event) => event.target.select()}
          />
          <button type="button" className="add-to-cart-button" onClick={handleCopy} style={{ marginBottom: 15 }}>
            {copied ? 'Copiado!' : 'Copiar código Pix'}
          </button>
        </>
      )}

      <p className="empty-state" style={{ padding: 0 }}>
        Aguardando confirmação do pagamento... esta tela atualiza sozinha.
      </p>
    </div>
  );
}
