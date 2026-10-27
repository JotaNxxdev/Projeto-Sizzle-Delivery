import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getRestaurants } from '@/lib/restaurants';
import { getFavoriteRestaurantIds } from '@/lib/favorites';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import FavoriteButton from '@/components/FavoriteButton';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/favorites');

  const [restaurants, favoriteIds] = await Promise.all([getRestaurants(), getFavoriteRestaurantIds(profile.id)]);
  const favoriteRestaurants = restaurants.filter((restaurant) => favoriteIds.has(restaurant.id));

  return (
    <div className="screen">
      <header className="app-header-menu">
        <BackButton />
        <h1>Meus Favoritos</h1>
      </header>
      <main className="app-main-menu">
        <div className="restaurant-grid">
          {favoriteRestaurants.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nenhum favorito ainda"
              description="Toque no coração de um restaurante pra salvar aqui."
            />
          ) : (
            favoriteRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="restaurant-card"
                style={!restaurant.isOpenNow ? { opacity: 0.6 } : undefined}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={restaurant.image} alt={restaurant.name} />
                  <FavoriteButton restaurantId={restaurant.id} />
                </div>
                <div className="card-info">
                  <h3>
                    {restaurant.name}
                    {!restaurant.isOpenNow && (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: 'var(--text-xs)' }}> (Fechado)</span>
                    )}
                  </h3>
                  <p className="details">
                    <Star className="rating-icon" size={14} fill="#f5b400" aria-hidden="true" /> {restaurant.rating} •{' '}
                    {restaurant.deliveryTime} •{' '}
                    {restaurant.deliveryFee > 0 ? formatCurrency(restaurant.deliveryFee) : 'Entrega grátis'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
