import type { ReactNode, TdHTMLAttributes } from 'react';

// Tabela que vira lista de cards no celular (CSS puro, via data-label em
// cada <Td> — ver .ui-table em app/globals.css). Mantém <table> real por
// baixo (leitor de tela, cópia/seleção), só reskinada.
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">{children}</table>
    </div>
  );
}

export function Td({ label, children, ...rest }: { label: string; children?: ReactNode } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td data-label={label} {...rest}>
      {children}
    </td>
  );
}
