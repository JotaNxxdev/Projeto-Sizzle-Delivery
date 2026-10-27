import type { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

// Versão compacta do Select — mesmo reskin (appearance:none + seta própria),
// sem o wrapper de label/campo em bloco, pra caber numa linha de ações
// (ex.: trocar status de um pedido ao lado do botão "Atualizar").
export default function InlineSelect({ className, children, ...rest }: Props) {
  return (
    <div className="ui-select-wrap ui-select-wrap-inline">
      <select className={`ui-select ${className ?? ''}`} {...rest}>
        {children}
      </select>
      <ChevronDown className="ui-select-chevron" size={14} aria-hidden="true" />
    </div>
  );
}
