'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
      <div className="auth-screen">
        <div className="auth-banner">
          <img src="/LOGOR.png" alt="Sizzle" />
        </div>
        <div className="auth-body">
          <div className="auth-card">
            <h1 className="auth-title">Redefinir senha</h1>
            <p className="auth-message">Verificando link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="auth-screen">
        <div className="auth-banner">
          <img src="/LOGOR.png" alt="Sizzle" />
        </div>
        <div className="auth-body">
          <div className="auth-card">
            <h1 className="auth-title">Link inválido</h1>
            <p className="auth-message">
              Esse link é inválido ou expirou. <Link href="/forgot-password">Solicite um novo</Link>.
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
          <h1 className="auth-title">Redefinir senha</h1>
          <p className="auth-subtitle">Escolha uma nova senha para sua conta</p>
          <form onSubmit={handleSubmit}>
            <Input
              label="Nova senha"
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              label="Confirmar nova senha"
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {error && <p className="ui-field-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Salvar nova senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
