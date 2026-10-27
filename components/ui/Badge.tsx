import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export default function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`ui-badge ui-badge-${tone}`}>
      {icon}
      {children}
    </span>
  );
}
