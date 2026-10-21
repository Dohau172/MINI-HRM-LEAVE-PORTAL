import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  AuditLog,
  PublicHoliday,
  PayrollPeriod,
  PayrollEmployeeSummary,
  Role,
  ContractType,
  SsoConfig,
} from '../types';
import { format } from 'date-fns';
import {
  Shield,
  Users,
  FileSpreadsheet,
  Lock,
  Unlock,
  History,
  Calendar,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  X,
  Search,
  Sparkles,
  Key,
  Server,
  Laptop,
  Cpu,
  UserPlus,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isITAdmin = currentUser?.role === 'ADMIN';
  const isHR = currentUser?.role === 'HR';

  // State các Tab: Tùy theo vai trò IT Admin hay HR Manager
  const [activeTab, setActiveTab] = useState<string>(isITAdmin ? 'USERS_PROVISION' : 'USERS_HR');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollEmployeeSummary[]>([]);
  const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Cấp phát Tài khoản Mới (Dành riêng cho IT Admin - User Provisioning)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Pass@123');
  const [newRole, setNewRole] = useState<Role>('EMPLOYEE');
  const [newContract, setNewContract] = useState<ContractType>('OFFICIAL');
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('Kỹ thuật');
  const [newQuotaVal, setNewQuotaVal] = useState<number>(12);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  // Modal Điều chỉnh Quỹ phép Thủ công (Dành riêng cho HR Manager - BR-15)
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [newQuota, setNewQuota] = useState<number>(12);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // Modal Chỉnh sửa Chức vụ & Hợp đồng (HR Manager & IT Admin)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPosition, setEditPosition] = useState('');
  const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
  const [editContract, setEditContract] = useState<ContractType>('OFFICIAL');
  const [editSeniority, setEditSeniority] = useState<number>(0);

  // Form Thêm Ngày Lễ/Tết mới (Dành riêng cho HR Manager - FR-01)
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [holidayError, setHolidayError] = useState<string | null>(null);

  // Cấu hình SSO (Dành riêng cho IT Admin)
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(true);
  const [googleClientId, setGoogleClientId] = useState('');
  const [microsoftSsoEnabled, setMicrosoftSsoEnabled] = useState(true);
  const [microsoftTenantId, setMicrosoftTenantId] = useState('');
  const [enforceMfa, setEnforceMfa] = useState(true);
  const [ssoSaveSuccess, setSsoSaveSuccess] = useState<string | null>(null);

  // Tìm kiếm nhân sự
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
      ];

      if (isHR) {
        promises.push(api.get('/admin/holidays'));
        promises.push(api.get('/admin/payroll-periods'));
        promises.push(api.get('/admin/payroll/summary'));
      }

      if (isITAdmin) {
        promises.push(api.get('/admin/system/sso-config'));
      }

      const results = await Promise.all(promises);
      setUsers(results[0].data || []);
      setAuditLogs(results[1].data || []);

      if (isHR) {
        setHolidays(results[2]?.data || []);
        setPayrollPeriods(results[3]?.data || []);
        setPayrollSummary(results[4]?.data?.summary || []);
      }

      if (isITAdmin && results[2]?.data) {
        setSsoConfig(results[2].data);
        setGoogleSsoEnabled(results[2].data.googleEnabled);
        setGoogleClientId(results[2].data.googleClientId);
        setMicrosoftSsoEnabled(results[2].data.microsoftEnabled);
        setMicrosoftTenantId(results[2].data.microsoftTenantId);
        setEnforceMfa(results[2].data.enforceMfa);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (isITAdmin) {
      setActiveTab('USERS_PROVISION');
    } else {
      setActiveTab('USERS_HR');
    }
  }, [currentUser?.role]);

  // 1. Thao tác IT Admin: Cấp phát Tài khoản Gốc (User Provisioning)
  const handleOpenCreateUser = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPassword('Pass@123');
    setNewRole('EMPLOYEE');
    setNewContract('OFFICIAL');
    setNewPosition('Kỹ sư phần mềm');
    setNewDepartment('Kỹ thuật');
    setNewQuotaVal(12);
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setShowCreateUserModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserSuccess(null);

    try {
      const res = await api.post('/admin/users', {
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        contractType: newContract,
        position: newPosition.trim(),
        department: newDepartment.trim(),
        annualLeaveQuota: Number(newQuotaVal),
      });

      setCreateUserSuccess(res.data.message || 'Cấp phát tài khoản thành công!');
      fetchAdminData();
      setTimeout(() => setShowCreateUserModal(false), 1500);
    } catch (err: any) {
      setCreateUserError(err.response?.data?.message || 'Không thể tạo tài khoản nhân sự.');
    }
  };

  // 2. Thao tác HR: Điều chỉnh Quỹ phép Thủ công (Ghi vết Audit Log - BR-15)
  const handleOpenAdjustQuota = (u: User) => {
    setAdjustingUser(u);
    setNewQuota(u.annualLeaveQuota);
    setAdjustReason('');
    setAdjustError(null);
    setAdjustSuccess(null);
  };

  const handleConfirmAdjustQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    setAdjustError(null);
    setAdjustSuccess(null);

    if (adjustReason.trim().length < 5) {
      setAdjustError('Lý do điều chỉnh bắt buộc tối thiểu 5 ký tự (theo BR-15).');
      return;
    }

    try {
      const res = await api.patch(`/admin/users/${adjustingUser.id}/adjust-quota`, {
        newQuota: Number(newQuota),
        reason: adjustReason.trim(),
      });
      setAdjustSuccess(res.data.message || 'Điều chỉnh thành công!');
      fetchAdminData();
      setTimeout(() => setAdjustingUser(null), 1500);
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Không thể điều chỉnh quỹ phép.');
    }
  };

  // 3. Cập nhật Chức danh & Hợp đồng (HR & IT Admin)
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditPosition(u.position);
    setEditRole(u.role);
    setEditContract(u.contractType);
    setEditSeniority(u.seniorityYears);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.patch(`/admin/users/${editingUser.id}/update`, {
        position: editPosition,
        role: editRole,
        contractType: editContract,
        seniorityYears: Number(editSeniority),
      });
      setEditingUser(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật thông tin.');
    }
  };

  // 4. Thao tác HR: Thêm & Xóa Ngày Lễ mới
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError(null);

    try {
      await api.post('/admin/holidays', {
        name: newHolidayName,
        date: newHolidayDate,
        description: newHolidayDesc,
      });
      setNewHolidayName('');
      setNewHolidayDate('');
      setNewHolidayDesc('');
      fetchAdminData();
    } catch (err: any) {
      setHolidayError(err.response?.data?.message || 'Không thể thêm ngày Lễ.');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ngày Lễ này khỏi hệ thống?')) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa ngày Lễ.');
    }
  };

  // 5. Thao tác HR: Khóa sổ Kỳ công ngày 25 (FR-13 & BR-07)
  const handleLockPayroll = async (monthYear: string) => {
    if (
      !window.confirm(
        `Xác nhận KHÓA SỔ kỳ tính lương ${monthYear}? Sau khi khóa, nhân viên sẽ bị CHẶN nộp đơn lùi ngày vào kỳ này.`,
      )
    )
      return;

    try {
      const res = await api.post('/admin/payroll-periods/lock', { monthYear });
      alert(res.data.message || 'Đã khóa sổ kỳ lương thành công!');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể khóa sổ kỳ lương.');
    }
  };

  const handleUnlockPayroll = async (id: string) => {
    if (!window.confirm('Xác nhận MỞ KHÓA kỳ tính lương này?')) return;
    try {
      await api.patch(`/admin/payroll-periods/${id}/unlock`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể mở khóa.');
    }
  };

  // 6. Thao tác IT Admin: Lưu cấu hình SSO
  const handleSaveSso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSsoSaveSuccess(null);
    try {
      const res = await api.post('/admin/system/sso-config', {
        googleEnabled: googleSsoEnabled,
        googleClientId,
        microsoftEnabled: microsoftSsoEnabled,
        microsoftTenantId,
        enforceMfa,
      });
      setSsoSaveSuccess(res.data.message || 'Cập nhật cấu hình SSO thành công!');
      setTimeout(() => setSsoSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật SSO.');
    }
  };

  // Xuất file CSV/Excel
  const handleExportCSV = () => {
    if (payrollSummary.length === 0) return;
    const headers = [
      'ID,Họ và tên,Email,Phòng ban,Chức danh,Hợp đồng,Công chuẩn,Phép năm,Nghỉ không lương,Nghỉ ốm,Việc riêng/Thai sản,Tổng vắng mặt,Công thực tế',
    ];
    const rows = payrollSummary.map((s) =>
      [
        `"${s.id}"`,
        `"${s.fullName}"`,
        `"${s.email}"`,
        `"${s.department}"`,
        `"${s.position}"`,
        `"${s.contractType === 'PROBATION' ? 'Thử việc' : 'Chính thức'}"`,
        s.standardWorkingDays,
        s.paidAnnualDays,
        s.unpaidDays,
        s.sickDays,
        s.otherPaidDays,
        s.totalAbsenceDays,
        s.actualWorkingDays,
      ].join(','),
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    // [SEEDED_BUG: BUG-10 (LOW)] - Tên file xuất báo cáo bị thiếu đuôi mở rộng (.csv), khiến hệ điều hành không tự động mở bằng Excel
    link.setAttribute('download', `Bang_Tong_Hop_Cong_Luong_export`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    // [SEEDED_BUG: BUG-09 (LOW)] - Lỗi tìm kiếm phân biệt hoa - thường (Case-sensitive): so sánh trực tiếp không dùng toLowerCase()
    return (
      u.fullName.includes(userSearchQuery) ||
      u.email.includes(userSearchQuery) ||
      u.department.includes(userSearchQuery) ||
      u.position.includes(userSearchQuery)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* 1. HEADER CỔNG ADMIN - TỰ ĐỘNG CHUYỂN ĐỔI THEO VAI TRÒ SoD */}
      <div
        className={`p-6 rounded-3xl shadow-lg border text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
          isITAdmin
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border-cyan-800/60'
            : 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border-emerald-800/60'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`p-3.5 rounded-2xl shadow-md ${
              isITAdmin ? 'bg-cyan-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isITAdmin ? <Laptop className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {isITAdmin
                  ? 'Cổng Quản Trị Kỹ Thuật (IT Admin - System Admin)'
                  : 'Cổng Quản Trị Nhân Sự (HR Manager - Business Admin)'}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isITAdmin
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isITAdmin ? 'System Admin' : 'Business Admin'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isITAdmin
                ? 'Phụ trách cấp phát tài khoản gốc, cấu hình SSO (Google/Microsoft 365) & Bảo vệ Nhật ký Audit Log bất biến'
                : 'Phụ trách vận hành nhân sự, điều chỉnh quỹ phép, danh mục ngày Lễ/Tết & Khóa sổ công lương ngày 25'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isITAdmin ? (
            <button
              onClick={handleOpenCreateUser}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cấp Phát Tài Khoản Mới</span>
            </button>
          ) : (
            <span className="text-xs text-slate-300 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700">
              Kỳ công: <strong>10/2026 (Đang mở)</strong>
            </span>
          )}
        </div>
      </div>

      {/* BANNER THÔNG TIN PHÂN TÁCH NHIỆM VỤ (Separation of Duties - SoD) */}
      <div
        className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs leading-relaxed ${
          isITAdmin
            ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}
      >
        <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isITAdmin ? 'text-cyan-700' : 'text-emerald-700'}`} />
        <div>
          <strong className="font-bold">
            Tuân thủ Nguyên tắc Phân Tách Nhiệm Vụ (Separation of Duties - SoD v3.3):
          </strong>{' '}
          {isITAdmin ? (
            <span>
              Tài khoản của bạn là <strong>IT Admin (System Admin)</strong>. Bạn nắm toàn quyền cấp phát tài khoản gốc, tích hợp SSO và giám sát nhật ký Audit Log để đảm bảo không ai có thể can thiệp lịch sử kiểm toán. Bạn <strong>không tham gia duyệt đơn xin phép</strong> và <strong>không thực hiện chốt công lương</strong>.
            </span>
          ) : (
            <span>
              Tài khoản của bạn là <strong>HR Manager (Business Admin)</strong>. Bạn phụ trách vận hành toàn bộ chính sách ngày phép, cập nhật hợp đồng, điều chỉnh phép thủ công (bắt buộc lưu vết giải trình) và chốt lương ngày 25. Bạn <strong>không can thiệp kỹ thuật hệ thống</strong> và <strong>không thể xóa hay sửa nhật ký Audit Log</strong>.
            </span>
          )}
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG TABS THEO VAI TRÒ */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {isITAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('USERS_PROVISION')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'USERS_PROVISION'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cấp phát & Quản lý Tài khoản ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'AUDIT_LOGS'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Giám sát Audit Log Bất biến ({auditLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SSO_CONFIG')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'SSO_CONFIG'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Cấu hình SSO & Hạ Tầng Kỹ Thuật</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('USERS_HR')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'USERS_HR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Hồ sơ & Quỹ phép Nhân sự ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HOLIDAYS')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'HOLIDAYS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Danh mục Lễ, Tết Quốc gia ({holidays.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'PAYROLL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Khóa Kỳ công & Xuất Tiền Lương</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT_LOGS_HR')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 ${
                activeTab === 'AUDIT_LOGS_HR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Đối soát Nhật ký Kiểm toán ({auditLogs.length})</span>
            </button>
          </>
        )}
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : activeTab === 'USERS_PROVISION' || activeTab === 'USERS_HR' ? (
        /* TAB 1: DANH SÁCH NHÂN SỰ & QUẢN TRỊ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isITAdmin
                  ? 'Danh sách Tài khoản & Cấp phát Quyền Hệ thống'
                  : 'Danh sách Nhân sự & Quản lý Quỹ phép Doanh nghiệp'}
              </h2>
              <p className="text-xs text-slate-500">
                {isITAdmin
                  ? 'IT Admin khởi tạo tài khoản, gán vai trò ban đầu và giám sát trạng thái kích hoạt'
                  : 'HR Manager cập nhật phân loại hợp đồng và điều chỉnh quỹ phép có ghi vết Audit Log (BR-15)'}
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm nhân sự..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {isITAdmin && (
                <button
                  onClick={handleOpenCreateUser}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 flex-shrink-0 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Họ và tên / Email</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Chức danh hệ thống</th>
                  <th className="py-3 px-4">Vai trò / Hợp đồng</th>
                  <th className="py-3 px-4">Quỹ phép cấp</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">Phòng {u.department}</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{u.position}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : u.role === 'HR'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : u.role === 'DIRECTOR'
                              ? 'bg-rose-100 text-rose-800'
                              : u.role === 'MANAGER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role === 'ADMIN'
                            ? 'IT Admin'
                            : u.role === 'HR'
                            ? 'HR Manager'
                            : u.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            u.contractType === 'PROBATION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.contractType === 'PROBATION' ? 'Thử việc' : 'Chính thức'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {u.annualLeaveQuota.toFixed(1)} <span className="text-xs text-slate-400 font-normal">ngày</span>
                      </div>
                      {u.previousYearQuota > 0 && (
                        <div className="text-[11px] text-slate-500">
                          +{u.previousYearQuota.toFixed(1)} phép tồn cũ
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {isHR && (
                        <button
                          onClick={() => handleOpenAdjustQuota(u)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
                          title="Điều chỉnh quỹ phép có ghi Audit Log"
                        >
                          Chỉnh phép
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                        title="Đổi chức danh & hợp đồng"
                      >
                        Sửa hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'AUDIT_LOGS' || activeTab === 'AUDIT_LOGS_HR' ? (
        /* TAB 2: NHẬT KÝ KIỂM TOÁN BẤT BIẾN (BR-15 & SoD) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <History className={`w-5 h-5 ${isITAdmin ? 'text-cyan-700' : 'text-emerald-700'}`} />
                <h2 className="text-base font-bold text-slate-900">
                  Nhật ký Kiểm toán Bất biến (Audit Log Trail - BR-15)
                </h2>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-slate-300">
                  🔒 Bất biến (Append-only)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isITAdmin
                  ? 'IT Admin giám sát toàn vẹn bảng Audit Log. Không một ai (kể cả HR hay Admin) có quyền sửa hoặc xóa bản ghi này.'
                  : 'HR Manager tra cứu đối soát lịch sử can thiệp số dư phép năm phục vụ giải trình nội bộ và chốt lương.'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                Tổng cộng: {auditLogs.length} sự kiện
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Đối tượng can thiệp</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Thay đổi giá trị</th>
                  <th className="py-3 px-4">Lý do giải trình (Bắt buộc)</th>
                  <th className="py-3 px-4">Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.admin?.fullName}</div>
                      <div className="text-[11px] text-slate-500">{log.admin?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.targetUser?.fullName}</div>
                      <div className="text-[11px] text-slate-500">Phòng {log.targetUser?.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="text-rose-600 line-through mr-1">{log.oldValue}</span>
                      <span>$\rightarrow$</span>
                      <span className="text-emerald-600 font-bold ml-1">{log.newValue}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 max-w-sm italic">
                      "{log.reason}"
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'SSO_CONFIG' ? (
        /* TAB IT ADMIN: CẤU HÌNH SSO & HẠ TẦNG KỸ THUẬT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-cyan-700" />
                  <span>Tích Hợp Đăng Nhập Một Lần (SSO) & Bảo Mật</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình kết nối Google Workspace và Microsoft 365 Azure AD cho toàn bộ nhân sự.
                </p>
              </div>
            </div>

            {ssoSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{ssoSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSso} className="space-y-4">
              {/* Google Workspace */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">Google Workspace SSO</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                      OAuth 2.0
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={googleSsoEnabled}
                      onChange={(e) => setGoogleSsoEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="xxxx.apps.googleusercontent.com"
                  />
                </div>
              </div>

              {/* Microsoft 365 Azure AD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">Microsoft 365 / Azure AD</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                      OpenID Connect
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={microsoftSsoEnabled}
                      onChange={(e) => setMicrosoftSsoEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Azure Tenant ID
                  </label>
                  <input
                    type="text"
                    value={microsoftTenantId}
                    onChange={(e) => setMicrosoftTenantId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                  />
                </div>
              </div>

              {/* Bắt buộc MFA */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm text-slate-900">Bắt buộc Xác thực Hai Yếu tố (MFA / 2FA)</span>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho toàn bộ Quản lý và Giám đốc phê duyệt đơn
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceMfa}
                    onChange={(e) => setEnforceMfa(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                Lưu Cấu Hình SSO & Bảo Mật
              </button>
            </form>
          </div>

          {/* Giám sát Trạng thái Máy chủ & Database */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Server className="w-5 h-5 text-cyan-700" />
                <span>Giám Sát Hạ Tầng & Cơ Sở Dữ Liệu</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Trạng thái kỹ thuật hệ thống Mini HRM Portal</p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Trạng thái Cơ sở dữ liệu</span>
                  <span className="text-xs font-bold text-emerald-700">PostgreSQL (mini_hrm_leave)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  CONNECTED
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Thời gian hoạt động (Uptime)</span>
                  <span className="text-xs font-bold text-slate-900">99.98% liên tục</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  ONLINE
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Cơ chế Kiểm toán Bất biến</span>
                  <span className="text-xs font-bold text-slate-900">Ghi append-only trong Prisma Transaction</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800">
                  ENFORCED
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Cấu hình Cổng / Đường truyền</span>
                  <span className="text-xs font-mono text-slate-700">Port 5000 (API) • Port 3000 (UI)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'HOLIDAYS' ? (
        /* TAB HR: DANH MỤC LỄ, TẾT QUỐC GIA (FR-01 & BR-05) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form thêm ngày Lễ */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Thêm Ngày Lễ / Tết Quốc Gia</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các ngày Lễ trong danh mục này sẽ tự động loại trừ không tính trừ ngày phép năm của nhân viên (BR-05).
              </p>
            </div>

            {holidayError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {holidayError}
              </div>
            )}

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tên ngày Lễ / Tết *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giỗ Tổ Hùng Vương (10/3 ÂL)"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ngày diễn ra *
                </label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về chế độ nghỉ theo quy định..."
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                + Lưu Ngày Lễ vào Hệ Thống
              </button>
            </form>
          </div>

          {/* Bảng danh sách Ngày Lễ */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Danh Mục Ngày Lễ / Tết Đã Thiết Lập ({holidays.length})
                </h3>
                <p className="text-xs text-slate-500">Mã màu đại diện trên Team Calendar: 🔵 Xanh dương</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {holidays.map((h) => (
                <div key={h.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(h.date), 'dd/MM/yyyy')} {h.description && `• ${h.description}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Xóa ngày lễ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB HR: CHỐT KỲ CÔNG & TIỀN LƯƠNG (FR-13 & FR-14 & BR-07) */
        <div className="space-y-6">
          {/* Card Quản lý Kỳ công */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  <span>Quản lý Khóa Kỳ Công Ngày 25 (Monthly Payroll Cutoff Lock)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mặc định kỳ tính lương từ ngày 26 tháng trước đến 25 tháng này. Khi khóa sổ, nhân viên bị chặn hoàn toàn việc nộp đơn lùi ngày (BR-07).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLockPayroll('10/2026')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa sổ Kỳ 10/2026</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {payrollPeriods.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex justify-between items-center ${
                    p.isLocked ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50/50 border-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">Kỳ {p.monthYear}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          p.isLocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.isLocked ? 'Đã khóa' : 'Đang mở'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(p.startDate), 'dd/MM/yyyy')} - {format(new Date(p.endDate), 'dd/MM/yyyy')}
                    </p>
                  </div>

                  {p.isLocked && (
                    <button
                      onClick={() => handleUnlockPayroll(p.id)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Mở khóa
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bảng Dữ liệu Tổng hợp Tiền lương & Xuất báo cáo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span>Bảng Tổng Hợp Công & Nghỉ Phép Kỳ 10/2026 (Phục vụ Tính Lương)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Chuẩn hóa dữ liệu xuất Excel (.xlsx/.csv) và PDF cho Ban Giám Đốc và Bộ phận Kế toán
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File Excel (.csv)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-3 px-3">Nhân sự</th>
                    <th className="py-3 px-3">Phòng ban / Chức danh</th>
                    <th className="py-3 px-3 text-center">Công chuẩn</th>
                    <th className="py-3 px-3 text-center text-blue-700">Phép năm</th>
                    <th className="py-3 px-3 text-center text-rose-700">Nghỉ K.Lương</th>
                    <th className="py-3 px-3 text-center text-amber-700">Nghỉ Ốm</th>
                    <th className="py-3 px-3 text-center">Tổng vắng</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-700">Công thực tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollSummary.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-500">{s.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">Phòng {s.department}</div>
                        <div className="text-[11px] text-slate-500">{s.position}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {s.standardWorkingDays}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {s.paidAnnualDays.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-700">
                        {s.unpaidDays.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700">
                        {s.sickDays.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {s.totalAbsenceDays.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40 rounded">
                        {s.actualWorkingDays.toFixed(1)} công
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL IT ADMIN: CẤP PHÁT TÀI KHOẢN MỚI */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-cyan-700" />
                <h3 className="font-bold text-slate-900 text-base">Cấp Phát Tài Khoản Nhân Sự Mới</h3>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {createUserError}
              </div>
            )}
            {createUserSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                {createUserSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email doanh nghiệp *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="a.nguyen@company.vn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò hệ thống *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                    <option value="DIRECTOR">DIRECTOR (Giám đốc)</option>
                    <option value="HR">HR (Quản trị nhân sự)</option>
                    <option value="ADMIN">ADMIN (IT Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại hợp đồng *</label>
                  <select
                    value={newContract}
                    onChange={(e) => setNewContract(e.target.value as ContractType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="OFFICIAL">Chính thức</option>
                    <option value="PROBATION">Thử việc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng ban *</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Kỹ thuật / Nhân sự..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chức danh *</label>
                  <input
                    type="text"
                    required
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Kỹ sư phần mềm..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quỹ phép năm khởi tạo</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={newQuotaVal}
                  onChange={(e) => setNewQuotaVal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
                >
                  Cấp Phát Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL ĐIỀU CHỈNH QUỸ PHÉP THỦ CÔNG (HR MANAGER - BR-15) */}
      {adjustingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Điều Chỉnh Quỹ Phép Thủ Công</h3>
                <p className="text-xs text-slate-500">{adjustingUser.fullName} (Phòng {adjustingUser.department})</p>
              </div>
              <button onClick={() => setAdjustingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800">
              <strong>Yêu cầu Kiểm toán (BR-15):</strong> Thao tác này sẽ ghi vĩnh viễn vào Audit Log bất biến kèm lý do giải trình.
            </div>

            {adjustError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {adjustError}
              </div>
            )}
            {adjustSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                {adjustSuccess}
              </div>
            )}

            <form onSubmit={handleConfirmAdjustQuota} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Số ngày phép hiện tại: {adjustingUser.annualLeaveQuota.toFixed(1)} ngày
                </label>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Số ngày phép mới mong muốn *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={newQuota}
                  onChange={(e) => setNewQuota(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do can thiệp điều chỉnh * (Tối thiểu 5 ký tự)
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ví dụ: Bổ sung 1 ngày phép bù trực lễ ngày 2/9 theo phê duyệt của Ban Giám đốc..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Lưu & Ghi Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SỬA HỒ SƠ & CHỨC VỤ NHÂN SỰ */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Cập nhật Hồ sơ Nhân sự</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Chức danh hệ thống *
                </label>
                <input
                  type="text"
                  required
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                    <option value="DIRECTOR">DIRECTOR (Giám đốc)</option>
                    <option value="HR">HR (Quản trị nhân sự)</option>
                    <option value="ADMIN">ADMIN (IT Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hợp đồng *
                  </label>
                  <select
                    value={editContract}
                    onChange={(e) => setEditContract(e.target.value as ContractType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OFFICIAL">Chính thức</option>
                    <option value="PROBATION">Thử việc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Số năm thâm niên
                </label>
                <input
                  type="number"
                  min="0"
                  value={editSeniority}
                  onChange={(e) => setEditSeniority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
