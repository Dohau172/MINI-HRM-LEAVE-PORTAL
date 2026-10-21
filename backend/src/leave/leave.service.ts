import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLeaveDto,
  EditLeaveDto,
  RejectLeaveDto,
  CalculateDaysDto,
  CreateDelegationDto,
  RequestCancelDto,
  ConfirmCancelDto,
} from './dto/leave.dto';
import { LeaveRulesUtil } from './leave-rules.util';
import { LeaveStatus, LeaveType, LeaveUnit, Role } from '@prisma/client';
import { startOfDay } from 'date-fns';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  /**
   * FR-04 & BR-01: Lấy thông tin số dư quỹ phép cá nhân (hỗ trợ phép tồn năm cũ đến 31/03)
   */
  async getLeaveBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        annualLeaveQuota: true,
        previousYearQuota: true,
        contractType: true,
        seniorityYears: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // Tính tổng số ngày phép năm đã được duyệt (APPROVED)
    const approvedAnnualLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        userId,
        leaveType: LeaveType.ANNUAL,
        status: LeaveStatus.APPROVED,
      },
    });

    const usedDays = approvedAnnualLeaves.reduce((sum, item) => sum + item.workingDays, 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const expiryDate = new Date(`${currentYear}-03-31T23:59:59.999Z`);
    const isPreviousQuotaValid = now.getTime() <= expiryDate.getTime();

    const totalAvailableGranted =
      user.annualLeaveQuota + (isPreviousQuotaValid ? user.previousYearQuota : 0);
    const remainingDays = Math.max(0, totalAvailableGranted - usedDays);

    return {
      totalQuota: user.annualLeaveQuota,
      previousYearQuota: user.previousYearQuota,
      isPreviousQuotaValid,
      usedDays,
      remainingDays,
      contractType: user.contractType,
      seniorityYears: user.seniorityYears,
    };
  }

  /**
   * Tính toán nhanh số ngày làm việc thực tế (loại trừ Thứ 7, CN và ngày Lễ/Tết - BR-05)
   */
  async calculateDays(dto: CalculateDaysDto) {
    try {
      const holidays = await this.prisma.publicHoliday.findMany({
        select: { date: true },
      });
      const holidayDates = holidays.map((h) => h.date);

      const workingDays = LeaveRulesUtil.calculateWorkingDays(
        dto.startDate,
        dto.endDate,
        dto.leaveUnit || LeaveUnit.FULL_DAY,
        holidayDates,
      );

      return { workingDays };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * FR-05 & BR-01 -> BR-13: Tạo đơn xin nghỉ phép mới
   */
  async createRequest(userId: string, dto: CreateLeaveDto, attachmentUrl?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại.');
      }

      // 1. Kiểm tra ràng buộc hợp đồng thử việc (BR-02)
      LeaveRulesUtil.validateProbationConstraint(user.contractType, dto.leaveType);

      // 2. Lấy danh sách kỳ công đã bị khóa (BR-07)
      const lockedPeriods = await this.prisma.payrollPeriod.findMany({
        where: { isLocked: true },
        select: { endDate: true },
      });
      const lockedCutoffs = lockedPeriods.map((p) => p.endDate);

      // 3. Kiểm tra nộp đơn lùi ngày và khóa kỳ công (BR-07)
      LeaveRulesUtil.validateBackdatedAndPayrollLock(dto.startDate, new Date(), lockedCutoffs);

      // 4. Lấy danh sách ngày Lễ/Tết quốc gia (BR-05)
      const holidays = await this.prisma.publicHoliday.findMany({
        select: { date: true },
      });
      const holidayDates = holidays.map((h) => h.date);

      // 5. Tính số ngày làm việc thực tế (loại trừ T7, CN và Lễ/Tết - BR-05)
      const workingDays = LeaveRulesUtil.calculateWorkingDays(
        dto.startDate,
        dto.endDate,
        dto.leaveUnit,
        holidayDates,
      );

      if (workingDays === 0) {
        throw new BadRequestException(
          'Khoảng thời gian bạn chọn không chứa ngày làm việc nào (rơi vào ngày Lễ/Tết hoặc Thứ 7, Chủ Nhật).',
        );
      }

      // 6. Kiểm tra quỹ phép năm khả dụng (BR-01 & BR-04)
      // [SEEDED_BUG: BUG-01 (HIGH)] - Bỏ sót kiểm tra số dư phép khả dụng khi chọn đơn vị nghỉ nửa ngày (MORNING/AFTERNOON)
      // Hậu quả: Nhân viên hết phép (0 ngày) vẫn nộp được đơn nghỉ nửa ngày làm âm quỹ phép.
      if (dto.leaveType === LeaveType.ANNUAL && dto.leaveUnit === LeaveUnit.FULL_DAY) {
        const approvedLeaves = await this.prisma.leaveRequest.findMany({
          where: {
            userId,
            leaveType: LeaveType.ANNUAL,
            status: LeaveStatus.APPROVED,
          },
        });
        const usedDays = approvedLeaves.reduce((sum, item) => sum + item.workingDays, 0);

        LeaveRulesUtil.validateAnnualLeaveBalance(
          workingDays,
          user.annualLeaveQuota,
          usedDays,
          user.previousYearQuota,
          new Date(),
        );
      }

      // 7. Kiểm tra chứng từ y tế cho nghỉ ốm (BR-08)
      const finalAttachmentUrl = attachmentUrl || dto.attachmentUrl;
      LeaveRulesUtil.validateMedicalAttachment(dto.leaveType, workingDays, finalAttachmentUrl);

      // 8. Chống trùng lịch nghỉ cá nhân (BR-13)
      const existingLeaves = await this.prisma.leaveRequest.findMany({
        where: {
          userId,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.PENDING_DIRECTOR, LeaveStatus.APPROVED] },
        },
        select: { startDate: true, endDate: true, status: true },
      });
      LeaveRulesUtil.validateOverlapping(dto.startDate, dto.endDate, existingLeaves);

      // 9. Xác định số cấp duyệt (BR-09)
      const { approvalLevel, initialStatus } = LeaveRulesUtil.determineApprovalLevel(workingDays);

      // 10. Tạo đơn mới
      const newLeave = await this.prisma.leaveRequest.create({
        data: {
          userId,
          leaveType: dto.leaveType,
          leaveUnit: dto.leaveUnit,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          workingDays,
          reason: dto.reason.trim(),
          attachmentUrl: finalAttachmentUrl,
          status: initialStatus,
          approvalLevel,
        },
      });

      return {
        message: 'Tạo đơn xin nghỉ phép thành công!',
        data: newLeave,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * FR-06: Xem danh sách đơn của bản thân
   */
  async getMyRequests(userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        approvedBy: {
          select: {
            fullName: true,
            position: true,
          },
        },
      },
    });
  }

  /**
   * FR-06 & BR-11: Chỉnh sửa đơn khi chưa duyệt (PENDING hoặc PENDING_DIRECTOR)
   */
  async editRequest(userId: string, requestId: string, dto: EditLeaveDto, attachmentUrl?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    if (leave.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đơn của nhân viên khác.');
    }

    LeaveRulesUtil.validateCanModifyOrCancel(leave.status);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    const startDate = dto.startDate || leave.startDate.toISOString();
    const endDate = dto.endDate || leave.endDate.toISOString();
    const leaveUnit = dto.leaveUnit || leave.leaveUnit;
    const leaveType = dto.leaveType || leave.leaveType;
    const finalAttachment = attachmentUrl || dto.attachmentUrl || leave.attachmentUrl;

    try {
      LeaveRulesUtil.validateProbationConstraint(user.contractType, leaveType);

      const lockedPeriods = await this.prisma.payrollPeriod.findMany({
        where: { isLocked: true },
        select: { endDate: true },
      });
      LeaveRulesUtil.validateBackdatedAndPayrollLock(startDate, new Date(), lockedPeriods.map((p) => p.endDate));

      const holidays = await this.prisma.publicHoliday.findMany({ select: { date: true } });
      const workingDays = LeaveRulesUtil.calculateWorkingDays(startDate, endDate, leaveUnit, holidays.map((h) => h.date));

      if (leaveType === LeaveType.ANNUAL) {
        const approvedLeaves = await this.prisma.leaveRequest.findMany({
          where: {
            userId,
            id: { not: requestId },
            leaveType: LeaveType.ANNUAL,
            status: LeaveStatus.APPROVED,
          },
        });
        const usedDays = approvedLeaves.reduce((sum, item) => sum + item.workingDays, 0);
        LeaveRulesUtil.validateAnnualLeaveBalance(workingDays, user.annualLeaveQuota, usedDays, user.previousYearQuota);
      }

      LeaveRulesUtil.validateMedicalAttachment(leaveType, workingDays, finalAttachment);

      const otherLeaves = await this.prisma.leaveRequest.findMany({
        where: {
          userId,
          id: { not: requestId },
          status: { in: [LeaveStatus.PENDING, LeaveStatus.PENDING_DIRECTOR, LeaveStatus.APPROVED] },
        },
        select: { startDate: true, endDate: true, status: true },
      });
      LeaveRulesUtil.validateOverlapping(startDate, endDate, otherLeaves);

      const { approvalLevel } = LeaveRulesUtil.determineApprovalLevel(workingDays);

      const updated = await this.prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          leaveType,
          leaveUnit,
          workingDays,
          reason: dto.reason ? dto.reason.trim() : leave.reason,
          attachmentUrl: finalAttachment,
          approvalLevel,
        },
      });

      return {
        message: 'Cập nhật đơn nghỉ phép thành công!',
        data: updated,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * BR-11: Rút đơn chưa duyệt (Recall)
   */
  async recallRequest(userId: string, requestId: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    if (leave.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền rút đơn của nhân viên khác.');
    }

    LeaveRulesUtil.validateCanRecall(leave.status);

    const cancelled = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: LeaveStatus.CANCELLED },
    });

    return {
      message: 'Rút đơn xin nghỉ phép thành công!',
      data: cancelled,
    };
  }

  /**
   * FR-09 & BR-11: Yêu cầu hủy đơn đã duyệt (Request Cancel)
   */
  async requestCancelApproved(userId: string, requestId: string, dto: RequestCancelDto) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    if (leave.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền yêu cầu hủy đơn của người khác.');
    }

    LeaveRulesUtil.validateCanRequestCancel(leave.status);

    // Kiểm tra xem đơn có nằm trong kỳ công đã bị khóa không (BR-07)
    const lockedPeriods = await this.prisma.payrollPeriod.findMany({
      where: { isLocked: true },
      select: { endDate: true },
    });

    for (const locked of lockedPeriods) {
      if (leave.startDate.getTime() <= locked.endDate.getTime()) {
        throw new BadRequestException(
          'Đơn nghỉ phép này thuộc kỳ công đã khóa sổ. Không thể yêu cầu hủy (theo FR-08 & BR-07).',
        );
      }
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.CANCEL_REQUESTED,
        cancelReason: dto.cancelReason.trim(),
      },
    });

    return {
      message: 'Đã gửi yêu cầu hủy đơn nghỉ phép đến Quản lý phê duyệt.',
      data: updated,
    };
  }

  /**
   * FR-07 & FR-12: Quản lý / Giám đốc xem danh sách đơn cần duyệt
   */
  async getManagerRequests(user: any, statusFilter?: LeaveStatus) {
    const whereClause: any = {};
    if (statusFilter && Object.values(LeaveStatus).includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    // Nếu là Quản lý: có thể xem đơn của bộ phận mình hoặc đơn được ủy quyền (DoA)
    // Nếu là Giám đốc (DIRECTOR): xem toàn bộ khối hoặc đơn cấp 2
    // Nếu là ADMIN: xem toàn bộ công ty
    if (user.role === Role.MANAGER) {
      // Tìm xem có được ủy quyền từ ai không
      const today = startOfDay(new Date());
      const activeDelegations = await this.prisma.delegation.findMany({
        where: {
          delegateeId: user.id,
          isActive: true,
          startDate: { lte: today },
          endDate: { gte: today },
        },
        select: { delegator: { select: { department: true } } },
      });
      const delegatedDepts = activeDelegations.map((d) => d.delegator.department);
      const allowedDepts = Array.from(new Set([user.department, ...delegatedDepts]));

      whereClause.user = {
        department: { in: allowedDepts },
      };
    }

    return this.prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            position: true,
            contractType: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * FR-06 & BR-09 & BR-10: Phê duyệt đơn đa cấp và ủy quyền DoA
   */
  async approveRequest(requestId: string, approver: any) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    // Kiểm tra xem người duyệt có phải qua DoA không
    const today = startOfDay(new Date());
    const activeDelegation = await this.prisma.delegation.findFirst({
      where: {
        delegateeId: approver.id,
        isActive: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: { delegator: true },
    });

    const isDoA = Boolean(activeDelegation);
    const delegationNote = isDoA
      ? `Được phê duyệt bởi ${approver.fullName} theo ủy quyền của ${activeDelegation?.delegator.fullName}`
      : null;

    // Xử lý luồng phê duyệt theo cấp
    if (leave.status === LeaveStatus.PENDING) {
      // Cấp 1 (Line Manager)
      if (leave.approvalLevel === 1) {
        // Đơn < 3 ngày: Hoàn tất duyệt luôn
        const updated = await this.prisma.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: LeaveStatus.APPROVED,
            approvedById: approver.id,
            isDelegated: isDoA,
            delegationNote,
            rejectReason: null,
          },
        });
        return { message: 'Phê duyệt đơn thành công!', data: updated };
      } else {
        // Đơn >= 3 ngày: Chuyển lên Cấp 2 (Giám đốc bộ phận)
        const updated = await this.prisma.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: LeaveStatus.PENDING_DIRECTOR,
            approvedById: approver.id,
            isDelegated: isDoA,
            delegationNote: delegationNote ? `${delegationNote} (Cấp 1)` : 'Đã duyệt Cấp 1, chờ Giám đốc',
          },
        });
        return {
          message: 'Đã phê duyệt Cấp 1. Đơn được chuyển lên Giám đốc bộ phận phê duyệt Cấp 2!',
          data: updated,
        };
      }
    } else if (leave.status === LeaveStatus.PENDING_DIRECTOR) {
      // Cấp 2 (Director / Head of Department)
      const updated = await this.prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.APPROVED,
          approvedById: approver.id,
          isDelegated: isDoA,
          delegationNote: delegationNote ? `${delegationNote} (Cấp 2)` : 'Giám đốc đã phê duyệt Cấp 2',
          rejectReason: null,
        },
      });
      return { message: 'Giám đốc đã phê duyệt Cấp 2 thành công!', data: updated };
    } else {
      throw new BadRequestException('Đơn không ở trạng thái chờ duyệt.');
    }
  }

  /**
   * BR-12: Từ chối đơn (Bắt buộc lý do >= 10 ký tự)
   */
  async rejectRequest(requestId: string, approver: any, dto: RejectLeaveDto) {
    LeaveRulesUtil.validateRejectReason(dto.rejectReason);

    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.PENDING_DIRECTOR) {
      throw new BadRequestException('Chỉ có thể từ chối các đơn đang ở trạng thái CHỜ DUYỆT.');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.REJECTED,
        approvedById: approver.id,
        rejectReason: dto.rejectReason.trim(),
      },
    });

    return {
      message: 'Đã từ chối đơn xin nghỉ phép.',
      data: updated,
    };
  }

  /**
   * Xác nhận yêu cầu hủy đơn đã duyệt
   */
  async confirmCancelRequest(requestId: string, approver: any, dto: ConfirmCancelDto) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leave) {
      throw new NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
    }

    if (leave.status !== LeaveStatus.CANCEL_REQUESTED) {
      throw new BadRequestException('Đơn này không có yêu cầu hủy nào đang chờ duyệt.');
    }

    if (dto.approve) {
      const updated = await this.prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.CANCELLED,
          cancelReason: `Đã được quản lý ${approver.fullName} xác nhận hủy. Lý do hủy: ${leave.cancelReason}`,
        },
      });
      return { message: 'Đã chấp thuận hủy đơn và hoàn trả số ngày phép!', data: updated };
    } else {
      const updated = await this.prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.APPROVED, // Giữ nguyên trạng thái đã duyệt
          cancelReason: `Quản lý từ chối yêu cầu hủy. Lý do hủy ban đầu: ${leave.cancelReason}`,
        },
      });
      return { message: 'Đã bác bỏ yêu cầu hủy đơn. Đơn được duy trì trạng thái Đã duyệt.', data: updated };
    }
  }

  /**
   * FR-11: Lịch phòng ban trực quan (Team Visual Calendar)
   */
  async getTeamCalendar(department?: string, month?: number, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month !== undefined ? month : new Date().getMonth();

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    // Lấy ngày Lễ/Tết trong tháng
    const holidays = await this.prisma.publicHoliday.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Lấy danh sách nghỉ phép của các thành viên trong phòng ban
    const whereLeaves: any = {
      status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING, LeaveStatus.PENDING_DIRECTOR] },
      OR: [
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        { startDate: { lte: startOfMonth }, endDate: { gte: endOfMonth } },
      ],
    };

    if (department && department !== 'ALL') {
      whereLeaves.user = { department };
    }

    const leaves = await this.prisma.leaveRequest.findMany({
      where: whereLeaves,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      holidays,
      leaves,
      range: {
        start: startOfMonth,
        end: endOfMonth,
      },
    };
  }

  /**
   * FR-06 & BR-10: Quản lý Ủy quyền Duyệt đơn (DoA)
   */
  async getDelegations(userId: string) {
    return this.prisma.delegation.findMany({
      where: {
        OR: [{ delegatorId: userId }, { delegateeId: userId }],
      },
      include: {
        delegator: { select: { fullName: true, position: true, department: true } },
        delegatee: { select: { fullName: true, position: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDelegation(delegatorId: string, dto: CreateDelegationDto) {
    if (delegatorId === dto.delegateeId) {
      throw new BadRequestException('Không thể tự ủy quyền cho chính mình.');
    }

    const delegatee = await this.prisma.user.findUnique({
      where: { id: dto.delegateeId },
    });
    if (!delegatee) {
      throw new NotFoundException('Không tìm thấy người được chỉ định ủy quyền.');
    }

    const delegation = await this.prisma.delegation.create({
      data: {
        delegatorId,
        delegateeId: dto.delegateeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason.trim(),
        isActive: true,
      },
      include: {
        delegatee: { select: { fullName: true, email: true } },
      },
    });

    return {
      message: `Đã thiết lập ủy quyền duyệt đơn thành công cho ${delegatee.fullName}!`,
      data: delegation,
    };
  }

  async revokeDelegation(delegatorId: string, delegationId: string) {
    const delegation = await this.prisma.delegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) {
      throw new NotFoundException('Không tìm thấy bản ghi ủy quyền.');
    }

    if (delegation.delegatorId !== delegatorId) {
      throw new ForbiddenException('Bạn không có quyền thu hồi ủy quyền này.');
    }

    const updated = await this.prisma.delegation.update({
      where: { id: delegationId },
      data: { isActive: false },
    });

    return {
      message: 'Đã thu hồi ủy quyền duyệt đơn thành công.',
      data: updated,
    };
  }
}
