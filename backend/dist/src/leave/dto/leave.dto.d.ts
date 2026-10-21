import { LeaveType, LeaveUnit } from '@prisma/client';
export declare class CreateLeaveDto {
    leaveType: LeaveType;
    leaveUnit: LeaveUnit;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
}
export declare class EditLeaveDto {
    leaveType?: LeaveType;
    leaveUnit?: LeaveUnit;
    startDate?: string;
    endDate?: string;
    reason?: string;
    attachmentUrl?: string;
}
export declare class RejectLeaveDto {
    rejectReason: string;
}
export declare class CalculateDaysDto {
    startDate: string;
    endDate: string;
    leaveUnit?: LeaveUnit;
}
export declare class CreateDelegationDto {
    delegateeId: string;
    startDate: string;
    endDate: string;
    reason: string;
}
export declare class RequestCancelDto {
    cancelReason: string;
}
export declare class ConfirmCancelDto {
    approve: boolean;
}
