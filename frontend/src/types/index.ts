export type Role = 'EMPLOYEE' | 'MANAGER' | 'DIRECTOR' | 'HR' | 'ADMIN';

export type ContractType = 'PROBATION' | 'OFFICIAL';

export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY' | 'WEDDING_BEREAVEMENT';

export type LeaveUnit = 'FULL_DAY' | 'MORNING' | 'AFTERNOON';

export type LeaveStatus =
  | 'PENDING'
  | 'PENDING_DIRECTOR'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  contractType: ContractType;
  position: string;
  department: string;
  canApprove: boolean;
  annualLeaveQuota: number;
  previousYearQuota: number;
  seniorityYears: number;
}

export interface LeaveBalance {
  totalQuota: number;
  previousYearQuota: number;
  isPreviousQuotaValid: boolean;
  usedDays: number;
  remainingDays: number;
  contractType: ContractType;
  seniorityYears: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    department: string;
    position?: string;
    contractType?: ContractType;
  };
  leaveType: LeaveType;
  leaveUnit: LeaveUnit;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  attachmentUrl?: string | null;
  status: LeaveStatus;
  rejectReason?: string | null;
  approvalLevel: number;
  approvedBy?: {
    id?: string;
    fullName: string;
    position?: string;
  } | null;
  isDelegated: boolean;
  delegationNote?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  description?: string | null;
}

export interface Delegation {
  id: string;
  delegatorId: string;
  delegateeId: string;
  delegator?: {
    fullName: string;
    position: string;
    department: string;
  };
  delegatee?: {
    fullName: string;
    position: string;
    department: string;
    email?: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  admin: {
    fullName: string;
    email: string;
  };
  targetUserId: string;
  targetUser: {
    fullName: string;
    email: string;
    department: string;
  };
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  monthYear: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
}

export interface PayrollEmployeeSummary {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  contractType: ContractType;
  standardWorkingDays: number;
  paidAnnualDays: number;
  unpaidDays: number;
  sickDays: number;
  otherPaidDays: number;
  totalAbsenceDays: number;
  actualWorkingDays: number;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Phép năm (Có lương)',
  SICK: 'Nghỉ ốm đau',
  UNPAID: 'Nghỉ không hưởng lương',
  MATERNITY: 'Nghỉ thai sản',
  WEDDING_BEREAVEMENT: 'Cưới / Tang (Có lương)',
};

export const LEAVE_UNIT_LABELS: Record<LeaveUnit, string> = {
  FULL_DAY: 'Cả ngày (1.0)',
  MORNING: 'Nửa ngày sáng (0.5)',
  AFTERNOON: 'Nửa ngày chiều (0.5)',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'CHỜ DUYỆT (Cấp 1)',
  PENDING_DIRECTOR: 'CHỜ GĐ DUYỆT (Cấp 2)',
  APPROVED: 'ĐÃ DUYỆT',
  REJECTED: 'ĐÃ TỪ CHỐI',
  CANCEL_REQUESTED: 'CHỜ HỦY DUYỆT',
  CANCELLED: 'ĐÃ HỦY',
};

export interface SsoConfig {
  googleEnabled: boolean;
  googleClientId: string;
  microsoftEnabled: boolean;
  microsoftTenantId: string;
  enforceMfa: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  systemHealth?: {
    dbStatus: string;
    uptime: string;
    auditTrailStatus: string;
    activeSessions: number;
  };
}

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: 'Nhân viên',
  MANAGER: 'Quản lý trực tiếp',
  DIRECTOR: 'Giám đốc bộ phận',
  HR: 'HR Manager (Quản trị nhân sự)',
  ADMIN: 'IT Admin (Quản trị kỹ thuật)',
};

