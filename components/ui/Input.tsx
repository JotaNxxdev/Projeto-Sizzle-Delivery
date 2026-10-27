import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export default function Input({ label, error, hint, icon, id, className, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`ui-input-wrap${icon ? ' ui-input-wrap-icon' : ''}${error ? ' ui-input-wrap-error' : ''}`}>
        {icon && (
          <span className="ui-input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input id={inputId} className={`ui-input ${className ?? ''}`} aria-invalid={Boolean(error)} {...rest} />
      </div>
      {error ? <p className="ui-field-error">{error}</p> : hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}
