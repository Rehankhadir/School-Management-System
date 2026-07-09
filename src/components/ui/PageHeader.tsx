import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 className="text-xl lg:text-2xl" style={{ fontWeight: 700, color: '#111827' }}>{title}</h1>
          {badge}
        </div>
        {subtitle && <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>}
      </div>
      {actions && <div className="responsive-header-actions" style={{ display: 'flex', alignItems: 'center' }}>{actions}</div>}
    </motion.div>
  );
}
