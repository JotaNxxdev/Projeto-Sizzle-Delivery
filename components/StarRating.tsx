'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function StarRating({ value, onChange, readOnly = false, size = 20 }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div role={readOnly ? undefined : 'radiogroup'} aria-label="Avaliação em estrelas" style={{ display: 'inline-flex', gap: 4 }}>
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= value ? '#f5b400' : 'none'}
          color={star <= value ? '#f5b400' : 'var(--color-gray-300)'}
          aria-hidden="true"
          onClick={readOnly ? undefined : () => onChange?.(star)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        />
      ))}
    </div>
  );
}
