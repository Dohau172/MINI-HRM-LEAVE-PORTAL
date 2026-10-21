import { LeaveService } from './leave.service';
import { CreateLeaveDto, EditLeaveDto, RejectLeaveDto, CalculateDaysDto, CreateDelegationDto, RequestCancelDto, ConfirmCancelDto } from './dto/leave.dto';
import { LeaveStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class LeaveController {
    private readonly leaveService;
    private readonly prisma;
    constructor(leaveService: LeaveService, prisma: PrismaService);
    getBalance(userId: string): Promise<{
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
    createRequest(userId: string, dto: CreateLeaveDto, file?: Express.Multer.File): Promise<{
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
    editRequest(userId: string, id: string, dto: EditLeaveDto, file?: Express.Multer.File): Promise<{
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
    recallRequest(userId: string, id: string): Promise<{
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
    cancelRequestOld(userId: string, id: string): Promise<{
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
    requestCancelApproved(userId: string, id: string, dto: RequestCancelDto): Promise<{
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
    getTeamCalendar(department?: string, month?: string, year?: string): Promise<{
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
    getManagerRequests(user: any, status?: LeaveStatus): Promise<({
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
    approveRequest(user: any, id: string): Promise<{
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
    rejectRequest(user: any, id: string, dto: RejectLeaveDto): Promise<{
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
    confirmCancelRequest(user: any, id: string, dto: ConfirmCancelDto): Promise<{
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
    createDelegation(userId: string, dto: CreateDelegationDto): Promise<{
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
    revokeDelegation(userId: string, id: string): Promise<{
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
    getPotentialDelegatees(user: any): Promise<{
        id: string;
        fullName: string;
        email: string;
        position: string;
        department: string;
    }[]>;
}
