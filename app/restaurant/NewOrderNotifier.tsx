'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY_PREFIX = 'sizzle_last_seen_order_';
const POLL_INTERVAL_MS = 20000;

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    playTone(880, 0, 0.18);
    playTone(1174.66, 0.18, 0.25);
  } catch {
    // navegador sem suporte a áudio — segue só com o aviso visual
  }
}

export default function NewOrderNotifier({ restaurantId }: { restaurantId: string }) {
  const [newCount, setNewCount] = useState(0);
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    const storageKey = STORAGE_KEY_PREFIX + restaurantId;
    lastSeenRef.current = localStorage.getItem(storageKey) ?? new Date().toISOString();

    let cancelled = false;

    async function poll() {
      const since = lastSeenRef.current;
      if (!since) return;

      try {
        const response = await fetch(`/api/restaurant/orders/new-count?since=${encodeURIComponent(since)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        if (data.count > 0) {
          setNewCount((current) => current + data.count);
          playNotificationSound();
          if (data.latestCreatedAt) {
            lastSeenRef.current = data.latestCreatedAt;
            localStorage.setItem(storageKey, data.latestCreatedAt);
          }
        }
      } catch {
        // falha de rede momentânea — tenta de novo no próximo ciclo
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [restaurantId]);

  if (newCount === 0) return null;

  return (
    <div className="new-order-banner">
      <span>
        🔔 {newCount} {newCount === 1 ? 'novo pedido' : 'novos pedidos'}!
      </span>
      <div className="new-order-banner-actions">
        <Link href="/restaurant" onClick={() => setNewCount(0)}>
          Ver pedidos
        </Link>
        <button type="button" onClick={() => setNewCount(0)} aria-label="Dispensar aviso">
          ✕
        </button>
      </div>
    </div>
  );
}
