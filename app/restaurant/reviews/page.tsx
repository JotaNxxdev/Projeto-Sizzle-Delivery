import { Star } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getReviewsForRestaurant } from '@/lib/reviews';
import { replyToReview } from '../actions';
import StarRating from '@/components/StarRating';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export const dynamic = 'force-dynamic';

export default async function RestaurantReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null; // o layout já trata esse caso
  const restaurantId = profile.restaurantId;

  const reviews = await getReviewsForRestaurant(restaurantId);

  return (
    <div>
      {error && <ErrorState description={error} />}

      <h2>Avaliações ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="Nenhuma avaliação recebida ainda" />
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="order-item">
            <div className="order-header">
              <StarRating value={review.rating} readOnly size={18} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{review.createdAt}</span>
            </div>
            <div className="order-details">
              <p>
                <strong>{review.reviewerName}</strong>
              </p>
              {review.comment && <p>{review.comment}</p>}
              {review.restaurantReply ? (
                <p>
                  <strong>Sua resposta:</strong> {review.restaurantReply}
                </p>
              ) : (
                <form action={replyToReview} style={{ marginTop: 'var(--space-3)' }}>
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="reviewId" value={review.id} />
                  <Textarea label="Responder" id={`reply-${review.id}`} name="reply" required style={{ minHeight: 50 }} />
                  <Button type="submit" variant="secondary" size="sm">
                    Enviar resposta
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
