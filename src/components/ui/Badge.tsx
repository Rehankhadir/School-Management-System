interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple' | 'indigo';
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-gray-50 text-gray-700 border border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

const dotStyles: Record<string, string> = {
  success: 'bg-emerald-500',
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
};

export function Badge({ children, variant = 'neutral', showDot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {showDot && <span className={['w-1.5 h-1.5 rounded-full', dotStyles[variant]].join(' ')} />}
      {children}
    </span>
  );
}
