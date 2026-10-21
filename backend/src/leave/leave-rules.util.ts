import { LeaveType, LeaveUnit, LeaveStatus, ContractType } from '@prisma/client';
import { isWeekend, addDays, isBefore, isAfter, startOfDay, parseISO, isSameDay } from 'date-fns';

export interface OverlapRange {
  startDate: Date | string;
  endDate: Date | string;
  status: LeaveStatus;
}

export class LeaveRulesUtil {
  /**
   * BR-05: Tính số ngày làm việc thực tế (loại trừ Thứ 7, Chủ Nhật VÀ Ngày Lễ/Tết quốc gia)
   */
  static calculateWorkingDays(
    startDateInput: Date | string,
    endDateInput: Date | string,
    leaveUnit: LeaveUnit = LeaveUnit.FULL_DAY,
    publicHolidays: Date[] = [],
  ): number {
    const start = startOfDay(typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput);
    const end = startOfDay(typeof endDateInput === 'string' ? parseISO(endDateInput) : endDateInput);

    if (isAfter(start, end)) {
      throw new Error('Đến ngày phải lớn hơn hoặc bằng Từ ngày.');
    }

    const isSameDayRange = start.getTime() === end.getTime();
    if (leaveUnit === LeaveUnit.MORNING || leaveUnit === LeaveUnit.AFTERNOON) {
      if (!isSameDayRange) {
        throw new Error('Nghỉ nửa ngày (0.5 ngày) chỉ được áp dụng khi Từ ngày trùng với Đến ngày (theo BR-06).');
      }
      if (isWeekend(start) || this.isPublicHoliday(start, publicHolidays)) {
        return 0;
      }
      return 0.5;
    }

    let current = start;
    let workingDaysCount = 0;
    while (!isAfter(current, end)) {
      const isWk = isWeekend(current);
      const isHol = this.isPublicHoliday(current, publicHolidays);
      if (!isWk && !isHol) {
        workingDaysCount += 1.0;
      }
      current = addDays(current, 1);
    }

    return workingDaysCount;
  }

  /**
   * Kiểm tra một ngày có phải là Ngày Lễ, Tết quốc gia hay không
   */
  static isPublicHoliday(targetDate: Date, publicHolidays: Date[]): boolean {
    const target = startOfDay(targetDate);
    return publicHolidays.some((h) => isSameDay(startOfDay(h), target));
  }

  /**
   * BR-02: Ràng buộc đối với Nhân sự Thử việc (Probationary Constraints)
   */
  static validateProbationConstraint(contractType: ContractType, leaveType: LeaveType): void {
    if (contractType === ContractType.PROBATION && leaveType !== LeaveType.UNPAID) {
      throw new Error(
        'Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương" (Unpaid Leave) theo quy định tại BR-02.',
      );
    }
  }

  /**
   * BR-07: Ràng buộc nộp đơn lùi ngày & Khóa kỳ công ngày 25
   */
  static validateBackdatedAndPayrollLock(
    startDateInput: Date | string,
    referenceDate: Date = new Date(),
    lockedDateLimits: Date[] = [], // Các mốc ngày đã bị khóa sổ kỳ công
  ): void {
    const start = startOfDay(typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput);
    const ref = startOfDay(referenceDate);

    // 1. Kiểm tra không lùi quá 3 ngày làm việc
    if (isBefore(start, ref)) {
      let cursor = addDays(ref, -1);
      let pastWorkingDays = 0;

      while (!isBefore(cursor, start)) {
        if (!isWeekend(cursor)) {
          pastWorkingDays += 1;
        }
        cursor = addDays(cursor, -1);
      }

      // [SEEDED_BUG: BUG-02 (MEDIUM)] - Lỗi so sánh biên (Off-by-one): dùng >= 3 thay vì > 3
      // Hậu quả: Nhân viên nộp lùi đúng 3 ngày làm việc (mức biên tối đa được phép theo BR-07) bị báo lỗi sai.
      if (pastWorkingDays >= 3) {
        throw new Error('Từ ngày không được lùi về quá khứ quá 3 ngày làm việc (theo BR-07).');
      }
    }

    // 2. Kiểm tra xung đột với kỳ công đã khóa
    for (const lockedCutoff of lockedDateLimits) {
      if (!isAfter(start, startOfDay(lockedCutoff))) {
        throw new Error(
          `Khoảng thời gian nghỉ thuộc kỳ tính lương đã khóa sổ (${lockedCutoff.toISOString().slice(0, 10)}). Không thể tạo đơn theo BR-07.`,
        );
      }
    }
  }

  /**
   * BR-08: Linh hoạt chứng từ y tế cho nghỉ ốm
   */
  static validateMedicalAttachment(leaveType: LeaveType, workingDays: number, attachmentUrl?: string | null): void {
    // [SEEDED_BUG: BUG-04 (MEDIUM)] - Lỗi điều kiện biên: dùng > 2.0 thay vì >= 2.0
    // Hậu quả: Nghỉ ốm đúng 2.0 ngày không bị bắt buộc nộp chứng từ y tế (vi phạm BR-08).
    if (leaveType === LeaveType.SICK && workingDays > 2.0) {
      if (!attachmentUrl || attachmentUrl.trim() === '') {
        throw new Error(
          'Nghỉ ốm đau từ 2 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế hợp lệ (theo BR-08).',
        );
      }
    }
  }

  /**
   * BR-01: Kiểm tra quỹ phép năm khả dụng (kết hợp phép năm nay + phép tồn năm cũ nếu trước 31/03)
   */
  static validateAnnualLeaveBalance(
    requestedDays: number,
    annualQuota: number,
    usedApprovedDays: number,
    previousYearQuota: number = 0,
    currentDate: Date = new Date(),
  ): { available: number; remaining: number } {
    const currentYear = currentDate.getFullYear();
    const expiryDate = new Date(`${currentYear}-03-31T23:59:59.999Z`);
    const isPreviousQuotaValid = !isAfter(currentDate, expiryDate);

    // Nếu trước 31/03 thì được cộng thêm phép tồn năm cũ
    const totalGranted = annualQuota + (isPreviousQuotaValid ? previousYearQuota : 0);
    const available = Math.max(0, totalGranted - usedApprovedDays);

    if (requestedDays > available) {
      throw new Error(
        `Số ngày xin nghỉ (${requestedDays} ngày) vượt quá số phép năm khả dụng còn lại (${available} ngày) (theo BR-01).`,
      );
    }

    return { available, remaining: available - requestedDays };
  }

  /**
   * BR-09: Xác định số cấp phê duyệt dựa trên thời lượng nghỉ
   * Dưới 3 ngày: 1 cấp (Line Manager); Từ 3 ngày trở lên: 2 cấp (HoD / Director)
   */
  static determineApprovalLevel(workingDays: number): { approvalLevel: number; initialStatus: LeaveStatus } {
    // [SEEDED_BUG: BUG-05 (MEDIUM)] - Lỗi phân cấp duyệt: dùng > 3.0 thay vì >= 3.0
    // Hậu quả: Đơn đúng 3.0 ngày làm việc chỉ gán approvalLevel = 1, bỏ qua cấp duyệt của Giám đốc (vi phạm BR-09).
    if (workingDays > 3.0) {
      return { approvalLevel: 2, initialStatus: LeaveStatus.PENDING }; // Cần qua LM duyệt rồi mới lên Director
    }
    return { approvalLevel: 1, initialStatus: LeaveStatus.PENDING };
  }

  /**
   * BR-13: Chống trùng lịch nghỉ
   */
  static validateOverlapping(
    newStartInput: Date | string,
    newEndInput: Date | string,
    existingRequests: OverlapRange[],
  ): void {
    const newStart = startOfDay(typeof newStartInput === 'string' ? parseISO(newStartInput) : newStartInput);
    const newEnd = startOfDay(typeof newEndInput === 'string' ? parseISO(newEndInput) : newEndInput);

    for (const req of existingRequests) {
      if (
        req.status !== LeaveStatus.PENDING &&
        req.status !== LeaveStatus.PENDING_DIRECTOR &&
        req.status !== LeaveStatus.APPROVED
      ) {
        continue;
      }

      const reqStart = startOfDay(typeof req.startDate === 'string' ? parseISO(req.startDate) : req.startDate);
      const reqEnd = startOfDay(typeof req.endDate === 'string' ? parseISO(req.endDate) : req.endDate);

      const hasOverlap = !isAfter(newStart, reqEnd) && !isBefore(newEnd, reqStart);
      if (hasOverlap) {
        throw new Error(
          `Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có (${reqStart.toISOString().slice(0, 10)} đến ${reqEnd.toISOString().slice(0, 10)}) đang ở trạng thái ${req.status} (theo BR-13).`,
        );
      }
    }
  }

  /**
   * BR-11: Ràng buộc rút đơn hoặc yêu cầu hủy đơn
   */
  static validateCanRecall(status: LeaveStatus): void {
    if (status !== LeaveStatus.PENDING && status !== LeaveStatus.PENDING_DIRECTOR) {
      throw new Error('Chỉ được phép Rút đơn khi đơn chưa được duyệt (trạng thái Chờ duyệt).');
    }
  }

  static validateCanRequestCancel(status: LeaveStatus): void {
    if (status !== LeaveStatus.APPROVED) {
      throw new Error('Chỉ có thể tạo Yêu cầu hủy đối với các đơn đã được phê duyệt.');
    }
  }

  /**
   * BR-12: Lý do bắt buộc khi từ chối đơn
   */
  static validateRejectReason(rejectReason: string): void {
    if (!rejectReason || rejectReason.trim().length < 10) {
      throw new Error('Lý do từ chối bắt buộc phải có tối thiểu 10 ký tự (theo BR-12).');
    }
  }

  /**
   * BR-11: Chỉ cho phép chỉnh sửa khi đơn ở trạng thái Chờ duyệt
   */
  static validateCanModifyOrCancel(status: LeaveStatus): void {
    if (status !== LeaveStatus.PENDING && status !== LeaveStatus.PENDING_DIRECTOR) {
      throw new Error('Chỉ được phép chỉnh sửa hoặc hủy khi đơn ở trạng thái Chờ duyệt.');
    }
  }
}
