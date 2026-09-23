'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createAuthBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.push(next);
      router.refresh();
    } catch (err) {
      console.error('[Sizzle] Erro ao entrar:', err);
      setError('E-mail ou senha incorretos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Entrar</h1>
      </header>
      <main className="app-main-menu">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="empty-state">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/forgot-password">Esqueci minha senha</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 10 }}>
          Não tem conta? <Link href="/signup">Cadastre-se</Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
