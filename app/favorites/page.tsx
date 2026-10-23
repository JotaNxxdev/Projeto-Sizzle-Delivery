import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth';
import { getRestaurants } from '@/lib/restaurants';
import { getFavoriteRestaurantIds } from '@/lib/favorites';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import FavoriteButton from '@/components/FavoriteButton';

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
            <p className="empty-state">
              Você ainda não favoritou nenhum restaurante — toque no coração num restaurante pra salvar aqui.
            </p>
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
                      <span style={{ color: '#F26666', fontWeight: 600, fontSize: '0.8rem' }}> (Fechado)</span>
                    )}
                  </h3>
                  <p className="details">
                    <i className="fas fa-star rating-icon" aria-hidden="true" /> {restaurant.rating} •{' '}
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
