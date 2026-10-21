"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRulesUtil = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
class LeaveRulesUtil {
    static calculateWorkingDays(startDateInput, endDateInput, leaveUnit = client_1.LeaveUnit.FULL_DAY, publicHolidays = []) {
        const start = (0, date_fns_1.startOfDay)(typeof startDateInput === 'string' ? (0, date_fns_1.parseISO)(startDateInput) : startDateInput);
        const end = (0, date_fns_1.startOfDay)(typeof endDateInput === 'string' ? (0, date_fns_1.parseISO)(endDateInput) : endDateInput);
        if ((0, date_fns_1.isAfter)(start, end)) {
            throw new Error('Đến ngày phải lớn hơn hoặc bằng Từ ngày.');
        }
        const isSameDayRange = start.getTime() === end.getTime();
        if (leaveUnit === client_1.LeaveUnit.MORNING || leaveUnit === client_1.LeaveUnit.AFTERNOON) {
            if (!isSameDayRange) {
                throw new Error('Nghỉ nửa ngày (0.5 ngày) chỉ được áp dụng khi Từ ngày trùng với Đến ngày (theo BR-06).');
            }
            if ((0, date_fns_1.isWeekend)(start) || this.isPublicHoliday(start, publicHolidays)) {
                return 0;
            }
            return 0.5;
        }
        let current = start;
        let workingDaysCount = 0;
        while (!(0, date_fns_1.isAfter)(current, end)) {
            const isWk = (0, date_fns_1.isWeekend)(current);
            const isHol = this.isPublicHoliday(current, publicHolidays);
            if (!isWk && !isHol) {
                workingDaysCount += 1.0;
            }
            current = (0, date_fns_1.addDays)(current, 1);
        }
        return workingDaysCount;
    }
    static isPublicHoliday(targetDate, publicHolidays) {
        const target = (0, date_fns_1.startOfDay)(targetDate);
        return publicHolidays.some((h) => (0, date_fns_1.isSameDay)((0, date_fns_1.startOfDay)(h), target));
    }
    static validateProbationConstraint(contractType, leaveType) {
        if (contractType === client_1.ContractType.PROBATION && leaveType !== client_1.LeaveType.UNPAID) {
            throw new Error('Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương" (Unpaid Leave) theo quy định tại BR-02.');
        }
    }
    static validateBackdatedAndPayrollLock(startDateInput, referenceDate = new Date(), lockedDateLimits = []) {
        const start = (0, date_fns_1.startOfDay)(typeof startDateInput === 'string' ? (0, date_fns_1.parseISO)(startDateInput) : startDateInput);
        const ref = (0, date_fns_1.startOfDay)(referenceDate);
        if ((0, date_fns_1.isBefore)(start, ref)) {
            let cursor = (0, date_fns_1.addDays)(ref, -1);
            let pastWorkingDays = 0;
            while (!(0, date_fns_1.isBefore)(cursor, start)) {
                if (!(0, date_fns_1.isWeekend)(cursor)) {
                    pastWorkingDays += 1;
                }
                cursor = (0, date_fns_1.addDays)(cursor, -1);
            }
            if (pastWorkingDays > 3) {
                throw new Error('Từ ngày không được lùi về quá khứ quá 3 ngày làm việc (theo BR-07).');
            }
        }
        for (const lockedCutoff of lockedDateLimits) {
            if (!(0, date_fns_1.isAfter)(start, (0, date_fns_1.startOfDay)(lockedCutoff))) {
                throw new Error(`Khoảng thời gian nghỉ thuộc kỳ tính lương đã khóa sổ (${lockedCutoff.toISOString().slice(0, 10)}). Không thể tạo đơn theo BR-07.`);
            }
        }
    }
    static validateMedicalAttachment(leaveType, workingDays, attachmentUrl) {
        if (leaveType === client_1.LeaveType.SICK && workingDays >= 2.0) {
            if (!attachmentUrl || attachmentUrl.trim() === '') {
                throw new Error('Nghỉ ốm đau từ 2 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế hợp lệ (theo BR-08).');
            }
        }
    }
    static validateAnnualLeaveBalance(requestedDays, annualQuota, usedApprovedDays, previousYearQuota = 0, currentDate = new Date()) {
        const currentYear = currentDate.getFullYear();
        const expiryDate = new Date(`${currentYear}-03-31T23:59:59.999Z`);
        const isPreviousQuotaValid = !(0, date_fns_1.isAfter)(currentDate, expiryDate);
        const totalGranted = annualQuota + (isPreviousQuotaValid ? previousYearQuota : 0);
        const available = Math.max(0, totalGranted - usedApprovedDays);
        if (requestedDays > available) {
            throw new Error(`Số ngày xin nghỉ (${requestedDays} ngày) vượt quá số phép năm khả dụng còn lại (${available} ngày) (theo BR-01).`);
        }
        return { available, remaining: available - requestedDays };
    }
    static determineApprovalLevel(workingDays) {
        if (workingDays >= 3.0) {
            return { approvalLevel: 2, initialStatus: client_1.LeaveStatus.PENDING };
        }
        return { approvalLevel: 1, initialStatus: client_1.LeaveStatus.PENDING };
    }
    static validateOverlapping(newStartInput, newEndInput, existingRequests) {
        const newStart = (0, date_fns_1.startOfDay)(typeof newStartInput === 'string' ? (0, date_fns_1.parseISO)(newStartInput) : newStartInput);
        const newEnd = (0, date_fns_1.startOfDay)(typeof newEndInput === 'string' ? (0, date_fns_1.parseISO)(newEndInput) : newEndInput);
        for (const req of existingRequests) {
            if (req.status !== client_1.LeaveStatus.PENDING &&
                req.status !== client_1.LeaveStatus.PENDING_DIRECTOR &&
                req.status !== client_1.LeaveStatus.APPROVED) {
                continue;
            }
            const reqStart = (0, date_fns_1.startOfDay)(typeof req.startDate === 'string' ? (0, date_fns_1.parseISO)(req.startDate) : req.startDate);
            const reqEnd = (0, date_fns_1.startOfDay)(typeof req.endDate === 'string' ? (0, date_fns_1.parseISO)(req.endDate) : req.endDate);
            const hasOverlap = !(0, date_fns_1.isAfter)(newStart, reqEnd) && !(0, date_fns_1.isBefore)(newEnd, reqStart);
            if (hasOverlap) {
                throw new Error(`Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có (${reqStart.toISOString().slice(0, 10)} đến ${reqEnd.toISOString().slice(0, 10)}) đang ở trạng thái ${req.status} (theo BR-13).`);
            }
        }
    }
    static validateCanRecall(status) {
        if (status !== client_1.LeaveStatus.PENDING && status !== client_1.LeaveStatus.PENDING_DIRECTOR) {
            throw new Error('Chỉ được phép Rút đơn khi đơn chưa được duyệt (trạng thái Chờ duyệt).');
        }
    }
    static validateCanRequestCancel(status) {
        if (status !== client_1.LeaveStatus.APPROVED) {
            throw new Error('Chỉ có thể tạo Yêu cầu hủy đối với các đơn đã được phê duyệt.');
        }
    }
    static validateRejectReason(rejectReason) {
        if (!rejectReason || rejectReason.trim().length < 10) {
            throw new Error('Lý do từ chối bắt buộc phải có tối thiểu 10 ký tự (theo BR-12).');
        }
    }
    static validateCanModifyOrCancel(status) {
        if (status !== client_1.LeaveStatus.PENDING && status !== client_1.LeaveStatus.PENDING_DIRECTOR) {
            throw new Error('Chỉ được phép chỉnh sửa hoặc hủy khi đơn ở trạng thái Chờ duyệt.');
        }
    }
}
exports.LeaveRulesUtil = LeaveRulesUtil;
//# sourceMappingURL=leave-rules.util.js.map