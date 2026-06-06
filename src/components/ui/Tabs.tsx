interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: isActive ? 'white' : 'transparent',
                color: isActive ? '#4f46e5' : '#6b7280',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#e0e7ff' : '#e5e7eb',
                    color: isActive ? '#4f46e5' : '#6b7280',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
      <nav style={{ display: 'flex', gap: '24px' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: '12px 4px',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: `2px solid ${isActive ? '#4f46e5' : 'transparent'}`,
                color: isActive ? '#4f46e5' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? '#4f46e5' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#e0e7ff' : '#f3f4f6',
                    color: isActive ? '#4f46e5' : '#6b7280',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
