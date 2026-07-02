import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleGuard } from '@/routes/RoleGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { StudentsPage } from '@/pages/Students';
import { StudentDetailPage } from '@/pages/StudentDetail';
import { TeachersPage } from '@/pages/Teachers';
import { AttendancePage } from '@/pages/Attendance';
import { MarksPage } from '@/pages/Marks';
import { ExamsPage } from '@/pages/Exams';
import { TimetablePage } from '@/pages/Timetable';
import { HolidaysPage } from '@/pages/Holidays';
import { FeesPage } from '@/pages/Fees';
import { LeavesPage } from '@/pages/Leaves';
import { NotificationsPage } from '@/pages/Notifications';
import { AnnouncementsPage } from '@/pages/Announcements';
import { ReportsPage } from '@/pages/Reports';
import { ProfilePage } from '@/pages/Profile';
import { NotFoundPage } from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route path="/students" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent', 'accountant']}>
                <StudentsPage />
              </RoleGuard>
            } />
            <Route path="/students/:id" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent', 'accountant']}>
                <StudentDetailPage />
              </RoleGuard>
            } />

            <Route path="/teachers" element={
              <RoleGuard allowedRoles={['admin', 'teacher']}>
                <TeachersPage />
              </RoleGuard>
            } />

            <Route path="/attendance" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                <AttendancePage />
              </RoleGuard>
            } />

            <Route path="/marks" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                <MarksPage />
              </RoleGuard>
            } />

            <Route path="/exams" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                <ExamsPage />
              </RoleGuard>
            } />

            <Route path="/timetable" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                <TimetablePage />
              </RoleGuard>
            } />

            <Route path="/holidays" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent', 'accountant']}>
                <HolidaysPage />
              </RoleGuard>
            } />

            <Route path="/fees" element={
              <RoleGuard allowedRoles={['admin', 'student', 'parent', 'accountant']}>
                <FeesPage />
              </RoleGuard>
            } />

            <Route path="/leaves" element={
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'accountant']}>
                <LeavesPage />
              </RoleGuard>
            } />

            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route path="/reports" element={
              <RoleGuard allowedRoles={['admin', 'accountant']}>
                <ReportsPage />
              </RoleGuard>
            } />

            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
