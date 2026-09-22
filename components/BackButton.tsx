'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ label = 'Voltar' }: { label?: string }) {
  const router = useRouter();

  function goBack() {
    router.back();
  }

  return (
    <i
      className="fas fa-arrow-left back-button"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={goBack}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goBack();
        }
      }}
    />
  );
}
