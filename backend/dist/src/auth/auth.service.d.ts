import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            department: string;
            annualLeaveQuota: number;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
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
        };
        redirectPath: string;
    }>;
    getMe(userId: string): Promise<{
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
