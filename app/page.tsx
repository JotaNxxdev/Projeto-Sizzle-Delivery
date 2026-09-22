import { getRestaurants } from '@/lib/restaurants';
import HomeClient from './HomeClient';

// Sempre busca dados frescos do Supabase a cada request, em vez de
// congelar o cardápio na versão que existia no momento do build.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const restaurants = await getRestaurants();
  return <HomeClient restaurants={restaurants} />;
}
