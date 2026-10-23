'use client';

import { useFavorites } from '@/contexts/FavoritesContext';

export default function FavoriteButton({
  restaurantId,
  variant = 'overlay',
}: {
  restaurantId: string;
  // "overlay": posicionado sobre uma imagem (position: absolute, ver CSS).
  // "inline": botão normal no fluxo da página (ex: cabeçalho sem imagem).
  variant?: 'overlay' | 'inline';
}) {
  const { isFavorite, toggleFavorite } = useFavorites();

  // Restaurante de seed (fallback sem Supabase) não existe na tabela de
  // verdade — não dá pra favoritar.
  if (restaurantId.startsWith('seed-')) return null;

  const favorited = isFavorite(restaurantId);

  return (
    <button
      type="button"
      className={variant === 'overlay' ? 'favorite-button' : 'favorite-button favorite-button-inline'}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={favorited}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(restaurantId);
      }}
    >
      <i className={`${favorited ? 'fas' : 'far'} fa-heart`} aria-hidden="true" />
    </button>
  );
}
