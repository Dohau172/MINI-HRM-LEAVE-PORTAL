import { AdminService } from './admin.service';
import { AdjustQuotaDto, CreateHolidayDto, CreateUserDto, LockPayrollPeriodDto, UpdateSsoConfigDto, UpdateUserRoleContractDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllUsers(): Promise<{
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        contractType: import(".prisma/client").$Enums.ContractType;
        position: string;
        department: string;
        canApprove: boolean;
        annualLeaveQuota: number;
        previousYearQuota: number;
        seniorityYears: number;
        isActive: boolean;
    }[]>;
    createUser(adminId: string, dto: CreateUserDto, ipAddress: string): Promise<{
        message: string;
        user: {
            id: string;
            createdAt: Date;
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            contractType: import(".prisma/client").$Enums.ContractType;
            position: string;
            department: string;
            annualLeaveQuota: number;
            seniorityYears: number;
        };
    }>;
    adjustQuota(adminId: string, targetUserId: string, dto: AdjustQuotaDto, ipAddress: string): Promise<{
        message: string;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            contractType: import(".prisma/client").$Enums.ContractType;
            position: string;
            department: string;
            canApprove: boolean;
            annualLeaveQuota: number;
            previousYearQuota: number;
            seniorityYears: number;
            isActive: boolean;
        };
        auditLog: {
            id: string;
            createdAt: Date;
            reason: string;
            action: string;
            oldValue: string;
            newValue: string;
            ipAddress: string | null;
            adminId: string;
            targetUserId: string;
        };
    }>;
    updateUser(adminId: string, targetUserId: string, dto: UpdateUserRoleContractDto, ipAddress: string): Promise<{
        message: string;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.Role;
            contractType: import(".prisma/client").$Enums.ContractType;
            position: string;
            department: string;
            canApprove: boolean;
            annualLeaveQuota: number;
            previousYearQuota: number;
            seniorityYears: number;
            isActive: boolean;
        };
    }>;
    getAuditLogs(): Promise<({
        admin: {
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        targetUser: {
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            department: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string;
        action: string;
        oldValue: string;
        newValue: string;
        ipAddress: string | null;
        adminId: string;
        targetUserId: string;
    })[]>;
    getHolidays(): Promise<{
        id: string;
        name: string;
        date: Date;
        description: string | null;
        createdAt: Date;
    }[]>;
    createHoliday(dto: CreateHolidayDto): Promise<{
        id: string;
        name: string;
        date: Date;
        description: string | null;
        createdAt: Date;
    }>;
    deleteHoliday(id: string): Promise<{
        id: string;
        name: string;
        date: Date;
        description: string | null;
        createdAt: Date;
    }>;
    getPayrollPeriods(): Promise<{
        id: string;
        createdAt: Date;
        monthYear: string;
        startDate: Date;
        endDate: Date;
        isLocked: boolean;
        lockedAt: Date | null;
        lockedBy: string | null;
        updatedAt: Date;
    }[]>;
    lockPayrollPeriod(adminEmail: string, dto: LockPayrollPeriodDto): Promise<{
        message: string;
        period: {
            id: string;
            createdAt: Date;
            monthYear: string;
            startDate: Date;
            endDate: Date;
            isLocked: boolean;
            lockedAt: Date | null;
            lockedBy: string | null;
            updatedAt: Date;
        };
    }>;
    unlockPayrollPeriod(id: string): Promise<{
        message: string;
        period: {
            id: string;
            createdAt: Date;
            monthYear: string;
            startDate: Date;
            endDate: Date;
            isLocked: boolean;
            lockedAt: Date | null;
            lockedBy: string | null;
            updatedAt: Date;
        };
    }>;
    getPayrollSummary(monthYear?: string): Promise<{
        monthYear: string;
        periodRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            id: string;
            fullName: string;
            email: string;
            department: string;
            position: string;
            contractType: import(".prisma/client").$Enums.ContractType;
            standardWorkingDays: number;
            paidAnnualDays: number;
            unpaidDays: number;
            sickDays: number;
            otherPaidDays: number;
            totalAbsenceDays: number;
            actualWorkingDays: number;
        }[];
    }>;
    getSsoConfig(): Promise<{
        googleEnabled: boolean;
        googleClientId: string;
        microsoftEnabled: boolean;
        microsoftTenantId: string;
        enforceMfa: boolean;
        lastUpdatedBy: string;
        lastUpdatedAt: string;
        systemHealth: {
            dbStatus: string;
            uptime: string;
            auditTrailStatus: string;
            activeSessions: number;
        };
    }>;
    updateSsoConfig(adminEmail: string, dto: UpdateSsoConfigDto): Promise<{
        message: string;
        config: {
            googleEnabled: boolean;
            googleClientId: string;
            microsoftEnabled: boolean;
            microsoftTenantId: string;
            enforceMfa: boolean;
            lastUpdatedBy: string;
            lastUpdatedAt: string;
            systemHealth: {
                dbStatus: string;
                uptime: string;
                auditTrailStatus: string;
                activeSessions: number;
            };
        };
    }>;
}
