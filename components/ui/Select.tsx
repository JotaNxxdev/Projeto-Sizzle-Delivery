import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// Usa <select> nativo por baixo (teclado, leitor de tela e o "picker" do
// celular continuam de graça), mas com appearance:none + seta própria —
// visualmente não sobra nada do estilo padrão do navegador.
export default function Select({ label, error, hint, id, className, children, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`ui-select-wrap${error ? ' ui-input-wrap-error' : ''}`}>
        <select id={inputId} className={`ui-select ${className ?? ''}`} aria-invalid={Boolean(error)} {...rest}>
          {children}
        </select>
        <ChevronDown className="ui-select-chevron" size={16} aria-hidden="true" />
      </div>
      {error ? <p className="ui-field-error">{error}</p> : hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}
