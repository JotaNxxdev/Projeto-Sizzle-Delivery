'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton({ label = 'Voltar' }: { label?: string }) {
  const router = useRouter();

  function goBack() {
    router.back();
  }

  return (
    <ArrowLeft
      className="back-button"
      size={24}
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
