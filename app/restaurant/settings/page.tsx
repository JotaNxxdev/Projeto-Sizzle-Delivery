import { getCurrentProfile } from '@/lib/auth';
import { getRestaurantSettings } from '@/lib/restaurant-data';
import RestaurantSettingsForm from './RestaurantSettingsForm';
import MercadoPagoConnection from './MercadoPagoConnection';
import StoreStatus from './StoreStatus';
import BusinessHoursForm from './BusinessHoursForm';
import ErrorState from '@/components/ui/ErrorState';

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
    return <ErrorState description="Não foi possível carregar os dados da loja." />;
  }

  return (
    <div>
      {error && <ErrorState description={error} />}
      {connected && (
        <p className="mp-connected-notice" style={{ marginBottom: 'var(--space-4)' }}>
          Conta do Mercado Pago conectada com sucesso!
        </p>
      )}
      <StoreStatus restaurantId={settings.id} isOpen={settings.isOpen} isOpenNow={settings.isOpenNow} />
      <BusinessHoursForm restaurantId={settings.id} businessHours={settings.businessHours} />
      <MercadoPagoConnection
        restaurantId={settings.id}
        connected={settings.mercadoPagoConnected}
        onlinePaymentEnabled={settings.onlinePaymentEnabled}
      />
      <RestaurantSettingsForm settings={settings} />
    </div>
  );
}
