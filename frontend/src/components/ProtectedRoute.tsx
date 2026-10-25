import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  allowedRole?: Role; // Tương thích ngược
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập -> chuyển về Login (FR-03)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const validRoles: Role[] = allowedRoles || (allowedRole ? [allowedRole] : []);

  // Kiểm soát RBAC (BR-14): Kiểm tra quyền hạn vai trò
  if (validRoles.length > 0 && !validRoles.includes(user.role)) {
    // Điều hướng về đúng portal tương ứng với vai trò của user
    if (user.role === 'ADMIN' || user.role === 'HR') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'MANAGER' || user.role === 'DIRECTOR') {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/employee" replace />;
  }

  return <>{children}</>;
};

