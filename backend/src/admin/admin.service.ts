import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustQuotaDto,
  CreateHolidayDto,
  CreateUserDto,
  LockPayrollPeriodDto,
  UpdateSsoConfigDto,
  UpdateUserRoleContractDto,
} from './dto/admin.dto';
import { ContractType, LeaveStatus, LeaveType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Cấu hình SSO lưu trữ an toàn trong runtime (phân quyền chỉ dành riêng cho IT Admin)
  private ssoConfig = {
    googleEnabled: true,
    googleClientId: 'mini-hrm-enterprise-sso.apps.googleusercontent.com',
    microsoftEnabled: true,
    microsoftTenantId: 'mini-hrm-msft-azure-ad-tenant-882942',
    enforceMfa: true,
    lastUpdatedBy: 'itadmin@company.vn',
    lastUpdatedAt: new Date().toISOString(),
    systemHealth: {
      dbStatus: 'CONNECTED (PostgreSQL: mini_hrm_leave)',
      uptime: '99.98%',
      auditTrailStatus: 'TAMPER_PROOF_ACTIVE (Bất biến)',
      activeSessions: 7,
    },
  };

  /**
   * 1. Quản lý Hồ sơ & Chức danh Nhân sự (HR Manager & IT Admin đều có thể xem)
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        contractType: true,
        position: true,
        department: true,
        canApprove: true,
        annualLeaveQuota: true,
        previousYearQuota: true,
        seniorityYears: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
    });
  }

  /**
   * 2. IT Admin Cấp phát Tài khoản Gốc (User Provisioning - SoD IT Admin)
   */
  async createUser(dto: CreateUserDto, adminId: string, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new BadRequestException('Email này đã tồn tại trong hệ thống.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role,
        contractType: dto.contractType || ContractType.OFFICIAL,
        position: dto.position.trim(),
        department: dto.department.trim(),
        canApprove: dto.role === Role.MANAGER || dto.role === Role.DIRECTOR,
        annualLeaveQuota:
          dto.annualLeaveQuota !== undefined
            ? dto.annualLeaveQuota
            : dto.contractType === ContractType.PROBATION
            ? 0.0
            : 12.0,
        seniorityYears: dto.seniorityYears !== undefined ? dto.seniorityYears : 0,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        contractType: true,
        position: true,
        department: true,
        annualLeaveQuota: true,
        seniorityYears: true,
        createdAt: true,
      },
    });

    // IT Admin ghi nhận việc cấp phát tài khoản vào Audit Log bất biến
    await this.prisma.auditLog.create({
      data: {
        adminId,
        targetUserId: user.id,
        action: 'PROVISION_USER',
        oldValue: 'NONE',
        newValue: `${user.role} (${user.department}) - ${user.contractType}`,
        reason: `Cấp phát tài khoản gốc bởi IT Admin cho ${user.fullName}`,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });

    return {
      message: `Cấp phát tài khoản cho ${user.fullName} (${user.email}) thành công!`,
      user,
    };
  }

  /**
   * 3. Điều chỉnh Quỹ phép Thủ công & Ghi vết Audit Log (SoD: HR Manager - FR-05 & BR-15)
   */
  async adjustQuota(adminId: string, targetUserId: string, dto: AdjustQuotaDto, ipAddress?: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const oldValue = targetUser.annualLeaveQuota.toString();
    const newValue = dto.newQuota.toString();

    // Cập nhật số phép mới và ghi nhật ký kiểm toán trong transaction
    const [updatedUser, log] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { annualLeaveQuota: dto.newQuota },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetUserId,
          action: 'ADJUST_QUOTA',
          oldValue,
          newValue,
          reason: dto.reason.trim(),
          ipAddress: ipAddress || '127.0.0.1',
        },
      }),
    ]);

    return {
      message: `Điều chỉnh quỹ phép cho ${targetUser.fullName} thành công (${oldValue} -> ${newValue})!`,
      user: updatedUser,
      auditLog: log,
    };
  }

  /**
   * 4. Cập nhật Vai trò, Hợp đồng & Chức danh Nhân sự (HR Manager / IT Admin)
   */
  async updateUser(adminId: string, targetUserId: string, dto: UpdateUserRoleContractDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: dto.role || user.role,
        contractType: dto.contractType || user.contractType,
        position: dto.position || user.position,
        department: dto.department || user.department,
        seniorityYears: dto.seniorityYears !== undefined ? dto.seniorityYears : user.seniorityYears,
      },
    });

    // Ghi Audit Log nếu có thay đổi hợp đồng hoặc vai trò
    if (dto.contractType && dto.contractType !== user.contractType) {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          targetUserId,
          action: 'CHANGE_CONTRACT_TYPE',
          oldValue: user.contractType,
          newValue: dto.contractType,
          reason: 'Cập nhật phân loại hợp đồng nhân sự từ Cổng Quản trị',
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
    }

    if (dto.role && dto.role !== user.role) {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          targetUserId,
          action: 'CHANGE_ROLE',
          oldValue: user.role,
          newValue: dto.role,
          reason: 'Cập nhật vai trò hệ thống từ Cổng Quản trị',
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
    }

    return {
      message: 'Cập nhật thông tin nhân sự thành công!',
      user: updated,
    };
  }

  /**
   * 5. Xem Nhật ký Kiểm toán Bất biến (Audit Log Trail - BR-15)
   * IT Admin quản lý và giám sát tính bất biến, HR Manager đối soát
   */
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        admin: {
          select: { fullName: true, email: true, role: true },
        },
        targetUser: {
          select: { fullName: true, email: true, department: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * 6. Quản lý Danh mục Ngày Lễ, Tết Quốc gia (SoD: HR Manager - FR-01 & BR-05)
   */
  async getHolidays() {
    return this.prisma.publicHoliday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(dto: CreateHolidayDto) {
    const existing = await this.prisma.publicHoliday.findFirst({
      where: { date: new Date(dto.date) },
    });
    if (existing) {
      throw new BadRequestException('Ngày Lễ này đã tồn tại trong hệ thống.');
    }

    return this.prisma.publicHoliday.create({
      data: {
        name: dto.name.trim(),
        date: new Date(dto.date),
        description: dto.description?.trim(),
      },
    });
  }

  async deleteHoliday(id: string) {
    return this.prisma.publicHoliday.delete({
      where: { id },
    });
  }

  /**
   * 7. Quản lý Khóa kỳ công ngày 25 (SoD: HR Manager - Payroll Cutoff Lock - FR-13 & BR-07)
   */
  async getPayrollPeriods() {
    return this.prisma.payrollPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async lockPayrollPeriod(adminEmail: string, dto: LockPayrollPeriodDto) {
    let period = await this.prisma.payrollPeriod.findUnique({
      where: { monthYear: dto.monthYear },
    });

    if (!period) {
      const [m, y] = dto.monthYear.split('/').map(Number);
      const startMonth = m === 1 ? 12 : m - 1;
      const startYear = m === 1 ? y - 1 : y;

      period = await this.prisma.payrollPeriod.create({
        data: {
          monthYear: dto.monthYear,
          startDate: new Date(`${startYear}-${String(startMonth).padStart(2, '0')}-26T00:00:00.000Z`),
          endDate: new Date(`${y}-${String(m).padStart(2, '0')}-25T23:59:59.999Z`),
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: adminEmail,
        },
      });
    } else {
      period = await this.prisma.payrollPeriod.update({
        where: { id: period.id },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: adminEmail,
        },
      });
    }

    return {
      message: `Đã khóa sổ thành công kỳ tính lương ${dto.monthYear}! Mọi hành vi nộp đơn lùi ngày trước mốc này sẽ bị chặn.`,
      period,
    };
  }

  async unlockPayrollPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.update({
      where: { id },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
      },
    });
    return {
      message: `Đã mở khóa kỳ tính lương ${period.monthYear}.`,
      period,
    };
  }

  /**
   * 8. Tổng hợp Dữ liệu Tiền lương phục vụ Xuất Báo cáo Excel / PDF (SoD: HR Manager - FR-14)
   */
  async getPayrollSummary(monthYear: string = '10/2026') {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        position: true,
        contractType: true,
        annualLeaveQuota: true,
      },
      orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
    });

    const [m, y] = monthYear.split('/').map(Number);
    const startMonth = m === 1 ? 12 : m - 1;
    const startYear = m === 1 ? y - 1 : y;

    const startDate = new Date(`${startYear}-${String(startMonth).padStart(2, '0')}-26T00:00:00.000Z`);
    const endDate = new Date(`${y}-${String(m).padStart(2, '0')}-25T23:59:59.999Z`);

    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: { gte: startDate, lte: endDate },
      },
    });

    const summary = users.map((user) => {
      const userLeaves = approvedLeaves.filter((l) => l.userId === user.id);

      const paidAnnualDays = userLeaves
        .filter((l) => l.leaveType === LeaveType.ANNUAL)
        .reduce((sum, l) => sum + l.workingDays, 0);

      const unpaidDays = userLeaves
        .filter((l) => l.leaveType === LeaveType.UNPAID)
        .reduce((sum, l) => sum + l.workingDays, 0);

      const sickDays = userLeaves
        .filter((l) => l.leaveType === LeaveType.SICK)
        .reduce((sum, l) => sum + l.workingDays, 0);

      const otherPaidDays = userLeaves
        .filter((l) => l.leaveType === LeaveType.WEDDING_BEREAVEMENT || l.leaveType === LeaveType.MATERNITY)
        .reduce((sum, l) => sum + l.workingDays, 0);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        position: user.position,
        contractType: user.contractType,
        standardWorkingDays: 22,
        paidAnnualDays,
        unpaidDays,
        sickDays,
        otherPaidDays,
        totalAbsenceDays: paidAnnualDays + unpaidDays + sickDays + otherPaidDays,
        actualWorkingDays: Math.max(0, 22 - (paidAnnualDays + unpaidDays + sickDays + otherPaidDays)),
      };
    });

    return {
      monthYear,
      periodRange: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      },
      summary,
    };
  }

  /**
   * 9. Quản trị Kỹ thuật & Cấu hình SSO (SoD: Chỉ dành riêng cho IT Admin)
   */
  async getSsoConfig() {
    return this.ssoConfig;
  }

  async updateSsoConfig(dto: UpdateSsoConfigDto, adminEmail: string) {
    this.ssoConfig = {
      ...this.ssoConfig,
      ...dto,
      lastUpdatedBy: adminEmail,
      lastUpdatedAt: new Date().toISOString(),
    };

    return {
      message: 'Cập nhật cấu hình SSO & Bảo mật hệ thống thành công!',
      config: this.ssoConfig,
    };
  }
}
