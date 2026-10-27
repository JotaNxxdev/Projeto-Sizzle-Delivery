export default function Skeleton({ width, height = 16, radius = 'md', className }: { width?: number | string; height?: number | string; radius?: 'sm' | 'md' | 'lg' | 'full'; className?: string }) {
  return (
    <span
      className={`ui-skeleton ui-skeleton-${radius} ${className ?? ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
