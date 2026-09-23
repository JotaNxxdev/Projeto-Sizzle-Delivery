import { notFound } from 'next/navigation';
import { getRestaurantById } from '@/lib/restaurants';
import { getReviewsForRestaurant } from '@/lib/reviews';
import { formatBusinessHoursSummary } from '@/lib/business-hours';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import StarRating from '@/components/StarRating';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);

  if (!restaurant) {
    notFound();
  }

  const hoursSummary = formatBusinessHoursSummary(restaurant.businessHours);
  const reviews = await getReviewsForRestaurant(id);

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
          <p style={{ color: '#666', marginTop: 0, marginBottom: 10, fontSize: '0.9rem' }}>
            <i className="fas fa-clock" aria-hidden="true" /> {hoursSummary.join(' • ')}
          </p>
        )}
        {restaurant.minOrderValue > 0 && (
          <p style={{ color: '#666', marginTop: 0, marginBottom: 20, fontSize: '0.9rem' }}>
            <i className="fas fa-tag" aria-hidden="true" /> Pedido mínimo: {formatCurrency(restaurant.minOrderValue)}
          </p>
        )}
        {!restaurant.isOpenNow && (
          <p className="empty-state" style={{ backgroundColor: '#fdecea', borderRadius: 10, padding: 12 }}>
            Este restaurante está fechado no momento — volte mais tarde.
          </p>
        )}
        <MenuClient restaurant={restaurant} />

        {reviews.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>
              Avaliações {restaurant.reviewCount > 0 && `(${restaurant.rating.toFixed(1)} ⭐ · ${restaurant.reviewCount})`}
            </h3>
            {reviews.map((review) => (
              <div key={review.id} className="order-item" style={{ marginBottom: 15 }}>
                <div className="order-header">
                  <StarRating value={review.rating} readOnly size={16} />
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>{review.createdAt}</span>
                </div>
                <div className="order-details">
                  <p>
                    <strong>{review.reviewerName}</strong>
                  </p>
                  {review.comment && <p>{review.comment}</p>}
                  {review.restaurantReply && (
                    <p style={{ color: '#666' }}>
                      <strong>Resposta do restaurante:</strong> {review.restaurantReply}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
