import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Users, BookOpen, CalendarCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const roles = [
  { label: 'Admin', email: 'admin@school.com', password: 'admin123' },
  { label: 'Teacher', email: 'teacher@school.com', password: 'teacher123' },
  { label: 'Student', email: 'student@school.com', password: 'student123' },
  { label: 'Parent', email: 'parent@school.com', password: 'parent123' },
  { label: 'Accountant', email: 'accountant@school.com', password: 'account123' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleRoleSelect = (roleLabel: string) => {
    const role = roles.find((r) => r.label === roleLabel);
    if (role) {
      setSelectedRole(roleLabel);
      setEmail(role.email);
      setPassword(role.password);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
    fontSize: 14, outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left branding panel */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex"
        style={{
          width: '50%', background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
          position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Dot pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 48px', width: '100%', maxWidth: 500 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            style={{
              width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <GraduationCap size={40} color="white" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 8 }}>
            Sunrise Public School
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 18, color: '#c7d2fe', marginBottom: 48 }}>
            Empowering minds, shaping futures
          </motion.p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: <Users size={20} />, label: 'Students', value: '1,240' },
              { icon: <BookOpen size={20} />, label: 'Teachers', value: '86' },
              { icon: <CalendarCheck size={20} />, label: 'Attendance', value: '98%' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  borderRadius: 16, padding: 16, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: 'white' }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#c7d2fe', marginTop: 2 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right login form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', backgroundColor: 'white',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }} className={shake ? 'animate-shake' : ''}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <GraduationCap size={28} color="white" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Sunrise Public School</div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 15 }}>Sign in to your account to continue</p>

          {/* Role selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 10 }}>
              Quick Login
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roles.map((role) => (
                <button
                  key={role.label}
                  onClick={() => handleRoleSelect(role.label)}
                  type="button"
                  style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 9999,
                    border: selectedRole === role.label ? '1.5px solid #4f46e5' : '1.5px solid #e5e7eb',
                    backgroundColor: selectedRole === role.label ? '#4f46e5' : 'white',
                    color: selectedRole === role.label ? 'white' : '#4b5563',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 14, color: '#e11d48', fontWeight: 500, marginBottom: 16 }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', backgroundColor: loading ? '#818cf8' : '#4f46e5',
                color: 'white', fontWeight: 600, fontSize: 15, borderRadius: 12,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#4338ca'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#4f46e5'; }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
            Select a role above to auto-fill credentials
          </p>
        </div>
      </motion.div>
    </div>
  );
}
