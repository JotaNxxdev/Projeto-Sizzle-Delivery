'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useToast } from './ToastContext';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurantId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    fetch('/api/favorites')
      .then((response) => (response.ok ? response.json() : { restaurantIds: [] }))
      .then((body) => {
        if (!cancelled) setFavoriteIds(new Set(body.restaurantIds ?? []));
      })
      .catch((err) => console.error('[Sizzle] Erro ao carregar favoritos:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleFavorite(restaurantId: string) {
    const wasFavorite = favoriteIds.has(restaurantId);

    // Atualiza a UI na hora (otimista) e desfaz se a chamada falhar.
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(restaurantId);
      else next.add(restaurantId);
      return next;
    });

    fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || 'Não foi possível favoritar.');
        }
      })
      .catch((err) => {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(restaurantId);
          else next.delete(restaurantId);
          return next;
        });
        const message = err instanceof Error ? err.message : 'Não foi possível favoritar.';
        showToast(message, 'error');
      });
  }

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorite: (id) => favoriteIds.has(id), toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites deve ser usado dentro de um FavoritesProvider');
  }
  return context;
}
