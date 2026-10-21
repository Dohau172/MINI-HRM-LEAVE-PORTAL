import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  LeaveRequest,
  LeaveStatus,
  Delegation,
  LEAVE_TYPE_LABELS,
  LEAVE_UNIT_LABELS,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TeamCalendar } from '../components/TeamCalendar';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  Check,
  X,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Paperclip,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Users,
  UserCheck,
  Calendar,
  Undo2,
  Send,
  Trash2,
  Bell,
  Sparkles,
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [potentialDelegatees, setPotentialDelegatees] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED'>('LIST');
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'CALENDAR' | 'DELEGATIONS'>('REQUESTS');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Từ chối (Reject)
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Xác nhận Hủy đơn (Confirm Cancel Request - BR-11)
  const [confirmCancelModalReq, setConfirmCancelModalReq] = useState<LeaveRequest | null>(null);

  // Modal Thiết lập Ủy quyền DoA (FR-06 & BR-10)
  const [showDoAModal, setShowDoAModal] = useState(false);
  const [doaDelegateeId, setDoaDelegateeId] = useState('');
  const [doaStartDate, setDoaStartDate] = useState('');
  const [doaEndDate, setDoaEndDate] = useState('');
  const [doaReason, setDoaReason] = useState('');
  const [doaError, setDoaError] = useState<string | null>(null);
  const [doaSuccess, setDoaSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const url =
        filterStatus === 'ALL'
          ? '/leave/manager/requests'
          : `/leave/manager/requests?status=${filterStatus}`;
      const [reqRes, delRes, potRes] = await Promise.all([
        api.get(url),
        api.get('/leave/delegations'),
        api.get('/leave/potential-delegatees'),
      ]);
      setRequests(reqRes.data);
      setDelegations(delRes.data);
      setPotentialDelegatees(potRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterStatus]);

  // Danh sách phòng ban
  const departments = useMemo(() => {
    const defaultDepts = ['Kỹ thuật', 'Nhân sự', 'Kinh doanh', 'Kế toán'];
    const dynamicDepts = requests
      .map((r) => r.user?.department)
      .filter((dept): dept is string => Boolean(dept));
    return Array.from(new Set([...defaultDepts, ...dynamicDepts]));
  }, [requests]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING' || r.status === 'PENDING_DIRECTOR').length,
      pendingCancel: requests.filter((r) => r.status === 'CANCEL_REQUESTED').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };
  }, [requests]);

  // Lọc dữ liệu theo Từ khóa và Phòng ban
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (selectedDepartment !== 'ALL' && req.user?.department !== selectedDepartment) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = req.user?.fullName.toLowerCase().includes(query);
        const emailMatch = req.user?.email.toLowerCase().includes(query);
        const deptMatch = req.user?.department.toLowerCase().includes(query);
        const reasonMatch = req.reason.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !deptMatch && !reasonMatch) {
          return false;
        }
      }
      return true;
    });
  }, [requests, selectedDepartment, searchQuery]);

  // Nhóm theo phòng ban khi ở chế độ GROUPED
  const groupedByDepartment = useMemo(() => {
    const groups: Record<string, LeaveRequest[]> = {};
    filteredRequests.forEach((req) => {
      const dept = req.user?.department || 'Khác';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(req);
    });
    return groups;
  }, [filteredRequests]);

  // Phê duyệt đơn (Level 1 hoặc Level 2)
  const handleApprove = async (req: LeaveRequest) => {
    const isLevel2 = req.approvalLevel === 2 && req.status === 'PENDING';
    const msg = isLevel2
      ? `Đơn này có thời lượng $\\ge 3$ ngày. Xác nhận phê duyệt Cấp 1 để chuyển tiếp lên Giám đốc bộ phận phê duyệt Cấp 2?`
      : `Xác nhận phê duyệt đơn nghỉ phép của nhân viên: ${req.user?.fullName}?`;

    if (!window.confirm(msg)) return;

    try {
      setActionLoading(true);
      const res = await api.patch(`/leave/manager/request/${req.id}/approve`);
      alert(res.data.message || 'Phê duyệt thành công!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể phê duyệt đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mở modal từ chối
  const handleOpenReject = (req: LeaveRequest) => {
    setRejectingRequest(req);
    setRejectReason('');
    setRejectError(null);
  };

  // Xác nhận từ chối (Lý do $\ge 10$ ký tự theo BR-12)
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    setRejectError(null);

    if (rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối bắt buộc phải có tối thiểu 10 ký tự (theo BR-12).');
      return;
    }

    try {
      setActionLoading(true);
      await api.patch(`/leave/manager/request/${rejectingRequest.id}/reject`, {
        rejectReason,
      });
      setRejectingRequest(null);
      fetchDashboardData();
    } catch (err: any) {
      setRejectError(err.response?.data?.message || 'Không thể từ chối đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // Xác nhận hoặc Bác bỏ Yêu cầu Hủy đơn đã duyệt (BR-11)
  const handleConfirmCancelAction = async (req: LeaveRequest, approve: boolean) => {
    const confirmMsg = approve
      ? `Xác nhận CHẤP THUẬN hủy đơn nghỉ phép của ${req.user?.fullName}? (Số ngày phép sẽ được hoàn trả lại quỹ)`
      : `Xác nhận BÁC BỎ yêu cầu hủy đơn? (Đơn vẫn giữ nguyên trạng thái Đã duyệt)`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const res = await api.patch(`/leave/manager/request/${req.id}/confirm-cancel`, {
        approve,
      });
      alert(res.data.message || 'Xử lý yêu cầu hủy thành công!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xử lý yêu cầu hủy.');
    } finally {
      setActionLoading(false);
    }
  };

  // Thiết lập Ủy quyền Duyệt đơn (DoA - FR-06 & BR-10)
  const handleCreateDoA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoaError(null);
    setDoaSuccess(null);

    try {
      setActionLoading(true);
      const res = await api.post('/leave/delegations', {
        delegateeId: doaDelegateeId,
        startDate: doaStartDate,
        endDate: doaEndDate,
        reason: doaReason,
      });
      setDoaSuccess(res.data.message || 'Thiết lập ủy quyền DoA thành công!');
      setDoaReason('');
      fetchDashboardData();
      setTimeout(() => setShowDoAModal(false), 2000);
    } catch (err: any) {
      setDoaError(err.response?.data?.message || 'Không thể thiết lập ủy quyền.');
    } finally {
      setActionLoading(false);
    }
  };

  // Thu hồi ủy quyền sớm
  const handleRevokeDoA = async (id: string) => {
    if (!window.confirm('Xác nhận thu hồi ủy quyền này sớm? Quyền duyệt và luồng thông báo sẽ hoàn trả về cho bạn.')) return;
    try {
      await api.patch(`/leave/delegations/${id}/revoke`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thu hồi ủy quyền.');
    }
  };

  const renderRequestTable = (items: LeaveRequest[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
            <th className="py-3 px-4">Nhân sự / Phòng ban</th>
            <th className="py-3 px-4">Loại phép & Đơn vị</th>
            <th className="py-3 px-4">Thời gian nghỉ</th>
            <th className="py-3 px-4">Số ngày</th>
            <th className="py-3 px-4">Lý do giải trình</th>
            <th className="py-3 px-4">Trạng thái</th>
            <th className="py-3 px-4 text-center">Thao tác duyệt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((req) => (
            <tr key={req.id} className="hover:bg-slate-50/80 transition">
              <td className="py-3 px-4">
                <div className="font-bold text-slate-900">{req.user?.fullName}</div>
                <div className="text-xs text-slate-500">{req.user?.email}</div>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full">
                    Phòng {req.user?.department}
                  </span>
                  {req.user?.contractType === 'PROBATION' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">
                      Thử việc
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="font-semibold text-slate-800">{LEAVE_TYPE_LABELS[req.leaveType]}</div>
                <div className="text-xs text-slate-500">{LEAVE_UNIT_LABELS[req.leaveUnit]}</div>
                {req.approvalLevel === 2 && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 font-bold rounded">
                    Đơn $\ge 3$ ngày (2 cấp)
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-slate-800">
                  {format(new Date(req.startDate), 'dd/MM/yyyy')} - {format(new Date(req.endDate), 'dd/MM/yyyy')}
                </div>
              </td>
              <td className="py-3 px-4 font-bold text-purple-700">
                {req.workingDays.toFixed(1)} ngày
              </td>
              <td className="py-3 px-4 max-w-xs">
                <div className="text-xs text-slate-700">{req.reason}</div>
                {req.attachmentUrl && (
                  <div className="mt-1 flex items-center space-x-1">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <a
                      href={`http://localhost:5000${req.attachmentUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-semibold hover:text-blue-800"
                    >
                      Chứng từ y tế đính kèm
                    </a>
                  </div>
                )}
                {req.cancelReason && (
                  <div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                    <strong>Yêu cầu hủy:</strong> {req.cancelReason}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={req.status} />
                {req.isDelegated && (
                  <div className="text-[10px] text-purple-600 font-semibold mt-1">
                    [Ủy quyền DoA]
                  </div>
                )}
                {req.delegationNote && (
                  <div className="text-[10px] text-slate-500 mt-0.5" title={req.delegationNote}>
                    {req.delegationNote}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {/* 1. Xử lý đơn Chờ duyệt (PENDING hoặc PENDING_DIRECTOR) */}
                {req.status === 'PENDING' || req.status === 'PENDING_DIRECTOR' ? (
                  <div className="flex items-center justify-center space-x-1.5">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={actionLoading}
                      className="inline-flex items-center px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      title={req.status === 'PENDING_DIRECTOR' ? 'Giám đốc duyệt Cấp 2' : 'Duyệt đơn này'}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>{req.status === 'PENDING_DIRECTOR' ? 'GĐ Duyệt' : 'Duyệt'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenReject(req)}
                      disabled={actionLoading}
                      className="inline-flex items-center px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      title="Từ chối đơn này"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                ) : req.status === 'CANCEL_REQUESTED' ? (
                  /* 2. Xử lý yêu cầu hủy đơn đã duyệt (BR-11) */
                  <div className="flex items-center justify-center space-x-1.5">
                    <button
                      onClick={() => handleConfirmCancelAction(req, true)}
                      disabled={actionLoading}
                      className="inline-flex items-center px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      title="Đồng ý hủy đơn và hoàn trả ngày phép"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Chấp thuận hủy</span>
                    </button>
                    <button
                      onClick={() => handleConfirmCancelAction(req, false)}
                      disabled={actionLoading}
                      className="inline-flex items-center px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      title="Bác bỏ yêu cầu hủy"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Bác bỏ</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Đã xử lý</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* 1. HEADER & TIÊU ĐỀ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <span>Cổng Quản lý & Phê duyệt Nghỉ phép</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xét duyệt luồng đa cấp, quản lý ủy quyền DoA và giám sát lịch vắng mặt phòng ban
          </p>
        </div>

        {/* Nút Ủy quyền DoA & Chế độ xem */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => setShowDoAModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Thiết lập Ủy quyền (DoA)</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'LIST'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              onClick={() => setViewMode('GROUPED')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'GROUPED'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Phòng ban</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHỈ SỐ THỐNG KÊ NHANH */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng đơn</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Chờ duyệt (Pending)</p>
            <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
            <Undo2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Chờ hủy duyệt</p>
            <p className="text-xl font-bold text-orange-600">{stats.pendingCancel}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đã duyệt</p>
            <p className="text-xl font-bold text-emerald-600">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đã từ chối</p>
            <p className="text-xl font-bold text-rose-600">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* 3. TABS CHÍNH: DANH SÁCH ĐƠN / LỊCH TRỰC QUAN / LỊCH SỬ ỦY QUYỀN */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'REQUESTS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Danh sách hàng đợi duyệt ({filteredRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'CALENDAR'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch phòng ban trực quan</span>
        </button>

        <button
          onClick={() => setActiveTab('DELEGATIONS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'DELEGATIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Ủy quyền của tôi ({delegations.length})</span>
        </button>
      </div>

      {/* 4. NỘI DUNG TABS */}
      {activeTab === 'CALENDAR' ? (
        <TeamCalendar initialDepartment="ALL" />
      ) : activeTab === 'DELEGATIONS' ? (
        /* TAB QUẢN LÝ ỦY QUYỀN (DoA) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Danh sách Ủy quyền Phê duyệt (Delegation of Authority - DoA)
              </h3>
              <p className="text-xs text-slate-500">
                Khi kích hoạt DoA, toàn bộ thông báo đơn mới từ cấp dưới sẽ tự động chuyển hướng đến người nhận ủy quyền (FR-06 & BR-10).
              </p>
            </div>
            <button
              onClick={() => setShowDoAModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              + Tạo ủy quyền mới
            </button>
          </div>

          {delegations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Bạn chưa có thiết lập ủy quyền nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-3 px-4">Người ủy quyền</th>
                    <th className="py-3 px-4">Người nhận ủy quyền</th>
                    <th className="py-3 px-4">Thời gian hiệu lực</th>
                    <th className="py-3 px-4">Lý do</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {delegations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {d.delegator?.fullName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {d.delegatee?.fullName} ({d.delegatee?.position})
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {format(new Date(d.startDate), 'dd/MM/yyyy')} - {format(new Date(d.endDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">{d.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            d.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {d.isActive ? 'Đang hiệu lực' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {d.isActive && d.delegatorId === user?.id && (
                          <button
                            onClick={() => handleRevokeDoA(d.id)}
                            className="text-xs text-rose-600 font-semibold hover:underline"
                          >
                            Thu hồi sớm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB DANH SÁCH ĐƠN DUYỆT */
        <>
          {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên nhân sự, email, lý do..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="md:col-span-3 flex items-center space-x-2">
                <div className="flex items-center text-slate-500 text-xs font-semibold flex-shrink-0">
                  <Building2 className="w-4 h-4 mr-1 text-blue-600" />
                  Phòng ban:
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      Phòng {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 flex justify-start md:justify-end items-center space-x-1 flex-wrap">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterStatus === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({stats.total})
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterStatus === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Chờ duyệt ({stats.pending})
                </button>
                <button
                  onClick={() => setFilterStatus('CANCEL_REQUESTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterStatus === 'CANCEL_REQUESTED'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Chờ hủy ({stats.pendingCancel})
                </button>
              </div>
            </div>
          </div>

          {/* VÙNG BẢNG DỮ LIỆU */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 text-sm">
              Không có đơn nghỉ phép nào khớp với bộ lọc hiện tại.
            </div>
          ) : viewMode === 'LIST' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {renderRequestTable(filteredRequests)}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDepartment).map(([deptName, items]) => (
                <div key={deptName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h2 className="font-bold text-slate-900 text-base">Phòng {deptName}</h2>
                    </div>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                      {items.length} đơn
                    </span>
                  </div>
                  {renderRequestTable(items)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 5. MODAL THIẾT LẬP ỦY QUYỀN DoA (FR-06 & BR-10) */}
      {showDoAModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Thiết lập Ủy quyền Duyệt (DoA)</h3>
              </div>
              <button onClick={() => setShowDoAModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-xs text-blue-800 space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Cơ chế Chuyển hướng Thông báo DoA (BR-10):</span>
              </p>
              <p>
                Hệ thống sẽ tự động phát email thông báo tức thì cho Người được ủy quyền. Trong suốt khoảng thời gian này, mọi thông báo <em>"Có đơn mới"</em> từ cấp dưới của bạn sẽ chuyển hướng trực tiếp đến họ.
              </p>
            </div>

            {doaError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {doaError}
              </div>
            )}
            {doaSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                {doaSuccess}
              </div>
            )}

            <form onSubmit={handleCreateDoA} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Người được ủy quyền (Cùng cấp hoặc cấp phó) *
                </label>
                <select
                  required
                  value={doaDelegateeId}
                  onChange={(e) => setDoaDelegateeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Chọn nhân sự nhận ủy quyền --</option>
                  {potentialDelegatees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} - {p.position} (Phòng {p.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Từ ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={doaStartDate}
                    onChange={(e) => setDoaStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Đến ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={doaEndDate}
                    onChange={(e) => setDoaEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do ủy quyền *
                </label>
                <textarea
                  required
                  rows={2}
                  minLength={5}
                  value={doaReason}
                  onChange={(e) => setDoaReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ví dụ: Đi công tác dài ngày tại chi nhánh miền Trung..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDoAModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Đang lưu...' : 'Kích hoạt Ủy quyền DoA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL TỪ CHỐI ĐƠN (BR-12) */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Từ chối đơn xin nghỉ phép</h3>
              <button onClick={() => setRejectingRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p><strong>Nhân sự:</strong> {rejectingRequest.user?.fullName}</p>
              <p><strong>Thời gian:</strong> {format(new Date(rejectingRequest.startDate), 'dd/MM/yyyy')} - {format(new Date(rejectingRequest.endDate), 'dd/MM/yyyy')} ({rejectingRequest.workingDays.toFixed(1)} ngày)</p>
            </div>

            {rejectError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lý do từ chối * (Tối thiểu 10 ký tự theo BR-12)
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="Ví dụ: Đợt cao điểm phát hành phiên bản hệ thống, yêu cầu trực on-call..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
