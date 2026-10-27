import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import AdminTabs from './AdminTabs';

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
      <AdminTabs />
      <main className="app-main-menu">{children}</main>
    </div>
  );
}
