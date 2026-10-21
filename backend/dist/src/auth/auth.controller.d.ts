import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
