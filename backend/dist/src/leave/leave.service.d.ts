import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, EditLeaveDto, RejectLeaveDto, CalculateDaysDto, CreateDelegationDto, RequestCancelDto, ConfirmCancelDto } from './dto/leave.dto';
import { LeaveStatus } from '@prisma/client';
export declare class LeaveService {
    private prisma;
    constructor(prisma: PrismaService);
    getLeaveBalance(userId: string): Promise<{
        totalQuota: number;
        previousYearQuota: number;
        isPreviousQuotaValid: boolean;
        usedDays: number;
        remainingDays: number;
        contractType: import(".prisma/client").$Enums.ContractType;
        seniorityYears: number;
    }>;
    calculateDays(dto: CalculateDaysDto): Promise<{
        workingDays: number;
    }>;
    createRequest(userId: string, dto: CreateLeaveDto, attachmentUrl?: string): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    getMyRequests(userId: string): Promise<({
        approvedBy: {
            fullName: string;
            position: string;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        updatedAt: Date;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
        workingDays: number;
        reason: string;
        attachmentUrl: string | null;
        status: import(".prisma/client").$Enums.LeaveStatus;
        rejectReason: string | null;
        approvalLevel: number;
        isDelegated: boolean;
        delegationNote: string | null;
        cancelReason: string | null;
        userId: string;
        approvedById: string | null;
    })[]>;
    editRequest(userId: string, requestId: string, dto: EditLeaveDto, attachmentUrl?: string): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    recallRequest(userId: string, requestId: string): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    requestCancelApproved(userId: string, requestId: string, dto: RequestCancelDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    getManagerRequests(user: any, statusFilter?: LeaveStatus): Promise<({
        user: {
            id: string;
            fullName: string;
            email: string;
            contractType: import(".prisma/client").$Enums.ContractType;
            position: string;
            department: string;
        };
        approvedBy: {
            id: string;
            fullName: string;
            position: string;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        updatedAt: Date;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
        workingDays: number;
        reason: string;
        attachmentUrl: string | null;
        status: import(".prisma/client").$Enums.LeaveStatus;
        rejectReason: string | null;
        approvalLevel: number;
        isDelegated: boolean;
        delegationNote: string | null;
        cancelReason: string | null;
        userId: string;
        approvedById: string | null;
    })[]>;
    approveRequest(requestId: string, approver: any): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    rejectRequest(requestId: string, approver: any, dto: RejectLeaveDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    confirmCancelRequest(requestId: string, approver: any, dto: ConfirmCancelDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        };
    }>;
    getTeamCalendar(department?: string, month?: number, year?: number): Promise<{
        holidays: {
            id: string;
            name: string;
            date: Date;
            description: string | null;
            createdAt: Date;
        }[];
        leaves: ({
            user: {
                id: string;
                fullName: string;
                position: string;
                department: string;
            };
        } & {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            leaveUnit: import(".prisma/client").$Enums.LeaveUnit;
            workingDays: number;
            reason: string;
            attachmentUrl: string | null;
            status: import(".prisma/client").$Enums.LeaveStatus;
            rejectReason: string | null;
            approvalLevel: number;
            isDelegated: boolean;
            delegationNote: string | null;
            cancelReason: string | null;
            userId: string;
            approvedById: string | null;
        })[];
        range: {
            start: Date;
            end: Date;
        };
    }>;
    getDelegations(userId: string): Promise<({
        delegator: {
            fullName: string;
            position: string;
            department: string;
        };
        delegatee: {
            fullName: string;
            position: string;
            department: string;
        };
    } & {
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        updatedAt: Date;
        isActive: boolean;
        reason: string;
        delegatorId: string;
        delegateeId: string;
    })[]>;
    createDelegation(delegatorId: string, dto: CreateDelegationDto): Promise<{
        message: string;
        data: {
            delegatee: {
                fullName: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            isActive: boolean;
            reason: string;
            delegatorId: string;
            delegateeId: string;
        };
    }>;
    revokeDelegation(delegatorId: string, delegationId: string): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date;
            updatedAt: Date;
            isActive: boolean;
            reason: string;
            delegatorId: string;
            delegateeId: string;
        };
    }>;
}
