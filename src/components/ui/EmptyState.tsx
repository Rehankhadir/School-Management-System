import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px' }}>
      <div
        style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
      >
        {icon || <Inbox size={32} color="#9ca3af" />}
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: 4 }}>{title}</h3>
      {description && <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', maxWidth: 320, marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  );
}
