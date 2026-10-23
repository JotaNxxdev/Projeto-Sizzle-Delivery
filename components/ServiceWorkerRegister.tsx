'use client';

import { useEffect } from 'react';

// Registra o service worker — habilita o app ser instalável (PWA) e
// recebe notificação push mesmo com o app fechado.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[Sizzle] Erro ao registrar service worker:', err));
    }
  }, []);

  return null;
}
