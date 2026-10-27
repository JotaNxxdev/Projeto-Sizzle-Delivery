import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty-state">
      <Icon className="ui-empty-state-icon" size={36} aria-hidden="true" />
      <p className="ui-empty-state-title">{title}</p>
      {description && <p className="ui-empty-state-description">{description}</p>}
      {action}
    </div>
  );
}
