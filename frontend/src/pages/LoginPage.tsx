import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Lock, Mail, ShieldAlert, Eye, EyeOff, Shield, Users, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
      navigate(res.data.redirectPath);
    } catch (err: any) {
      console.error('Chi tiết lỗi:', err);
      if (!err.response) {
        setError('[Lỗi mạng/Không có phản hồi]: Không thể kết nối tới máy chủ API. Vui lòng đảm bảo Backend (cổng 5000) và PostgreSQL đang chạy.');
      } else {
        const serverMessage = err.response?.data?.message || err.message || 'Lỗi không xác định';
        setError(`[HTTP ${err.response.status}]: ${serverMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Pass@123');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl shadow-lg mb-4">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mini HRM Leave Portal</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cổng Quản lý Nghỉ phép Doanh nghiệp • Phiên bản 3.3 (SoD Phân Tách Nhiệm Vụ)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email doanh nghiệp *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="name@company.vn"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mật khẩu *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              </button>
            </div>
          </form>

          {/* DỮ LIỆU TÀI KHOẢN MẪU KIỂM THỬ THEO SRS V3.2 MỤC 7 */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tài khoản mẫu kiểm thử (SRS Section 7):
              </span>
              <span className="text-[11px] text-slate-400">Pass: Pass@123</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {/* 1. IT Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('itadmin@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">💻 IT Admin: Nguyễn Hoàng Bách</span>
                  <div className="text-[11px] text-slate-600">itadmin@company.vn (Vai trò: ADMIN • Cấp tài khoản, SSO & Audit Log)</div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Điền</span>
              </button>

              {/* 2. HR Manager */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">🛡️ HR Manager: Hoàng Thu Trang</span>
                  <div className="text-[11px] text-emerald-700">admin@company.vn (Vai trò: HR • Vận hành nhân sự, chốt lương ngày 25, Lễ/Tết)</div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Điền</span>
              </button>

              {/* 2. Director */}
              <button
                type="button"
                onClick={() => handleQuickLogin('director@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">👔 Giám đốc Khối: Lê Khắc Hoàng</span>
                  <div className="text-[11px] text-rose-700">director@company.vn (Duyệt Cấp 2 cho đơn $\ge 3$ ngày)</div>
                </div>
                <span className="text-[11px] font-semibold text-rose-600">Điền</span>
              </button>

              {/* 3. Line Manager */}
              <button
                type="button"
                onClick={() => handleQuickLogin('mai.tran@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">💼 Trưởng phòng: Trần Thị Mai</span>
                  <div className="text-[11px] text-purple-700">mai.tran@company.vn (Duyệt Cấp 1, thiết lập DoA)</div>
                </div>
                <span className="text-[11px] font-semibold text-purple-600">Điền</span>
              </button>

              {/* 4. DoA Deputy */}
              <button
                type="button"
                onClick={() => handleQuickLogin('tuan.le@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">🤝 Nhận ủy quyền DoA: Lê Anh Tuấn</span>
                  <div className="text-[11px] text-indigo-700">tuan.le@company.vn (Phó phòng nhận duyệt thay DoA)</div>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600">Điền</span>
              </button>

              {/* 5. Employee Official */}
              <button
                type="button"
                onClick={() => handleQuickLogin('an.nguyen@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">👤 Nhân viên chính thức: Nguyễn Văn An</span>
                  <div className="text-[11px] text-blue-700">an.nguyen@company.vn (Thâm niên 3 năm, có phép tồn cũ)</div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600">Điền</span>
              </button>

              {/* 6. Employee Probation */}
              <button
                type="button"
                onClick={() => handleQuickLogin('linh.dang@company.vn')}
                className="flex items-center justify-between px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition text-left"
              >
                <div>
                  <span className="font-bold">🐣 Nhân viên thử việc: Đặng Thùy Linh</span>
                  <div className="text-[11px] text-amber-700">linh.dang@company.vn (Chỉ được chọn Nghỉ không lương - BR-02)</div>
                </div>
                <span className="text-[11px] font-semibold text-amber-600">Điền</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 underline">
              Đăng ký tài khoản nhân sự mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
