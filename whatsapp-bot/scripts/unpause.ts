// CLI de emergência pra reativar o bot pra um número específico, sem
// precisar passar pelo painel do dono (ex.: operador do bot no VPS
// resolvendo um caso). O jeito normal é o dono clicar em "Reativar" em
// /restaurant/whatsapp no site (ver app/restaurant/actions.ts,
// reactivateWhatsappSession).
//
// Uso: npm run unpause -- <restaurantId> <telefone-sem-ddi>
import { db } from '../src/db';

async function main(): Promise<void> {
  const [restaurantId, phone] = process.argv.slice(2);
  if (!restaurantId || !phone) {
    console.error('Uso: npm run unpause -- <restaurantId> <telefone-sem-ddi>');
    process.exit(1);
  }

  const { data, error } = await db
    .from('whatsapp_customer_sessions')
    .update({ paused_for_agent: false, paused_at: null })
    .eq('restaurant_id', restaurantId)
    .eq('phone', phone)
    .select('id');

  if (error) {
    console.error('Erro ao reativar:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(`Nenhuma sessão pausada encontrada para ${phone} no restaurante ${restaurantId}.`);
    return;
  }

  console.log(`Reativado! O bot volta a responder esse número normalmente.`);
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
