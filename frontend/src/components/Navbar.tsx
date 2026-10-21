import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Calendar, Shield, User as UserIcon, CheckSquare, Terminal, Briefcase } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isITAdmin = user.role === 'ADMIN';
  const isHR = user.role === 'HR';
  const isManagerOrDirector = user.role === 'MANAGER' || user.role === 'DIRECTOR';

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:bg-blue-500 transition shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">Mini HRM</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded border border-blue-700/50 uppercase tracking-wider">
                  Leave Portal v3.3
                </span>
              </div>
            </Link>

            {/* Portal Switcher Tabs */}
            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <Link
                to="/employee"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                  location.pathname === '/employee'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Cổng Cá nhân</span>
              </Link>

              {isManagerOrDirector && (
                <Link
                  to="/manager"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    location.pathname === '/manager'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Cổng Quản lý Duyệt</span>
                </Link>
              )}

              {/* SoD: HR Manager có Cổng Quản trị Nhân sự & Tiền lương riêng */}
              {isHR && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Cổng HR Quản Trị</span>
                </Link>
              )}

              {/* SoD: IT Admin có Cổng Quản trị Kỹ thuật & Bảo mật riêng */}
              {isITAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Cổng IT Admin (Hạ tầng)</span>
                </Link>
              )}
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center space-x-2 justify-end">
                <span className="font-semibold text-sm text-slate-100">{user.fullName}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    user.role === 'ADMIN'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : user.role === 'HR'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : user.role === 'DIRECTOR'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : user.role === 'MANAGER'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {user.role === 'ADMIN'
                    ? '💻 IT Admin'
                    : user.role === 'HR'
                    ? '🛡️ HR Manager'
                    : user.role === 'DIRECTOR'
                    ? '👔 Giám đốc'
                    : user.role === 'MANAGER'
                    ? '💼 Quản lý'
                    : '👤 Nhân viên'}
                </span>
                {user.contractType === 'PROBATION' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    Thử việc
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {user.position || user.department} • Phòng {user.department}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-slate-800 border border-slate-700 transition"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
