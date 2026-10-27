'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
      <div className="auth-screen">
        <div className="auth-banner">
          <img src="/LOGOR.png" alt="Sizzle" />
        </div>
        <div className="auth-body">
          <div className="auth-card">
            <h1 className="auth-title">Quase lá!</h1>
            <p className="auth-message">
              Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para poder entrar.
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
          <h1 className="auth-title">Criar conta</h1>
          <p className="auth-subtitle">Peça nos melhores restaurantes perto de você</p>
          <form onSubmit={handleSubmit}>
            <Input label="Nome" id="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="E-mail" id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input
              label="Senha"
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="ui-field-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Criar conta
            </Button>
          </form>
          <p className="auth-footer">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
