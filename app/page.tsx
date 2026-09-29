import { getRestaurants } from '@/lib/restaurants';
import HomeClient from './HomeClient';

// Cacheia por 60s em vez de refazer tudo (imagens inclusive) em toda
// visita — ações do dono/admin que mudam algo relevante (cardápio, loja,
// arquivar restaurante etc.) já chamam revalidatePath('/') e invalidam
// esse cache na hora, então a home nunca fica desatualizada por muito tempo.
export const revalidate = 60;

export default async function HomePage() {
  const restaurants = await getRestaurants();
  return <HomeClient restaurants={restaurants} />;
}
