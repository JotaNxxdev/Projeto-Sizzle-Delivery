import { getCurrentProfile } from '@/lib/auth';
import { getReviewsForRestaurant } from '@/lib/reviews';
import { replyToReview } from '../actions';
import StarRating from '@/components/StarRating';

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
      {error && <p className="empty-state">{error}</p>}

      <h2>Avaliações ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="empty-state">Nenhuma avaliação recebida ainda.</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="order-item" style={{ marginBottom: 15 }}>
            <div className="order-header">
              <StarRating value={review.rating} readOnly size={18} />
              <span style={{ color: '#666', fontSize: '0.85rem' }}>{review.createdAt}</span>
            </div>
            <div className="order-details">
              <p>
                <strong>{review.reviewerName}</strong>
              </p>
              {review.comment && <p>{review.comment}</p>}
              {review.restaurantReply ? (
                <p style={{ color: '#666' }}>
                  <strong>Sua resposta:</strong> {review.restaurantReply}
                </p>
              ) : (
                <form action={replyToReview} style={{ marginTop: 10 }}>
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="reviewId" value={review.id} />
                  <div className="form-group">
                    <label htmlFor={`reply-${review.id}`}>Responder</label>
                    <textarea id={`reply-${review.id}`} name="reply" required style={{ minHeight: 50 }} />
                  </div>
                  <button type="submit" className="quantity-btn admin-btn">
                    Enviar resposta
                  </button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
