'use client';

export interface TabOption {
  value: string;
  label: string;
}

// Abas que trocam conteúdo na mesma página via estado (ex.: filtros),
// diferente de components/TabBar.tsx que navega entre rotas.
export default function Tabs({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={`ui-tabs-item${option.value === value ? ' ui-tabs-item-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
