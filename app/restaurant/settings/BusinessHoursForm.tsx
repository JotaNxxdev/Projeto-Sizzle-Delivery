import { updateBusinessHours } from '../actions';
import { DAY_LABELS_FULL } from '@/lib/business-hours';
import type { BusinessHours } from '@/lib/types';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

const DEFAULT_DAY = { enabled: false, open: '18:00', close: '23:00' };

export default function BusinessHoursForm({
  restaurantId,
  businessHours,
}: {
  restaurantId: string;
  businessHours: BusinessHours | null;
}) {
  const days = DAY_LABELS_FULL.map((_, index) => businessHours?.[index] ?? DEFAULT_DAY);

  return (
    <div className="checkout-form" style={{ marginBottom: 'var(--space-5)' }}>
      <h3 style={{ marginTop: 0 }}>Horário de funcionamento</h3>
      <p className="hint-text">
        Marque os dias em que a loja abre e o horário — fora desse intervalo a loja fecha sozinha pra novos pedidos.
        Deixe todos os dias desmarcados se preferir controlar manualmente pelo botão de pausar loja.
      </p>
      <form action={updateBusinessHours}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        {DAY_LABELS_FULL.map((label, index) => (
          <div key={label} className="business-hours-row">
            <Checkbox className="business-hours-day" name={`enabled-${index}`} defaultChecked={days[index].enabled} label={label} />
            <input type="time" name={`open-${index}`} defaultValue={days[index].open} aria-label={`${label} - abre`} />
            <span>às</span>
            <input type="time" name={`close-${index}`} defaultValue={days[index].close} aria-label={`${label} - fecha`} />
          </div>
        ))}
        <Button type="submit" variant="primary" fullWidth>
          Salvar horário
        </Button>
      </form>
    </div>
  );
}
