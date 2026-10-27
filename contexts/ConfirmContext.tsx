'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

// Substitui window.confirm(...) em todo o app por um modal no mesmo visual
// do resto do site — mesma assinatura de uso (await confirm(...)), só muda
// de onde vem a resposta.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((input: ConfirmOptions | string) => {
    const normalized = typeof input === 'string' ? { message: input } : input;
    setOptions(normalized);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(value: boolean) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <Modal title={options.title ?? 'Confirmar ação'} onClose={() => settle(false)}>
          <p>{options.message}</p>
          <div className="ui-modal-actions">
            <Button variant="ghost" onClick={() => settle(false)}>
              {options.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button variant={options.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {options.confirmLabel ?? 'Confirmar'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions | string) => Promise<boolean> {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm deve ser usado dentro de um ConfirmProvider');
  return context.confirm;
}
