import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export default function Switch({ label, id, className, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={`ui-switch ${className ?? ''}`} htmlFor={inputId}>
      <input type="checkbox" role="switch" id={inputId} className="ui-switch-input" {...rest} />
      <span className="ui-switch-track" aria-hidden="true">
        <span className="ui-switch-thumb" />
      </span>
      {label && <span className="ui-switch-label">{label}</span>}
    </label>
  );
}
