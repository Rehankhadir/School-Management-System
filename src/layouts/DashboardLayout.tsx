import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { notifications as mockNotifications, students, teachers } from '@/data/mockData';
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck, BookOpen,
  Clock, DollarSign, FileText, Bell, Megaphone, UserCircle,
  Settings, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Search, ChevronDown
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  group: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'], group: 'Overview' },
  { label: 'Students', path: '/students', icon: <Users size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'], group: 'People' },
  { label: 'Teachers', path: '/teachers', icon: <GraduationCap size={20} />, roles: ['admin', 'teacher'], group: 'People' },
  { label: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} />, roles: ['admin', 'teacher', 'student', 'parent'], group: 'Academic' },
  { label: 'Marks', path: '/marks', icon: <BookOpen size={20} />, roles: ['admin', 'teacher', 'student', 'parent'], group: 'Academic' },
  { label: 'Exams', path: '/exams', icon: <CalendarCheck size={20} />, roles: ['admin', 'teacher', 'student', 'parent'], group: 'Academic' },
  { label: 'Timetable', path: '/timetable', icon: <Clock size={20} />, roles: ['admin', 'teacher', 'student', 'parent'], group: 'Academic' },
  { label: 'Fees', path: '/fees', icon: <DollarSign size={20} />, roles: ['admin', 'student', 'parent', 'accountant'], group: 'Finance' },
  { label: 'Leaves', path: '/leaves', icon: <FileText size={20} />, roles: ['admin', 'teacher', 'student', 'accountant'], group: 'Communication' },
  { label: 'Announcements', path: '/announcements', icon: <Megaphone size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'], group: 'Communication' },
  { label: 'Notifications', path: '/notifications', icon: <Bell size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'], group: 'Communication' },
  { label: 'Reports', path: '/reports', icon: <FileText size={20} />, roles: ['admin', 'accountant'], group: 'Reports' },
  { label: 'Profile', path: '/profile', icon: <UserCircle size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'], group: 'Settings' },
];

export function DashboardLayout() {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));
  const groups = [...new Set(filteredNav.map((i) => i.group))];
  const unreadCount = mockNotifications.filter((n) => !n.read && n.forRole.includes(role || '')).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const searchResults = searchQuery.length > 1 ? [
    ...students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map((s) => ({ id: s.id, name: s.name, type: 'Student', path: `/students/${s.id}` })),
    ...teachers.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map((t) => ({ id: t.id, name: t.name, type: 'Teacher', path: `/teachers` })),
  ] : [];

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarWidth = collapsed ? 72 : 256;

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const sw = isMobile ? 256 : sidebarWidth;
    return (
      <div
        style={{
          width: sw, minWidth: sw, height: '100%', backgroundColor: '#1e1b4b',
          color: 'white', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: 64 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={20} color="white" />
          </div>
          {(isMobile || !collapsed) && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Sunrise Public</div>
              <div style={{ fontSize: 11, color: '#a5b4fc' }}>School</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
          {groups.map((group) => (
            <div key={group} style={{ marginBottom: 20 }}>
              {(isMobile || !collapsed) && (
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8', padding: '0 12px', marginBottom: 8 }}>
                  {group}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredNav.filter((i) => i.group === group).map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: collapsed && !isMobile ? '10px 0' : '10px 12px',
                        borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: 'none', position: 'relative',
                        transition: 'all 0.15s',
                        backgroundColor: isActive ? 'rgba(99,102,241,0.3)' : 'transparent',
                        color: isActive ? 'white' : '#c7d2fe',
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                      }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.15)'); }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.backgroundColor = 'transparent'); }}
                    >
                      {isActive && (
                        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, backgroundColor: '#818cf8', borderRadius: '0 4px 4px 0' }} />
                      )}
                      <span style={{ flexShrink: 0 }}>{item.icon}</span>
                      {(isMobile || !collapsed) && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
              borderTop: '1px solid rgba(255,255,255,0.1)', background: 'none', border: 'none',
              borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255,255,255,0.1)',
              cursor: 'pointer', color: '#a5b4fc',
            }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}

        {/* User card */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user?.name || ''} size="sm" />
            {(isMobile || !collapsed) && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#a5b4fc', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block" style={{ flexShrink: 0 }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            />
            <motion.div
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}
              className="lg:hidden"
            >
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            height: 64, backgroundColor: 'white', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setMobileOpen(true)} className="lg:hidden" style={{ padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}>
              <Menu size={20} color="#4b5563" />
            </button>

            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative' }} className="hidden sm:block">
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search students, teachers..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                style={{
                  width: 260, paddingLeft: 36, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
                  fontSize: 14, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 12, outline: 'none',
                }}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', marginTop: 8, width: '100%',
                  backgroundColor: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #f3f4f6', padding: '8px 0', zIndex: 50,
                }}>
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { navigate(r.path); setSearchQuery(''); setShowSearchResults(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left',
                      }}
                      className="hover:bg-gray-50"
                    >
                      <Avatar name={r.name} size="sm" />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{r.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{ position: 'relative', padding: 8, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent' }}
                className="hover:bg-gray-100"
              >
                <Bell size={20} color="#4b5563" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                    backgroundColor: '#e11d48', color: 'white', fontSize: 10, fontWeight: 700,
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320,
                  backgroundColor: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '1px solid #f3f4f6', zIndex: 50,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Notifications</span>
                  </div>
                  {mockNotifications.filter((n) => n.forRole.includes(role || '')).slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 16px', cursor: 'pointer',
                        backgroundColor: !n.read ? '#eef2ff' : 'transparent',
                      }}
                      className="hover:bg-gray-50"
                    >
                      <div style={{ fontSize: 13, fontWeight: !n.read ? 600 : 400, color: '#111827' }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                    </div>
                  ))}
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => { navigate('/notifications'); setShowNotifDropdown(false); }}
                      style={{ fontSize: 13, fontWeight: 500, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      View All →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                  borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent',
                }}
                className="hover:bg-gray-100"
              >
                <Avatar name={user?.name || ''} size="sm" />
                <span className="hidden sm:block" style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{user?.name}</span>
                <ChevronDown size={16} color="#9ca3af" className="hidden sm:block" />
              </button>
              {showUserMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 224,
                  backgroundColor: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '1px solid #f3f4f6', zIndex: 50,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</div>
                    <div style={{ marginTop: 4 }}><Badge variant="indigo">{user?.role}</Badge></div>
                  </div>
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', fontSize: 14, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    className="hover:bg-gray-50"
                  >
                    <UserCircle size={16} /> Profile
                  </button>
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', fontSize: 14, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    className="hover:bg-gray-50"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
                    <button
                      onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', fontSize: 14, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      className="hover:bg-rose-50"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
