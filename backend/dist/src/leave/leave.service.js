"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const leave_rules_util_1 = require("./leave-rules.util");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let LeaveService = class LeaveService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLeaveBalance(userId) {
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
            throw new common_1.NotFoundException('Người dùng không tồn tại.');
        }
        const approvedAnnualLeaves = await this.prisma.leaveRequest.findMany({
            where: {
                userId,
                leaveType: client_1.LeaveType.ANNUAL,
                status: client_1.LeaveStatus.APPROVED,
            },
        });
        const usedDays = approvedAnnualLeaves.reduce((sum, item) => sum + item.workingDays, 0);
        const now = new Date();
        const currentYear = now.getFullYear();
        const expiryDate = new Date(`${currentYear}-03-31T23:59:59.999Z`);
        const isPreviousQuotaValid = now.getTime() <= expiryDate.getTime();
        const totalAvailableGranted = user.annualLeaveQuota + (isPreviousQuotaValid ? user.previousYearQuota : 0);
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
    async calculateDays(dto) {
        try {
            const holidays = await this.prisma.publicHoliday.findMany({
                select: { date: true },
            });
            const holidayDates = holidays.map((h) => h.date);
            const workingDays = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays(dto.startDate, dto.endDate, dto.leaveUnit || client_1.LeaveUnit.FULL_DAY, holidayDates);
            return { workingDays };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createRequest(userId, dto, attachmentUrl) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('Người dùng không tồn tại.');
            }
            leave_rules_util_1.LeaveRulesUtil.validateProbationConstraint(user.contractType, dto.leaveType);
            const lockedPeriods = await this.prisma.payrollPeriod.findMany({
                where: { isLocked: true },
                select: { endDate: true },
            });
            const lockedCutoffs = lockedPeriods.map((p) => p.endDate);
            leave_rules_util_1.LeaveRulesUtil.validateBackdatedAndPayrollLock(dto.startDate, new Date(), lockedCutoffs);
            const holidays = await this.prisma.publicHoliday.findMany({
                select: { date: true },
            });
            const holidayDates = holidays.map((h) => h.date);
            const workingDays = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays(dto.startDate, dto.endDate, dto.leaveUnit, holidayDates);
            if (workingDays === 0) {
                throw new common_1.BadRequestException('Khoảng thời gian bạn chọn không chứa ngày làm việc nào (rơi vào ngày Lễ/Tết hoặc Thứ 7, Chủ Nhật).');
            }
            if (dto.leaveType === client_1.LeaveType.ANNUAL && dto.leaveUnit === client_1.LeaveUnit.FULL_DAY) {
                const approvedLeaves = await this.prisma.leaveRequest.findMany({
                    where: {
                        userId,
                        leaveType: client_1.LeaveType.ANNUAL,
                        status: client_1.LeaveStatus.APPROVED,
                    },
                });
                const usedDays = approvedLeaves.reduce((sum, item) => sum + item.workingDays, 0);
                leave_rules_util_1.LeaveRulesUtil.validateAnnualLeaveBalance(workingDays, user.annualLeaveQuota, usedDays, user.previousYearQuota, new Date());
            }
            const finalAttachmentUrl = attachmentUrl || dto.attachmentUrl;
            leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(dto.leaveType, workingDays, finalAttachmentUrl);
            const existingLeaves = await this.prisma.leaveRequest.findMany({
                where: {
                    userId,
                    status: { in: [client_1.LeaveStatus.PENDING, client_1.LeaveStatus.PENDING_DIRECTOR, client_1.LeaveStatus.APPROVED] },
                },
                select: { startDate: true, endDate: true, status: true },
            });
            leave_rules_util_1.LeaveRulesUtil.validateOverlapping(dto.startDate, dto.endDate, existingLeaves);
            const { approvalLevel, initialStatus } = leave_rules_util_1.LeaveRulesUtil.determineApprovalLevel(workingDays);
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
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getMyRequests(userId) {
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
    async editRequest(userId, requestId, dto, attachmentUrl) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        if (leave.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền sửa đơn của nhân viên khác.');
        }
        leave_rules_util_1.LeaveRulesUtil.validateCanModifyOrCancel(leave.status);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Người dùng không tồn tại.');
        const startDate = dto.startDate || leave.startDate.toISOString();
        const endDate = dto.endDate || leave.endDate.toISOString();
        const leaveUnit = dto.leaveUnit || leave.leaveUnit;
        const leaveType = dto.leaveType || leave.leaveType;
        const finalAttachment = attachmentUrl || dto.attachmentUrl || leave.attachmentUrl;
        try {
            leave_rules_util_1.LeaveRulesUtil.validateProbationConstraint(user.contractType, leaveType);
            const lockedPeriods = await this.prisma.payrollPeriod.findMany({
                where: { isLocked: true },
                select: { endDate: true },
            });
            leave_rules_util_1.LeaveRulesUtil.validateBackdatedAndPayrollLock(startDate, new Date(), lockedPeriods.map((p) => p.endDate));
            const holidays = await this.prisma.publicHoliday.findMany({ select: { date: true } });
            const workingDays = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays(startDate, endDate, leaveUnit, holidays.map((h) => h.date));
            if (leaveType === client_1.LeaveType.ANNUAL) {
                const approvedLeaves = await this.prisma.leaveRequest.findMany({
                    where: {
                        userId,
                        id: { not: requestId },
                        leaveType: client_1.LeaveType.ANNUAL,
                        status: client_1.LeaveStatus.APPROVED,
                    },
                });
                const usedDays = approvedLeaves.reduce((sum, item) => sum + item.workingDays, 0);
                leave_rules_util_1.LeaveRulesUtil.validateAnnualLeaveBalance(workingDays, user.annualLeaveQuota, usedDays, user.previousYearQuota);
            }
            leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(leaveType, workingDays, finalAttachment);
            const otherLeaves = await this.prisma.leaveRequest.findMany({
                where: {
                    userId,
                    id: { not: requestId },
                    status: { in: [client_1.LeaveStatus.PENDING, client_1.LeaveStatus.PENDING_DIRECTOR, client_1.LeaveStatus.APPROVED] },
                },
                select: { startDate: true, endDate: true, status: true },
            });
            leave_rules_util_1.LeaveRulesUtil.validateOverlapping(startDate, endDate, otherLeaves);
            const { approvalLevel } = leave_rules_util_1.LeaveRulesUtil.determineApprovalLevel(workingDays);
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
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async recallRequest(userId, requestId) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        leave_rules_util_1.LeaveRulesUtil.validateCanRecall(leave.status);
        const cancelled = await this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: { status: client_1.LeaveStatus.CANCELLED },
        });
        return {
            message: 'Rút đơn xin nghỉ phép thành công!',
            data: cancelled,
        };
    }
    async requestCancelApproved(userId, requestId, dto) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        if (leave.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền yêu cầu hủy đơn của người khác.');
        }
        leave_rules_util_1.LeaveRulesUtil.validateCanRequestCancel(leave.status);
        const lockedPeriods = await this.prisma.payrollPeriod.findMany({
            where: { isLocked: true },
            select: { endDate: true },
        });
        for (const locked of lockedPeriods) {
            if (leave.startDate.getTime() <= locked.endDate.getTime()) {
                throw new common_1.BadRequestException('Đơn nghỉ phép này thuộc kỳ công đã khóa sổ. Không thể yêu cầu hủy (theo FR-08 & BR-07).');
            }
        }
        const updated = await this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.LeaveStatus.CANCEL_REQUESTED,
                cancelReason: dto.cancelReason.trim(),
            },
        });
        return {
            message: 'Đã gửi yêu cầu hủy đơn nghỉ phép đến Quản lý phê duyệt.',
            data: updated,
        };
    }
    async getManagerRequests(user, statusFilter) {
        const whereClause = {};
        if (statusFilter && Object.values(client_1.LeaveStatus).includes(statusFilter)) {
            whereClause.status = statusFilter;
        }
        if (user.role === client_1.Role.MANAGER) {
            const today = (0, date_fns_1.startOfDay)(new Date());
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
    async approveRequest(requestId, approver) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        const today = (0, date_fns_1.startOfDay)(new Date());
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
        if (leave.status === client_1.LeaveStatus.PENDING) {
            if (leave.approvalLevel === 1) {
                const updated = await this.prisma.leaveRequest.update({
                    where: { id: requestId },
                    data: {
                        status: client_1.LeaveStatus.APPROVED,
                        approvedById: approver.id,
                        isDelegated: isDoA,
                        delegationNote,
                        rejectReason: null,
                    },
                });
                return { message: 'Phê duyệt đơn thành công!', data: updated };
            }
            else {
                const updated = await this.prisma.leaveRequest.update({
                    where: { id: requestId },
                    data: {
                        status: client_1.LeaveStatus.PENDING_DIRECTOR,
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
        }
        else if (leave.status === client_1.LeaveStatus.PENDING_DIRECTOR) {
            const updated = await this.prisma.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.LeaveStatus.APPROVED,
                    approvedById: approver.id,
                    isDelegated: isDoA,
                    delegationNote: delegationNote ? `${delegationNote} (Cấp 2)` : 'Giám đốc đã phê duyệt Cấp 2',
                    rejectReason: null,
                },
            });
            return { message: 'Giám đốc đã phê duyệt Cấp 2 thành công!', data: updated };
        }
        else {
            throw new common_1.BadRequestException('Đơn không ở trạng thái chờ duyệt.');
        }
    }
    async rejectRequest(requestId, approver, dto) {
        leave_rules_util_1.LeaveRulesUtil.validateRejectReason(dto.rejectReason);
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        if (leave.status !== client_1.LeaveStatus.PENDING && leave.status !== client_1.LeaveStatus.PENDING_DIRECTOR) {
            throw new common_1.BadRequestException('Chỉ có thể từ chối các đơn đang ở trạng thái CHỜ DUYỆT.');
        }
        const updated = await this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.LeaveStatus.REJECTED,
                approvedById: approver.id,
                rejectReason: dto.rejectReason.trim(),
            },
        });
        return {
            message: 'Đã từ chối đơn xin nghỉ phép.',
            data: updated,
        };
    }
    async confirmCancelRequest(requestId, approver, dto) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });
        if (!leave) {
            throw new common_1.NotFoundException('Không tìm thấy đơn xin nghỉ phép.');
        }
        if (leave.status !== client_1.LeaveStatus.CANCEL_REQUESTED) {
            throw new common_1.BadRequestException('Đơn này không có yêu cầu hủy nào đang chờ duyệt.');
        }
        if (dto.approve) {
            const updated = await this.prisma.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.LeaveStatus.CANCELLED,
                    cancelReason: `Đã được quản lý ${approver.fullName} xác nhận hủy. Lý do hủy: ${leave.cancelReason}`,
                },
            });
            return { message: 'Đã chấp thuận hủy đơn và hoàn trả số ngày phép!', data: updated };
        }
        else {
            const updated = await this.prisma.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.LeaveStatus.APPROVED,
                    cancelReason: `Quản lý từ chối yêu cầu hủy. Lý do hủy ban đầu: ${leave.cancelReason}`,
                },
            });
            return { message: 'Đã bác bỏ yêu cầu hủy đơn. Đơn được duy trì trạng thái Đã duyệt.', data: updated };
        }
    }
    async getTeamCalendar(department, month, year) {
        const targetYear = year || new Date().getFullYear();
        const targetMonth = month !== undefined ? month : new Date().getMonth();
        const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
        const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));
        const holidays = await this.prisma.publicHoliday.findMany({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth },
            },
        });
        const whereLeaves = {
            status: { in: [client_1.LeaveStatus.APPROVED, client_1.LeaveStatus.PENDING, client_1.LeaveStatus.PENDING_DIRECTOR] },
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
    async getDelegations(userId) {
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
    async createDelegation(delegatorId, dto) {
        if (delegatorId === dto.delegateeId) {
            throw new common_1.BadRequestException('Không thể tự ủy quyền cho chính mình.');
        }
        const delegatee = await this.prisma.user.findUnique({
            where: { id: dto.delegateeId },
        });
        if (!delegatee) {
            throw new common_1.NotFoundException('Không tìm thấy người được chỉ định ủy quyền.');
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
    async revokeDelegation(delegatorId, delegationId) {
        const delegation = await this.prisma.delegation.findUnique({
            where: { id: delegationId },
        });
        if (!delegation) {
            throw new common_1.NotFoundException('Không tìm thấy bản ghi ủy quyền.');
        }
        if (delegation.delegatorId !== delegatorId) {
            throw new common_1.ForbiddenException('Bạn không có quyền thu hồi ủy quyền này.');
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
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveService);
//# sourceMappingURL=leave.service.js.map