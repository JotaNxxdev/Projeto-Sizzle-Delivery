import { notFound } from 'next/navigation';
import { getRestaurantById } from '@/lib/restaurants';
import { formatBusinessHoursSummary } from '@/lib/business-hours';
import BackButton from '@/components/BackButton';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);

  if (!restaurant) {
    notFound();
  }

  const hoursSummary = formatBusinessHoursSummary(restaurant.businessHours);

  return (
    <div className="screen">
      <header
        className="app-header-menu"
        style={restaurant.brandColor ? { borderBottom: `4px solid ${restaurant.brandColor}` } : undefined}
      >
        <BackButton />
        <h1>{restaurant.name}</h1>
      </header>
      <main className="app-main-menu">
        {restaurant.description && (
          <p style={{ color: '#666', marginTop: 0, marginBottom: 10 }}>{restaurant.description}</p>
        )}
        {hoursSummary.length > 0 && (
          <p style={{ color: '#666', marginTop: 0, marginBottom: 20, fontSize: '0.9rem' }}>
            <i className="fas fa-clock" aria-hidden="true" /> {hoursSummary.join(' • ')}
          </p>
        )}
        {!restaurant.isOpenNow && (
          <p className="empty-state" style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12 }}>
            Este restaurante está fechado no momento — volte mais tarde.
          </p>
        )}
        <MenuClient restaurant={restaurant} />
      </main>
    </div>
  );
}
