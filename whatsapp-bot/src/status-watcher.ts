import { db } from './db';
import { formatStatusNotification } from './conversation/flow';
import { toWhatsappJid } from './wa-phone';
import type { MessagingAdapter } from './messaging/adapter';

interface OrderStatusRow {
  id: string;
  order_code: string;
  contact_number: string;
  status: string;
  whatsapp_notified_status: string | null;
}

// Envia (ou só marca, se for o status inicial) e grava
// whatsapp_notified_status = status atual — é essa coluna que garante "sem
// perda nem duplicidade": só reenvia se status atual != último já avisado.
async function notifyAndMark(adapter: MessagingAdapter, order: OrderStatusRow): Promise<void> {
  if (order.status === order.whatsapp_notified_status) return;

  // "Pendente" é o status com que todo pedido nasce — o cliente já recebeu
  // a confirmação com o número do pedido na hora da criação, não precisa de
  // um aviso extra de status igual a esse.
  if (order.status !== 'Pendente') {
    const text = formatStatusNotification(order.order_code, order.status);
    try {
      await adapter.sendText(toWhatsappJid(order.contact_number), text);
    } catch (err) {
      console.error(`[Bot] Erro ao notificar status do pedido ${order.order_code}:`, err);
      return; // não marca como notificado — tenta de novo na próxima varredura/catch-up
    }
  }

  const { error } = await db.from('orders').update({ whatsapp_notified_status: order.status }).eq('id', order.id);
  if (error) {
    console.error(`[Bot] Erro ao marcar status notificado do pedido ${order.order_code}:`, error.message);
  }
}

// Roda ao iniciar/reconectar: varre pedidos cujo status ainda não foi
// avisado (perdidos enquanto o bot estava fora do ar) e avisa agora. Olha
// só as últimas 48h pra não reprocessar um histórico antigo se algo ficar
// sem marcação por muito tempo. Sempre escopado por restaurantId.
export async function catchUpPendingStatusNotifications(restaurantId: string, adapter: MessagingAdapter): Promise<void> {
  if (!restaurantId) throw new Error('restaurantId é obrigatório.');

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from('orders')
    .select('id, order_code, contact_number, status, whatsapp_notified_status')
    .eq('restaurant_id', restaurantId)
    .eq('origin', 'whatsapp')
    .gte('created_at', since);

  if (error) {
    console.error(`[Bot ${restaurantId}] Erro ao buscar avisos de status pendentes:`, error.message);
    return;
  }

  for (const order of (data ?? []) as OrderStatusRow[]) {
    if (order.status !== order.whatsapp_notified_status) {
      await notifyAndMark(adapter, order);
    }
  }
}

// Escuta em tempo real (Supabase Realtime) as mudanças de status desse
// restaurante. Um canal por restaurante — nunca um canal "global" sem
// filtro de restaurantId.
export function watchOrderStatus(restaurantId: string, adapter: MessagingAdapter): void {
  if (!restaurantId) throw new Error('restaurantId é obrigatório.');

  db.channel(`orders-status-${restaurantId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
      (payload) => {
        const order = payload.new as OrderStatusRow & { origin: string };
        if (order.origin !== 'whatsapp') return;
        notifyAndMark(adapter, order).catch((err) =>
          console.error(`[Bot ${restaurantId}] Erro ao processar mudança de status em tempo real:`, err)
        );
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Bot ${restaurantId}] Escutando mudanças de status em tempo real.`);
      }
    });
}
