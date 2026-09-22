import { getCurrentProfile } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  return <ProfileClient profile={profile} />;
}
