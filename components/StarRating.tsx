'use client';

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
        <i
          key={star}
          className={`fa-star ${star <= value ? 'fas' : 'far'}`}
          aria-hidden="true"
          onClick={readOnly ? undefined : () => onChange?.(star)}
          style={{
            color: star <= value ? '#FFD700' : '#ccc',
            fontSize: size,
            cursor: readOnly ? 'default' : 'pointer',
          }}
        />
      ))}
    </div>
  );
}
