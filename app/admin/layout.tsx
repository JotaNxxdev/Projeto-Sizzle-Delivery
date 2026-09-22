import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login?next=/admin');
  if (profile.role !== 'admin') redirect('/');

  return (
    <div className="screen">
      <header className="app-header-menu">
        <h1>Painel do Administrador</h1>
      </header>
      <nav className="admin-tabs">
        <Link href="/admin/restaurants">Restaurantes</Link>
        <Link href="/admin/orders">Pedidos</Link>
        <Link href="/admin/users">Usuários</Link>
      </nav>
      <main className="app-main-menu">{children}</main>
    </div>
  );
}
