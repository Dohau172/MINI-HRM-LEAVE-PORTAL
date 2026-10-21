import { Role } from '@prisma/client';
export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: Role;
    department: string;
}
