'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createAuthBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        // Projeto configurado para exigir confirmação por e-mail.
        setNeedsEmailConfirmation(true);
      }
    } catch (err) {
      console.error('[Sizzle] Erro ao cadastrar:', err);
      const message = err instanceof Error ? err.message : 'Não foi possível criar sua conta.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Cadastro</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">
            Quase lá! Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para poder entrar.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Criar conta</h1>
      </header>
      <main className="app-main-menu">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input id="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} />
          </div>
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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="empty-state">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting}>
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </main>
    </div>
  );
}
