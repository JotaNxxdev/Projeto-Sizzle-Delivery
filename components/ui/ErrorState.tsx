import { TriangleAlert } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Algo deu errado',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="ui-empty-state ui-empty-state-error">
      <TriangleAlert className="ui-empty-state-icon" size={36} aria-hidden="true" />
      <p className="ui-empty-state-title">{title}</p>
      {description && <p className="ui-empty-state-description">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
