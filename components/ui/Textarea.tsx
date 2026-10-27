import { useId, type TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Textarea({ label, error, hint, id, className, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`ui-textarea ${error ? 'ui-input-wrap-error' : ''} ${className ?? ''}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error ? <p className="ui-field-error">{error}</p> : hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}
