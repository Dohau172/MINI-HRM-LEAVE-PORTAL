import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu và xác nhận mật khẩu không trùng khớp.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng trong hệ thống.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role,
        department: dto.department,
        annualLeaveQuota: 12.0, // Mặc định cấp 12 ngày phép theo FR-01 & BR-01
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    let redirectPath = '/employee';
    if (user.role === Role.ADMIN || user.role === Role.HR) {
      redirectPath = '/admin';
    } else if (user.role === Role.MANAGER || user.role === Role.DIRECTOR) {
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

  async getMe(userId: string) {
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
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }
    return user;
  }
}
