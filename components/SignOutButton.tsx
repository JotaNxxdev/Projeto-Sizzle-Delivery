'use client';

import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={handleSignOut}>
      Sair
    </button>
  );
}
