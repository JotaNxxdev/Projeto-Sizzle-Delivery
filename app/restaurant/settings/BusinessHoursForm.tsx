import { updateBusinessHours } from '../actions';
import { DAY_LABELS_FULL } from '@/lib/business-hours';
import type { BusinessHours } from '@/lib/types';

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
    <div className="checkout-form" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Horário de funcionamento</h3>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0 }}>
        Marque os dias em que a loja abre e o horário — fora desse intervalo a loja fecha sozinha pra novos pedidos.
        Deixe todos os dias desmarcados se preferir controlar manualmente pelo botão de pausar loja.
      </p>
      <form action={updateBusinessHours}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        {DAY_LABELS_FULL.map((label, index) => (
          <div key={label} className="business-hours-row">
            <label className="business-hours-day">
              <input type="checkbox" name={`enabled-${index}`} defaultChecked={days[index].enabled} />
              {label}
            </label>
            <input type="time" name={`open-${index}`} defaultValue={days[index].open} aria-label={`${label} - abre`} />
            <span>às</span>
            <input
              type="time"
              name={`close-${index}`}
              defaultValue={days[index].close}
              aria-label={`${label} - fecha`}
            />
          </div>
        ))}
        <button type="submit" className="checkout-button">
          Salvar horário
        </button>
      </form>
    </div>
  );
}
