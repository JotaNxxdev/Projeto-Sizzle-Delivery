'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createAuthBrowserClient();

    // O link do e-mail já deixa uma sessão de recuperação válida assim que
    // o navegador carrega esta página (o cliente detecta o token na URL).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createAuthBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[Sizzle] Erro ao redefinir senha:', err);
      setError('Não foi possível redefinir sua senha. O link pode ter expirado — solicite um novo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Redefinir senha</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">Verificando link...</p>
        </main>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Redefinir senha</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">
            Esse link é inválido ou expirou. <Link href="/forgot-password">Solicite um novo</Link>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Redefinir senha</h1>
      </header>
      <main className="app-main-menu">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {error && <p className="empty-state">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </main>
    </div>
  );
}
