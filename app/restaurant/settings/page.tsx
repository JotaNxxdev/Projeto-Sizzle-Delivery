import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantSettings } from '@/lib/restaurant-data';
import RestaurantSettingsForm from './RestaurantSettingsForm';
import MercadoPagoConnection from './MercadoPagoConnection';
import StoreStatus from './StoreStatus';

export const dynamic = 'force-dynamic';

export default async function RestaurantSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const { error, connected } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso

  const settings = await getRestaurantSettings(profile.restaurantId);
  if (!settings) {
    return <p className="empty-state">Não foi possível carregar os dados da loja.</p>;
  }

  return (
    <div>
      {error && <p className="empty-state">{error}</p>}
      {connected && <p className="empty-state">Conta do Mercado Pago conectada com sucesso!</p>}
      <StoreStatus restaurantId={settings.id} isOpen={settings.isOpen} />
      <MercadoPagoConnection
        restaurantId={settings.id}
        connected={settings.mercadoPagoConnected}
        onlinePaymentEnabled={settings.onlinePaymentEnabled}
      />
      <RestaurantSettingsForm settings={settings} />
    </div>
  );
}
