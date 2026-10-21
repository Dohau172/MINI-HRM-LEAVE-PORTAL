import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-mini-hrm-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
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
      throw new UnauthorizedException('Người dùng không tồn tại hoặc phiên đã hết hạn.');
    }

    return user;
  }
}
