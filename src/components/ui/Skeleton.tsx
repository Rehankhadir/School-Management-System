interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200';
  const variantClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'rect'
        ? 'rounded-xl'
        : 'rounded h-4';
  return <div className={[baseClass, variantClass, className].join(' ')} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px' }}>
          <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
