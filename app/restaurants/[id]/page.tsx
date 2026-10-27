import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Star, Clock, Tag } from 'lucide-react';
import { getRestaurantById } from '@/lib/restaurants';
import { getReviewsForRestaurant } from '@/lib/reviews';
import { formatBusinessHoursSummary } from '@/lib/business-hours';
import { formatCurrency } from '@/lib/format';
import BackButton from '@/components/BackButton';
import StarRating from '@/components/StarRating';
import FavoriteButton from '@/components/FavoriteButton';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);
  if (!restaurant) return { title: 'Restaurante não encontrado | Sizzle' };

  return {
    title: `${restaurant.name} | Sizzle Delivery`,
    description: restaurant.description || `Peça de ${restaurant.name} pelo Sizzle Delivery — ${restaurant.category}.`,
  };
}

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
        <FavoriteButton restaurantId={restaurant.id} variant="inline" />
      </header>
      <main className="app-main-menu">
        <p className="restaurant-meta-line">
          <Star size={14} fill="#f5b400" color="#f5b400" aria-hidden="true" /> {restaurant.rating.toFixed(1)}
          {restaurant.reviewCount > 0 && ` (${restaurant.reviewCount})`} • {restaurant.deliveryTime} •{' '}
          {restaurant.deliveryFee > 0 ? formatCurrency(restaurant.deliveryFee) : 'Entrega grátis'}
        </p>
        {restaurant.description && <p className="restaurant-meta-line restaurant-description">{restaurant.description}</p>}
        {hoursSummary.length > 0 && (
          <p className="restaurant-meta-line">
            <Clock size={14} aria-hidden="true" /> {hoursSummary.join(' • ')}
          </p>
        )}
        {restaurant.minOrderValue > 0 && (
          <p className="restaurant-meta-line" style={{ marginBottom: 'var(--space-5)' }}>
            <Tag size={14} aria-hidden="true" /> Pedido mínimo: {formatCurrency(restaurant.minOrderValue)}
          </p>
        )}
        {!restaurant.isOpenNow && <div className="closed-banner">Este restaurante está fechado no momento — volte mais tarde.</div>}
        <MenuClient restaurant={restaurant} />

        {reviews.length > 0 && (
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h3>
              Avaliações {restaurant.reviewCount > 0 && `(${restaurant.rating.toFixed(1)} · ${restaurant.reviewCount})`}
            </h3>
            {reviews.map((review) => (
              <div key={review.id} className="order-item">
                <div className="order-header">
                  <StarRating value={review.rating} readOnly size={16} />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{review.createdAt}</span>
                </div>
                <div className="order-details">
                  <p>
                    <strong>{review.reviewerName}</strong>
                  </p>
                  {review.comment && <p>{review.comment}</p>}
                  {review.restaurantReply && (
                    <p>
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
