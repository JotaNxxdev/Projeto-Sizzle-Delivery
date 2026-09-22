import { getCurrentProfile } from '@/lib/auth';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const profile = await getCurrentProfile();
  return <CheckoutClient defaultContact={profile?.phone ?? ''} />;
}
