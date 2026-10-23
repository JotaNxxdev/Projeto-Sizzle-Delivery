import webpush from 'web-push';
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushConfigured) {
  webpush.setVapidDetails('mailto:contato@sizzledelivery.app', VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Manda push pra todos os dispositivos inscritos de um usuário — alguém
// pode ter o app aberto no celular e no notebook ao mesmo tempo.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isPushConfigured || !supabase) return;

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Inscrição expirada/revogada pelo navegador — limpa do banco.
          await supabase!.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('[Sizzle] Erro ao enviar push:', err);
        }
      }
    })
  );
}
