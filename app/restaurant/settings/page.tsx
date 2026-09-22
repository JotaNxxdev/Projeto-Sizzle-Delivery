import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantSettings } from '@/lib/restaurant-data';
import RestaurantSettingsForm from './RestaurantSettingsForm';

export const dynamic = 'force-dynamic';

export default async function RestaurantSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const settings = await getRestaurantSettings(profile.restaurantId);
  if (!settings) {
    return <p className="empty-state">Não foi possível carregar os dados da loja.</p>;
  }

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}
      <RestaurantSettingsForm settings={settings} />
    </div>
  );
}
