import { LeaveType, LeaveUnit, LeaveStatus, ContractType } from '@prisma/client';
export interface OverlapRange {
    startDate: Date | string;
    endDate: Date | string;
    status: LeaveStatus;
}
export declare class LeaveRulesUtil {
    static calculateWorkingDays(startDateInput: Date | string, endDateInput: Date | string, leaveUnit?: LeaveUnit, publicHolidays?: Date[]): number;
    static isPublicHoliday(targetDate: Date, publicHolidays: Date[]): boolean;
    static validateProbationConstraint(contractType: ContractType, leaveType: LeaveType): void;
    static validateBackdatedAndPayrollLock(startDateInput: Date | string, referenceDate?: Date, lockedDateLimits?: Date[]): void;
    static validateMedicalAttachment(leaveType: LeaveType, workingDays: number, attachmentUrl?: string | null): void;
    static validateAnnualLeaveBalance(requestedDays: number, annualQuota: number, usedApprovedDays: number, previousYearQuota?: number, currentDate?: Date): {
        available: number;
        remaining: number;
    };
    static determineApprovalLevel(workingDays: number): {
        approvalLevel: number;
        initialStatus: LeaveStatus;
    };
    static validateOverlapping(newStartInput: Date | string, newEndInput: Date | string, existingRequests: OverlapRange[]): void;
    static validateCanRecall(status: LeaveStatus): void;
    static validateCanRequestCancel(status: LeaveStatus): void;
    static validateRejectReason(rejectReason: string): void;
    static validateCanModifyOrCancel(status: LeaveStatus): void;
}
