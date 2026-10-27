import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export default function Radio({ label, id, className, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={`ui-radio ${className ?? ''}`} htmlFor={inputId}>
      <input type="radio" id={inputId} className="ui-radio-input" {...rest} />
      <span className="ui-radio-label">{label}</span>
    </label>
  );
}
