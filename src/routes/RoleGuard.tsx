import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/data/mockData';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <ShieldX size={40} color="#f43f5e" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Not Authorized</h1>
        <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: 320, marginBottom: 24 }}>
          You don't have permission to access this page. Please contact your administrator.
        </p>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
