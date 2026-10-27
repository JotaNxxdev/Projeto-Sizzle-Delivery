import { getCurrentProfile } from '@/lib/auth';
import { getPausedWhatsappSessions, isWhatsappBotEnabledForRestaurant } from '@/lib/restaurant-data';
import { isWhatsappBotConfigured } from '@/lib/whatsapp-bot-client';
import { reactivateWhatsappSession } from '../actions';
import WhatsappPairing from './WhatsappPairing';

export const dynamic = 'force-dynamic';

export default async function WhatsappSessionsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.restaurantId) return null;

  const [sessions, connected] = await Promise.all([
    getPausedWhatsappSessions(profile.restaurantId),
    isWhatsappBotEnabledForRestaurant(profile.restaurantId),
  ]);

  return (
    <div>
      <h2>Configurar WhatsApp</h2>
      {isWhatsappBotConfigured ? (
        <WhatsappPairing initiallyConnected={connected} />
      ) : (
        <p className="empty-state" style={{ textAlign: 'left' }}>
          O bot de WhatsApp ainda não foi publicado nesta instância (variáveis WHATSAPP_BOT_URL /
          WHATSAPP_BOT_API_TOKEN não configuradas). Veja whatsapp-bot/README.md.
        </p>
      )}

      <h2 style={{ marginTop: 24 }}>Atendimento pausado no WhatsApp</h2>
      <p className="empty-state" style={{ textAlign: 'left', marginBottom: 16 }}>
        Quando um cliente pede para falar com um atendente no bot do WhatsApp, o robô para de responder aquele
        número até você clicar em &quot;Reativar&quot; aqui — depois de resolver por fora (ligando, chamando no
        próprio WhatsApp da loja, etc.).
      </p>

      {sessions.length === 0 ? (
        <p className="empty-state">Nenhuma conversa esperando atendimento agora.</p>
      ) : (
        sessions.map((session) => (
          <div className="order-item" key={session.id}>
            <div className="order-details">
              <p>
                <strong>Telefone:</strong> {session.phone}
              </p>
              <p>
                <strong>Pausado em:</strong> {session.pausedAt ?? '—'}
              </p>
              <p>
                <strong>Última interação:</strong> {session.lastInteractionAt}
              </p>
            </div>
            <form action={reactivateWhatsappSession} style={{ marginTop: 10 }}>
              <input type="hidden" name="restaurantId" value={profile.restaurantId ?? ''} />
              <input type="hidden" name="sessionId" value={session.id} />
              <button type="submit" className="quantity-btn admin-btn">
                Reativar bot pra esse número
              </button>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
