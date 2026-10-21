import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        id: string;
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
    }>;
}
export {};
