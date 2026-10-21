import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'ADMIN' || user.role === 'HR') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'MANAGER' || user.role === 'DIRECTOR') {
    return <Navigate to="/manager" replace />;
  }
  return <Navigate to="/employee" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Employee Portal (Mọi nhân sự đều có thể nộp đơn cá nhân và xem số dư quỹ phép) */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'DIRECTOR', 'HR', 'ADMIN']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Manager & Director Approval Portal (SoD: Chỉ Quản lý và Giám đốc phê duyệt, IT Admin không tham gia) */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER', 'DIRECTOR']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal (SoD: Dành riêng cho IT Admin và HR Manager) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Root default redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
