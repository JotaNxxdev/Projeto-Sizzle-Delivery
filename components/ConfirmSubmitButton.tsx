'use client';

import { useConfirm } from '@/contexts/ConfirmContext';

// Botão de submit que pede confirmação antes de deixar o form seguir — usado
// dentro de <form action={serverAction}> em Server Components pra ações
// destrutivas (excluir, remover), sem precisar converter a página inteira
// em Client Component. A confirmação em si é o modal de contexts/ConfirmContext
// (substitui o antigo window.confirm) — por isso o clique é interceptado e o
// form só é de fato submetido (via requestSubmit) se a pessoa confirmar.
export default function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
  danger = true,
}: {
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}) {
  const confirm = useConfirm();

  return (
    <button
      type="submit"
      className={className}
      onClick={async (event) => {
        event.preventDefault();
        const form = event.currentTarget.form;
        const ok = await confirm({ message: confirmMessage, danger, confirmLabel: 'Confirmar' });
        if (ok) form?.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}
