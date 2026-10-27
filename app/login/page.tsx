'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
    <div className="auth-screen">
      <div className="auth-banner">
        <img src="/LOGOR.png" alt="Sizzle" />
      </div>
      <div className="auth-body">
        <div className="auth-card">
          <h1 className="auth-title">Entrar</h1>
          <p className="auth-subtitle">Bem-vindo de volta ao Sizzle</p>
          <form onSubmit={handleSubmit}>
            <Input label="E-mail" id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input
              label="Senha"
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="ui-field-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Entrar
            </Button>
          </form>
          <p className="auth-footer">
            <Link href="/forgot-password">Esqueci minha senha</Link>
          </p>
          <p className="auth-footer">
            Não tem conta? <Link href="/signup">Cadastre-se</Link>
          </p>
        </div>
      </div>
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
