'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
      <div className="auth-screen">
        <div className="auth-banner">
          <img src="/LOGOR.png" alt="Sizzle" />
        </div>
        <div className="auth-body">
          <div className="auth-card">
            <h1 className="auth-title">Verifique seu e-mail</h1>
            <p className="auth-message">
              Se <strong>{email}</strong> estiver cadastrado, enviamos um link pra redefinir a senha. Confira sua caixa de
              entrada (e o spam).
            </p>
            <p className="auth-footer">
              <Link href="/login">Voltar para o login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-banner">
        <img src="/LOGOR.png" alt="Sizzle" />
      </div>
      <div className="auth-body">
        <div className="auth-card">
          <h1 className="auth-title">Esqueci minha senha</h1>
          <p className="auth-subtitle">Informe seu e-mail e enviaremos um link pra você criar uma nova senha.</p>
          <form onSubmit={handleSubmit}>
            <Input label="E-mail" id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            {error && <p className="ui-field-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Enviar link de redefinição
            </Button>
          </form>
          <p className="auth-footer">
            <Link href="/login">Voltar para o login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
