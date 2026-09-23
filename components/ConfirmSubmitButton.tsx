'use client';

// Botão de submit que pede confirmação antes de deixar o form seguir — usado
// dentro de <form action={serverAction}> em Server Components pra ações
// destrutivas (excluir, remover), sem precisar converter a página inteira
// em Client Component.
export default function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
}: {
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
