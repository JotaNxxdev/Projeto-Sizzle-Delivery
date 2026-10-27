import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import NewOrderNotifier from './NewOrderNotifier';
import RestaurantTabs from './RestaurantTabs';

export const dynamic = 'force-dynamic';

export default async function RestaurantOwnerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login?next=/restaurant');
  if (profile.role !== 'restaurant_owner') redirect('/');

  if (!profile.restaurantId) {
    return (
      <div className="screen">
        <header className="app-header-menu">
          <h1>Painel do Restaurante</h1>
        </header>
        <main className="app-main-menu">
          <p className="empty-state">
            Sua conta ainda não está vinculada a nenhum restaurante. Peça para um administrador do sistema te
            atribuir um.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Painel do Restaurante</h1>
      </header>
      <RestaurantTabs />
      <NewOrderNotifier restaurantId={profile.restaurantId} />
      <main className="app-main-menu">{children}</main>
    </div>
  );
}
