import { ContractType, Role } from '@prisma/client';
export declare class AdjustQuotaDto {
    newQuota: number;
    reason: string;
}
export declare class UpdateUserRoleContractDto {
    role?: Role;
    contractType?: ContractType;
    position?: string;
    department?: string;
    seniorityYears?: number;
}
export declare class CreateUserDto {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    contractType?: ContractType;
    position: string;
    department: string;
    annualLeaveQuota?: number;
    seniorityYears?: number;
}
export declare class UpdateSsoConfigDto {
    googleEnabled?: boolean;
    googleClientId?: string;
    microsoftEnabled?: boolean;
    microsoftTenantId?: string;
    enforceMfa?: boolean;
}
export declare class CreateHolidayDto {
    name: string;
    date: string;
    description?: string;
}
export declare class LockPayrollPeriodDto {
    monthYear: string;
}
