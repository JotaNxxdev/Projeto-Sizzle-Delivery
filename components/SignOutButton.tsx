'use client';

import { useRouter } from 'next/navigation';
import { createAuthBrowserClient } from '@/lib/supabase-auth-browser';
import Button from '@/components/ui/Button';

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" fullWidth className={className} onClick={handleSignOut}>
      Sair
    </Button>
  );
}
