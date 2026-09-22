'use client';

import { createBrowserClient } from '@supabase/ssr';

// Cliente de autenticação para uso em Client Components (formulários de
// login/cadastro/logout). Usa o Publishable key — seguro para o navegador,
// diferente da service_role key usada em lib/supabase.ts.
export function createAuthBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Login não configurado: faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return createBrowserClient(url, publishableKey);
}
