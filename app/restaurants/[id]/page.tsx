import { notFound } from 'next/navigation';
import { getRestaurantById } from '@/lib/restaurants';
import BackButton from '@/components/BackButton';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);

  if (!restaurant) {
    notFound();
  }

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
          <p style={{ color: '#666', marginTop: 0, marginBottom: 20 }}>{restaurant.description}</p>
        )}
        <MenuClient restaurant={restaurant} />
      </main>
    </div>
  );
}
