import { db } from './db';

export interface BotRestaurant {
  id: string;
  name: string;
  manualPixKey: string | null;
}

// Lista só os restaurantes com o bot habilitado (restaurants.whatsapp_bot_enabled),
// usado pelo index.ts pra decidir quais sessões do Baileys subir. Quem liga
// essa flag é o operador do bot (ver README), depois de parear o QR Code —
// não é um botão self-service no painel do dono.
export async function getEnabledRestaurants(): Promise<BotRestaurant[]> {
  const { data, error } = await db
    .from('restaurants')
    .select('id, name, manual_pix_key')
    .eq('whatsapp_bot_enabled', true)
    .eq('is_archived', false);

  if (error) {
    throw new Error(`Erro ao buscar restaurantes com bot habilitado: ${error.message}`);
  }

  return (data ?? []).map((row) => ({ id: row.id, name: row.name, manualPixKey: row.manual_pix_key }));
}

// Toda consulta do bot que lê dados de UM restaurante exige o id dele como
// parâmetro obrigatório — nunca uma busca "solta" sem filtro, já que o bot
// usa a service_role key (ignora RLS) e um restaurante nunca pode enxergar
// dado de outro.
export async function getRestaurantForBot(restaurantId: string): Promise<BotRestaurant | null> {
  if (!restaurantId) throw new Error('restaurantId é obrigatório.');

  const { data, error } = await db
    .from('restaurants')
    .select('id, name, manual_pix_key')
    .eq('id', restaurantId)
    .eq('whatsapp_bot_enabled', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar restaurante ${restaurantId}: ${error.message}`);
  }
  if (!data) return null;

  return { id: data.id, name: data.name, manualPixKey: data.manual_pix_key };
}

// Usado só por scripts/connect.ts: na hora de parear um restaurante NOVO,
// whatsapp_bot_enabled ainda está false (só é ligado depois que o
// pareamento funciona — ver README), então não dá pra filtrar por ela aqui.
export async function getRestaurantByIdIgnoringBotFlag(restaurantId: string): Promise<BotRestaurant | null> {
  if (!restaurantId) throw new Error('restaurantId é obrigatório.');

  const { data, error } = await db.from('restaurants').select('id, name, manual_pix_key').eq('id', restaurantId).maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar restaurante ${restaurantId}: ${error.message}`);
  }
  if (!data) return null;

  return { id: data.id, name: data.name, manualPixKey: data.manual_pix_key };
}
