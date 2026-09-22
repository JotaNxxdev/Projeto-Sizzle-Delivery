import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/profile');

  return <ProfileClient profile={profile} />;
}
