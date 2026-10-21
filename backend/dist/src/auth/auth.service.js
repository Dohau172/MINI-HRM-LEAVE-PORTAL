"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Mật khẩu và xác nhận mật khẩu không trùng khớp.');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email này đã được sử dụng trong hệ thống.');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName.trim(),
                email: dto.email.toLowerCase().trim(),
                password: hashedPassword,
                role: dto.role,
                department: dto.department,
                annualLeaveQuota: 12.0,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                department: true,
                annualLeaveQuota: true,
            },
        });
        return {
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
            user,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không chính xác.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không chính xác.');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = this.jwtService.sign(payload);
        let redirectPath = '/employee';
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.HR) {
            redirectPath = '/admin';
        }
        else if (user.role === client_1.Role.MANAGER || user.role === client_1.Role.DIRECTOR) {
            redirectPath = '/manager';
        }
        return {
            accessToken: token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                contractType: user.contractType,
                position: user.position,
                department: user.department,
                canApprove: user.canApprove,
                annualLeaveQuota: user.annualLeaveQuota,
                previousYearQuota: user.previousYearQuota,
                seniorityYears: user.seniorityYears,
            },
            redirectPath,
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                contractType: true,
                position: true,
                department: true,
                canApprove: true,
                annualLeaveQuota: true,
                previousYearQuota: true,
                seniorityYears: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Phiên đăng nhập không hợp lệ.');
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map