import { MessageCircleOff } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';
import { getPausedWhatsappSessions, isWhatsappBotEnabledForRestaurant } from '@/lib/restaurant-data';
import { isWhatsappBotConfigured } from '@/lib/whatsapp-bot-client';
import { reactivateWhatsappSession } from '../actions';
import WhatsappPairing from './WhatsappPairing';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

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
        <p className="hint-text">
          O bot de WhatsApp ainda não foi publicado nesta instância (variáveis WHATSAPP_BOT_URL /
          WHATSAPP_BOT_API_TOKEN não configuradas). Veja whatsapp-bot/README.md.
        </p>
      )}

      <h2 style={{ marginTop: 'var(--space-6)' }}>Atendimento pausado no WhatsApp</h2>
      <p className="hint-text" style={{ marginBottom: 'var(--space-4)' }}>
        Quando um cliente pede para falar com um atendente no bot do WhatsApp, o robô para de responder aquele
        número até você clicar em &quot;Reativar&quot; aqui — depois de resolver por fora (ligando, chamando no
        próprio WhatsApp da loja, etc.).
      </p>

      {sessions.length === 0 ? (
        <EmptyState icon={MessageCircleOff} title="Nenhuma conversa esperando atendimento agora" />
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
            <form action={reactivateWhatsappSession} style={{ marginTop: 'var(--space-3)' }}>
              <input type="hidden" name="restaurantId" value={profile.restaurantId ?? ''} />
              <input type="hidden" name="sessionId" value={session.id} />
              <Button type="submit" variant="secondary" size="sm">
                Reativar bot pra esse número
              </Button>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
