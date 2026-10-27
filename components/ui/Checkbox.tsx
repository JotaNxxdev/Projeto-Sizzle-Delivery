import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export default function Checkbox({ label, id, className, ...rest }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={`ui-checkbox ${className ?? ''}`} htmlFor={inputId}>
      <input type="checkbox" id={inputId} className="ui-checkbox-input" {...rest} />
      <span className="ui-checkbox-label">{label}</span>
    </label>
  );
}
