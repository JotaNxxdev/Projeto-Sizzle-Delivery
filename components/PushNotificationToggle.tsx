'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const { showToast } = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      setSupported(true);
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    }
    check().catch((err) => console.error('[Sizzle] Erro ao checar notificações:', err));
  }, []);

  async function handleSubscribe() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      showToast('Notificações ainda não configuradas nesse ambiente.', 'error');
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permissão de notificação negada no navegador.', 'error');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!response.ok) throw new Error('Não foi possível ativar as notificações.');

      setSubscribed(true);
      showToast('Notificações ativadas!', 'success');
    } catch (err) {
      console.error('[Sizzle] Erro ao ativar notificações:', err);
      showToast('Não foi possível ativar as notificações.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
      showToast('Notificações desativadas.', 'success');
    } catch (err) {
      console.error('[Sizzle] Erro ao desativar notificações:', err);
      showToast('Não foi possível desativar as notificações.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      className="quantity-btn admin-btn"
      style={{ marginTop: 10 }}
      onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      disabled={loading}
    >
      <i className={`fas ${subscribed ? 'fa-bell-slash' : 'fa-bell'}`} aria-hidden="true" />{' '}
      {loading ? 'Aguarde...' : subscribed ? 'Desativar notificações' : 'Ativar notificações'}
    </button>
  );
}
