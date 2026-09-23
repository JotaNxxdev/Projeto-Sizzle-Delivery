import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CourierLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login?next=/courier');
  if (profile.role !== 'courier') redirect('/');

  if (!profile.restaurantId) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Painel do Entregador</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">
            Sua conta ainda não está vinculada a nenhuma loja. Peça para o dono do restaurante te vincular em
            Entregadores.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Painel do Entregador</h1>
      </header>
      <main className="app-main-menu">{children}</main>
    </div>
  );
}
