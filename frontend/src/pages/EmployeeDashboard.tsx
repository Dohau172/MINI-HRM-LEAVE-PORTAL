import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  LeaveUnit,
  LEAVE_TYPE_LABELS,
  LEAVE_UNIT_LABELS,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TeamCalendar } from '../components/TeamCalendar';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  FileText,
  Upload,
  Trash2,
  Edit,
  X,
  Undo2,
  Sparkles,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_REQUESTS' | 'TEAM_CALENDAR'>('MY_REQUESTS');
  const [loading, setLoading] = useState(true);

  // Form tạo đơn mới (Tối ưu chuẩn 4-Clicks - NFR-02)
  const isProbation = user?.contractType === 'PROBATION';
  const [leaveType, setLeaveType] = useState<LeaveType>(isProbation ? 'UNPAID' : 'ANNUAL');
  const [leaveUnit, setLeaveUnit] = useState<LeaveUnit>('FULL_DAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Sửa đơn khi Pending
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Yêu cầu Hủy đơn đã duyệt (FR-09 & BR-11)
  const [cancelModalRequest, setCancelModalRequest] = useState<LeaveRequest | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [balanceRes, requestsRes] = await Promise.all([
        api.get('/leave/balance'),
        api.get('/leave/my-requests'),
      ]);
      setBalance(balanceRes.data);
      setRequests(requestsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Đảm bảo nhân sự thử việc chỉ được chọn UNPAID (BR-02)
  useEffect(() => {
    if (isProbation && leaveType !== 'UNPAID') {
      setLeaveType('UNPAID');
    }
  }, [isProbation]);

  // Tự động tính toán số ngày làm việc thực tế (loại trừ Thứ 7, CN và ngày Lễ - BR-05)
  useEffect(() => {
    if (startDate && endDate) {
      api
        .post('/leave/calculate-days', { startDate, endDate, leaveUnit })
        .then((res) => {
          setCalculatedDays(res.data.workingDays);
          setFormError(null);
        })
        .catch((err) => {
          setCalculatedDays(null);
          setFormError(err.response?.data?.message || 'Khoảng ngày không hợp lệ');
        });
    } else {
      setCalculatedDays(null);
    }
  }, [startDate, endDate, leaveUnit]);

  // Click 3 Gợi ý lý do nhanh (1-Click selection)
  const quickReasons = [
    'Giải quyết việc riêng gia đình đột xuất',
    'Khám chữa bệnh và chăm sóc sức khỏe',
    'Nghỉ ngơi tái tạo năng lượng sau dự án',
    'Tham gia sự kiện hỷ sự của bạn thân/người thân',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('leaveType', leaveType);
      formData.append('leaveUnit', leaveUnit);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('reason', reason);
      if (file) {
        formData.append('file', file);
      }

      const res = await api.post('/leave/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormSuccess(res.data.message || 'Tạo đơn xin nghỉ phép thành công!');
      setReason('');
      setFile(null);
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể tạo đơn nghỉ phép. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // BR-11: Rút đơn trực tiếp khi đang chờ duyệt
  const handleRecallRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn Rút đơn xin nghỉ phép này không?')) return;
    try {
      await api.delete(`/leave/request/${id}/recall`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể rút đơn.');
    }
  };

  // FR-09 & BR-11: Gửi yêu cầu hủy đơn đã duyệt
  const handleOpenCancelRequestModal = (req: LeaveRequest) => {
    setCancelModalRequest(req);
    setCancelReasonInput('');
    setCancelModalError(null);
  };

  const handleConfirmRequestCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalRequest) return;
    setCancelModalError(null);
    setCancelSubmitting(true);

    try {
      await api.post(`/leave/request/${cancelModalRequest.id}/request-cancel`, {
        cancelReason: cancelReasonInput,
      });
      setCancelModalRequest(null);
      fetchDashboardData();
    } catch (err: any) {
      setCancelModalError(err.response?.data?.message || 'Không thể yêu cầu hủy đơn.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleOpenEdit = (req: LeaveRequest) => {
    setEditingRequest(req);
    setEditReason(req.reason);
    setEditFile(null);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setEditError(null);

    try {
      const formData = new FormData();
      formData.append('reason', editReason);
      if (editFile) {
        formData.append('file', editFile);
      }

      await api.put(`/leave/request/${editingRequest.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditingRequest(null);
      fetchDashboardData();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Không thể cập nhật đơn.');
    }
  };

  // BR-08: Ràng buộc chứng từ y tế: Nghỉ ốm < 2 ngày là tùy chọn; >= 2 ngày là BẮT BUỘC
  const isSickLeaveRequiringCert =
    leaveType === 'SICK' && calculatedDays !== null && calculatedDays >= 2.0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* 1. THÔNG BÁO DÀNH CHO NHÂN VIÊN THỬ VIỆC (BR-02) */}
      {isProbation && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold">Chế độ Nhân sự Thử việc (Probationary Constraints - BR-02):</p>
            <p className="mt-0.5 text-amber-700">
              Bạn đang trong thời gian thử việc nên chỉ được phép xin <strong>"Nghỉ không hưởng lương" (Unpaid Leave)</strong>.
              Quỹ phép năm sẽ bắt đầu được tích lũy định kỳ (+1 ngày/tháng) ngay khi ký hợp đồng chính thức.
            </p>
          </div>
        </div>
      )}

      {/* 2. THẺ SỐ DƯ QUỸ PHÉP & THÂM NIÊN (FR-03 & FR-04 & BR-01) */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cổng Quản lý Nghỉ phép Cá nhân
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tra cứu số dư, tạo đơn xin nghỉ theo quy chuẩn 4-Clicks và theo dõi lịch phòng ban
            </p>
          </div>
          {balance && balance.seniorityYears > 0 && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Thâm niên {balance.seniorityYears} năm (+{Math.floor(balance.seniorityYears / 3)} ngày phép thưởng)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Quỹ phép năm cấp</p>
              <p className="text-2xl font-bold text-slate-900">
                {balance?.totalQuota.toFixed(1)} <span className="text-xs font-normal text-slate-500">ngày</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phép tồn năm cũ (Hạn 31/03)</p>
              <p className="text-2xl font-bold text-indigo-700">
                {balance?.previousYearQuota ? balance.previousYearQuota.toFixed(1) : '0.0'}{' '}
                <span className="text-xs font-normal text-slate-500">ngày</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Đã sử dụng (Đã duyệt)</p>
              <p className="text-2xl font-bold text-amber-600">
                {balance?.usedDays.toFixed(1)} <span className="text-xs font-normal text-slate-500">ngày</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Số phép khả dụng còn lại</p>
              <p className="text-2xl font-bold text-emerald-600">
                {/* [SEEDED_BUG: BUG-06 (LOW)] - Dùng Math.floor làm tròn cắt cụt phần thập phân (12.5 ngày hiển thị thành 12 ngày) */}
                {balance ? Math.floor(balance.remainingDays) : '0'} <span className="text-xs font-normal text-slate-500">ngày</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 3. FORM TẠO ĐƠN NGHỈ PHÉP (4-CLICKS UX) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-20">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Send className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Tạo đơn xin nghỉ phép</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">
              Tối đa 4 clicks
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Click 1: Khoảng ngày */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Khoảng ngày nghỉ *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Từ ngày</span>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Đến ngày</span>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Click 2: Hình thức & Đơn vị nghỉ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Hình thức *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {isProbation ? (
                    <>
                      {/* [SEEDED_BUG: BUG-03 (MEDIUM)] - Form cho phép nhân viên thử việc chọn "Cưới / Tang (Có lương)", vi phạm BR-02 */}
                      <option value="UNPAID">Nghỉ không hưởng lương (Thử việc)</option>
                      <option value="WEDDING_BEREAVEMENT">Cưới / Tang (Có lương)</option>
                    </>
                  ) : (
                    <>
                      <option value="ANNUAL">Phép năm (Có lương)</option>
                      <option value="SICK">Nghỉ ốm đau</option>
                      <option value="UNPAID">Nghỉ không hưởng lương</option>
                      <option value="WEDDING_BEREAVEMENT">Cưới / Tang (Có lương)</option>
                      <option value="MATERNITY">Nghỉ thai sản</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đơn vị nghỉ *
                </label>
                <select
                  value={leaveUnit}
                  onChange={(e) => setLeaveUnit(e.target.value as LeaveUnit)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="FULL_DAY">Cả ngày (1.0)</option>
                  <option value="MORNING">Nửa ngày sáng (0.5)</option>
                  <option value="AFTERNOON">Nửa ngày chiều (0.5)</option>
                </select>
              </div>
            </div>

            {/* Số ngày làm việc thực tế tính toán (Trừ T7, CN và Lễ/Tết - BR-05) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Số ngày thực tế trừ quỹ phép:</span>
              <span className="font-extrabold text-blue-700 text-sm">
                {calculatedDays !== null ? `${calculatedDays.toFixed(1)} ngày làm việc` : '--'}
              </span>
            </div>

            {/* Click 3: Lý do xin nghỉ & Gợi ý nhanh */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Lý do xin nghỉ * (Tối thiểu 10 ký tự)
              </label>
              <textarea
                required
                rows={3}
                minLength={10}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Nhập lý do chi tiết..."
              />
              {/* Chips gợi ý nhanh */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium self-center">Gợi ý nhanh:</span>
                {quickReasons.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-full text-[11px] transition text-left"
                  >
                    + {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Đính kèm chứng từ y tế (BR-08) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Chứng từ y tế {isSickLeaveRequiringCert ? <span className="text-rose-600 font-bold">* (Bắt buộc $\ge 2$ ngày)</span> : <span className="text-slate-400 font-normal">(Tùy chọn)</span>}
              </label>
              <div className="relative border border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-blue-400 transition bg-slate-50/50">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-600">
                    {file ? file.name : 'Chọn file (.pdf, .jpg, .png) $\\le 5.0$ MB'}
                  </span>
                </div>
              </div>
              {isSickLeaveRequiringCert && (
                <p className="mt-1 text-[11px] text-rose-600">
                  Quy tắc BR-08: Nghỉ ốm đau từ 2.0 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế.
                </p>
              )}
            </div>

            {/* Click 4: Nút Nộp đơn */}
            {/* [SEEDED_BUG: BUG-12] [MEDIUM] - Race Condition / Double Submission do thiếu disabled/debounce (Ngoài SRS) */}
            {/* Lỗi: Nút không bị vô hiệu hóa khi đang submitting, cho phép người dùng click đúp gửi 2 request song song tạo 2 đơn trùng nhau */}
            <button
              type="submit"
              /* disabled={submitting} */
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi...' : 'Nộp đơn xin nghỉ phép (Hoàn tất)'}</span>
            </button>
          </form>
        </div>

        {/* 4. VÙNG TABS: LỊCH SỬ ĐƠN HOẶC LỊCH PHÒNG BAN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('MY_REQUESTS')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'MY_REQUESTS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Lịch sử đơn của tôi ({requests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TEAM_CALENDAR')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'TEAM_CALENDAR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch vắng mặt phòng ban (4 màu)</span>
            </button>
          </div>

          {activeTab === 'TEAM_CALENDAR' ? (
            <TeamCalendar
              initialDepartment={user?.department || 'ALL'}
              onSelectDate={(dateStr) => {
                setStartDate(dateStr);
                setEndDate(dateStr);
              }}
            />
          ) : (
            /* BẢNG THEO DÕI ĐƠN CÁ NHÂN */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Tiến trình phê duyệt & Lịch sử
                </span>
                <span className="text-xs text-slate-500">
                  Tự động cập nhật thời gian thực
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Bạn chưa tạo đơn xin nghỉ phép nào trong hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                        <th className="py-3 px-4">Loại phép / Đơn vị</th>
                        <th className="py-3 px-4">Thời gian nghỉ</th>
                        <th className="py-3 px-4">Số ngày</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{LEAVE_TYPE_LABELS[req.leaveType]}</div>
                            <div className="text-xs text-slate-500">{LEAVE_UNIT_LABELS[req.leaveUnit]}</div>
                            {req.approvalLevel === 2 && (
                              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 font-semibold rounded">
                                Đơn $\ge 3$ ngày (Cần 2 cấp duyệt)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-medium">
                              {format(new Date(req.startDate), 'dd/MM/yyyy')} - {format(new Date(req.endDate), 'dd/MM/yyyy')}
                            </div>
                            {/* [SEEDED_BUG: BUG-13] [LOW] - UI Table Layout Overflow khi nhập chuỗi dài không khoảng cách (Ngoài SRS) */}
                            {/* Lỗi: Không áp dụng truncate/break-words, chuỗi dài không khoảng trắng sẽ làm tràn bảng và đẩy mất cột Thao tác */}
                            <div className="text-xs text-slate-500 whitespace-nowrap overflow-visible" title={req.reason}>
                              {req.reason}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-blue-700">
                            {req.workingDays.toFixed(1)} ngày
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={req.status} />
                            {req.status === 'REJECTED' && req.rejectReason && (
                              <div className="text-xs text-rose-600 mt-1" title={req.rejectReason}>
                                Lý do: {req.rejectReason}
                              </div>
                            )}
                            {req.isDelegated && (
                              <div className="text-[10px] text-purple-600 mt-0.5">
                                [Duyệt qua DoA]
                              </div>
                            )}
                            {req.attachmentUrl && (
                              <div className="mt-1">
                                <a
                                  href={`http://localhost:5000${req.attachmentUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 underline font-medium"
                                >
                                  Xem chứng từ y tế
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {/* Nút thao tác theo trạng thái đơn */}
                            {req.status === 'PENDING' || req.status === 'PENDING_DIRECTOR' ? (
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleOpenEdit(req)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Chỉnh sửa đơn"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRecallRequest(req.id)}
                                  className="inline-flex items-center px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
                                  title="Rút đơn (Recall - BR-11)"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  <span>Rút đơn</span>
                                </button>
                              </div>
                            ) : req.status === 'APPROVED' ? (
                              <button
                                onClick={() => handleOpenCancelRequestModal(req)}
                                className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
                                title="Yêu cầu hủy phép đã duyệt (FR-09)"
                              >
                                <Undo2 className="w-3.5 h-3.5 mr-1" />
                                <span>Yêu cầu hủy</span>
                              </button>
                            ) : req.status === 'CANCEL_REQUESTED' ? (
                              <span className="text-xs text-orange-600 font-semibold italic">
                                Chờ QL xác nhận hủy
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Đã đóng</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL YÊU CẦU HỦY ĐƠN ĐÃ DUYỆT (FR-09 & BR-11) */}
      {cancelModalRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Yêu cầu hủy đơn đã duyệt</h3>
              <button onClick={() => setCancelModalRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Theo quy tắc <strong>BR-11 & FR-09</strong>: Đơn đã phê duyệt khi muốn hủy cần gửi yêu cầu để Quản lý trực tiếp xác nhận, sau đó số ngày phép mới được hoàn trả vào quỹ.
            </p>

            {cancelModalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {cancelModalError}
              </div>
            )}

            <form onSubmit={handleConfirmRequestCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do yêu cầu hủy đơn *
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={5}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Ví dụ: Kế hoạch gia đình bị hoãn do bận công tác đột xuất..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {cancelSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hủy đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA ĐƠN KHI PENDING (BR-08) */}
      {editingRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Chỉnh sửa đơn xin nghỉ phép</h3>
              <button onClick={() => setEditingRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cập nhật lý do *</label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cập nhật tệp chứng từ</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
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
