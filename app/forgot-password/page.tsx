'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createAuthBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      console.error('[Sizzle] Erro ao solicitar redefinição de senha:', err);
      setError('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Esqueci minha senha</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link pra redefinir a senha. Confira sua caixa
            de entrada (e o spam).
          </p>
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/login">Voltar para o login</Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Esqueci minha senha</h1>
      </header>
      <main className="app-main-menu">
        <p style={{ color: '#666', marginTop: 0 }}>
          Informe seu e-mail e enviaremos um link pra você criar uma nova senha.
        </p>
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
          {error && <p className="empty-state">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </main>
    </div>
  );
}
