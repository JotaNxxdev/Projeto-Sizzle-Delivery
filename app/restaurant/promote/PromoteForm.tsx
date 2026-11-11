'use client';

import { useState } from 'react';
import { CreditCard, Copy } from 'lucide-react';
import { purchasePromotion, requestPromotionPix } from '../actions';
import { PROMOTION_PLANS } from '@/lib/promotions';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';

export default function PromoteForm({ restaurantId, platformPixKey }: { restaurantId: string; platformPixKey: string | null }) {
  const { showToast } = useToast();
  const [imagePreview, setImagePreview] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [days, setDays] = useState<number>(PROMOTION_PLANS[0].days);
  const [method, setMethod] = useState<'pix' | 'card'>(platformPixKey ? 'pix' : 'card');

  async function handleFileSelect(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Falha no upload.');
      setNewImageUrl(body.url);
      setImagePreview(body.url);
    } catch (err) {
      console.error('[Sizzle] Erro ao enviar imagem do destaque:', err);
      showToast('Não foi possível enviar a imagem.', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function copyPixKey() {
    if (!platformPixKey) return;
    try {
      await navigator.clipboard.writeText(platformPixKey);
      showToast('Chave Pix copiada.', 'success');
    } catch {
      showToast('Não foi possível copiar. Copie manualmente.', 'error');
    }
  }

  const selectedPlan = PROMOTION_PLANS.find((p) => p.days === days) ?? PROMOTION_PLANS[0];

  return (
    <form action={method === 'pix' ? requestPromotionPix : purchasePromotion} className="checkout-form">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="days" value={days} />
      {newImageUrl && <input type="hidden" name="imageUrl" value={newImageUrl} />}

      <FileUpload
        label="Imagem do banner (opcional)"
        hint="Arraste uma imagem ou clique pra escolher"
        previewUrl={imagePreview || null}
        loading={uploading}
        onFileSelect={handleFileSelect}
      />

      <Input label="Texto do banner" id="title" name="title" placeholder="Ex: 2 Hambúrgueres por R$ 35,00!" required />

      <div className="form-group">
        <label>Duração</label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {PROMOTION_PLANS.map((plan) => (
            <button
              key={plan.days}
              type="button"
              onClick={() => setDays(plan.days)}
              className={`ui-button ui-button-sm ${days === plan.days ? 'ui-button-primary' : 'ui-button-secondary'}`}
            >
              {plan.days} dias — R$ {plan.price}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Forma de pagamento</label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {platformPixKey && (
            <button
              type="button"
              onClick={() => setMethod('pix')}
              className={`ui-button ui-button-sm ${method === 'pix' ? 'ui-button-primary' : 'ui-button-secondary'}`}
            >
              Pix manual
            </button>
          )}
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`ui-button ui-button-sm ${method === 'card' ? 'ui-button-primary' : 'ui-button-secondary'}`}
          >
            Cartão de crédito
          </button>
        </div>
      </div>

      {method === 'pix' && platformPixKey ? (
        <div className="order-item" style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ margin: '0 0 var(--space-2)' }}>
            Pague <strong>R$ {selectedPlan.price}</strong> via Pix pra esta chave e clique em &quot;Enviar pedido&quot; abaixo.
            Nosso time confirma o pagamento e ativa o destaque em até 1 dia útil.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <code style={{ background: 'var(--color-gray-200)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', flex: 1 }}>
              {platformPixKey}
            </code>
            <Button type="button" variant="secondary" size="sm" icon={<Copy size={14} aria-hidden="true" />} onClick={copyPixKey}>
              Copiar
            </Button>
          </div>
        </div>
      ) : (
        <p className="hint-text">
          Plano escolhido: {selectedPlan.days} dias por R$ {selectedPlan.price}. O pagamento acontece numa página segura
          do Mercado Pago, feita só pra cartão de crédito.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        icon={method === 'pix' ? undefined : <CreditCard size={16} aria-hidden="true" />}
        disabled={uploading}
      >
        {method === 'pix' ? 'Enviar pedido' : 'Pagar com cartão'}
      </Button>
    </form>
  );
}
