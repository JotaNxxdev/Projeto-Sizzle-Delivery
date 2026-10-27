'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

const POLL_INTERVAL_MS = 3000;

type PairingView = { status: 'idle' } | { status: 'pairing'; qrCodeImage: string | null } | { status: 'connected' } | { status: 'error'; message: string };

export default function WhatsappPairing({ initiallyConnected }: { initiallyConnected: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<PairingView>(initiallyConnected ? { status: 'connected' } : { status: 'idle' });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef(false);

  useEffect(() => {
    return () => {
      pollingRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function schedulePoll() {
    timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }

  async function poll() {
    if (!pollingRef.current) return;
    try {
      const response = await fetch('/api/restaurant/whatsapp/pairing');
      const body = await response.json();

      if (!response.ok) {
        setView({ status: 'error', message: body?.error ?? 'Não foi possível consultar o pareamento.' });
        pollingRef.current = false;
        return;
      }

      if (body.status === 'connected') {
        pollingRef.current = false;
        setView({ status: 'connected' });
        router.refresh();
        return;
      }

      if (body.status === 'failed') {
        setView({ status: 'error', message: 'A conexão falhou. Clique em "Gerar QR Code" pra tentar de novo.' });
        pollingRef.current = false;
        return;
      }

      setView({ status: 'pairing', qrCodeImage: body.qrCodeImage ?? null });
      schedulePoll();
    } catch {
      setView({ status: 'error', message: 'Não foi possível consultar o pareamento. Verifique sua conexão.' });
      pollingRef.current = false;
    }
  }

  async function handleStart() {
    setView({ status: 'pairing', qrCodeImage: null });
    pollingRef.current = true;
    try {
      const response = await fetch('/api/restaurant/whatsapp/pairing', { method: 'POST' });
      const body = await response.json();

      if (!response.ok) {
        setView({ status: 'error', message: body?.error ?? 'Não foi possível iniciar o pareamento.' });
        pollingRef.current = false;
        return;
      }

      if (body.status === 'connected') {
        pollingRef.current = false;
        setView({ status: 'connected' });
        router.refresh();
        return;
      }

      setView({ status: 'pairing', qrCodeImage: body.qrCodeImage ?? null });
      schedulePoll();
    } catch {
      setView({ status: 'error', message: 'Não foi possível iniciar o pareamento. Verifique sua conexão.' });
      pollingRef.current = false;
    }
  }

  if (view.status === 'connected') {
    return (
      <div className="order-item">
        <p>
          <strong>WhatsApp conectado.</strong> O bot já está respondendo pelo número pareado.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={handleStart} style={{ marginTop: 'var(--space-3)' }}>
          Parear outro número
        </Button>
      </div>
    );
  }

  return (
    <div className="order-item">
      {view.status === 'idle' && (
        <Button type="button" variant="primary" onClick={handleStart}>
          Gerar QR Code
        </Button>
      )}

      {view.status === 'pairing' && (
        <div style={{ textAlign: 'center' }}>
          {view.qrCodeImage ? (
            <img src={view.qrCodeImage} alt="QR Code pra conectar o WhatsApp" className="whatsapp-qr-image" />
          ) : (
            <p className="whatsapp-qr-loading">
              <Loader2 size={18} aria-hidden="true" className="pix-waiting-spinner" /> Gerando QR Code...
            </p>
          )}
          <p className="hint-text">
            No WhatsApp da loja: Configurações → Dispositivos conectados → Conectar um dispositivo, e escaneie. O
            código se renova sozinho se expirar — esta tela atualiza sozinha.
          </p>
        </div>
      )}

      {view.status === 'error' && (
        <>
          <p className="ui-field-error" style={{ marginBottom: 'var(--space-3)' }}>
            {view.message}
          </p>
          <Button type="button" variant="secondary" onClick={handleStart}>
            Tentar de novo
          </Button>
        </>
      )}
    </div>
  );
}
