import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { LeaveService } from './leave.service';
import {
  CreateLeaveDto,
  EditLeaveDto,
  RejectLeaveDto,
  CalculateDaysDto,
  CreateDelegationDto,
  RequestCancelDto,
  ConfirmCancelDto,
} from './dto/leave.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, LeaveStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Đảm bảo thư mục uploads tồn tại
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerConfig = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5.0 MB theo BR-08
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(
        new BadRequestException('Định dạng file không hợp lệ! Chỉ chấp nhận .pdf, .jpg, .jpeg, .png (theo BR-08).'),
        false,
      );
    }
    cb(null, true);
  },
};

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // CHỨC NĂNG CHUNG DÀNH CHO NHÂN SỰ
  // (Employee, Manager, Director đều có quyền xin nghỉ)
  // ==========================================

  @Get('balance')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async getBalance(@CurrentUser('id') userId: string) {
    return this.leaveService.getLeaveBalance(userId);
  }

  @Post('calculate-days')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async calculateDays(@Body() dto: CalculateDaysDto) {
    return this.leaveService.calculateDays(dto);
  }

  @Post('request')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLeaveDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.leaveService.createRequest(userId, dto, attachmentUrl);
  }

  @Get('my-requests')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async getMyRequests(@CurrentUser('id') userId: string) {
    return this.leaveService.getMyRequests(userId);
  }

  @Put('request/:id')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async editRequest(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: EditLeaveDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.leaveService.editRequest(userId, id, dto, attachmentUrl);
  }

  @Delete('request/:id/recall')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async recallRequest(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.leaveService.recallRequest(userId, id);
  }

  // Giữ alias cho endpoint cũ để tương thích
  @Delete('request/:id/cancel')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async cancelRequestOld(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.leaveService.recallRequest(userId, id);
  }

  @Post('request/:id/request-cancel')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async requestCancelApproved(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RequestCancelDto,
  ) {
    return this.leaveService.requestCancelApproved(userId, id, dto);
  }

  @Get('team-calendar')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.DIRECTOR, Role.HR, Role.ADMIN)
  async getTeamCalendar(
    @Query('department') department?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month !== undefined ? parseInt(month, 10) : undefined;
    const y = year !== undefined ? parseInt(year, 10) : undefined;
    return this.leaveService.getTeamCalendar(department, m, y);
  }

  // ==========================================
  // CHỨC NĂNG DÀNH CHO QUẢN LÝ / GIÁM ĐỐC (APPROVAL)
  // ==========================================

  @Get('manager/requests')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async getManagerRequests(
    @CurrentUser() user: any,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.leaveService.getManagerRequests(user, status);
  }

  @Patch('manager/request/:id/approve')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async approveRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.leaveService.approveRequest(id, user);
  }

  @Patch('manager/request/:id/reject')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async rejectRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.leaveService.rejectRequest(id, user, dto);
  }

  @Patch('manager/request/:id/confirm-cancel')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async confirmCancelRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ConfirmCancelDto,
  ) {
    return this.leaveService.confirmCancelRequest(id, user, dto);
  }

  // ==========================================
  // ỦY QUYỀN DUYỆT ĐƠN (DELEGATION OF AUTHORITY - DoA)
  // ==========================================

  @Get('delegations')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async getDelegations(@CurrentUser('id') userId: string) {
    return this.leaveService.getDelegations(userId);
  }

  @Post('delegations')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async createDelegation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDelegationDto,
  ) {
    return this.leaveService.createDelegation(userId, dto);
  }

  @Patch('delegations/:id/revoke')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async revokeDelegation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.leaveService.revokeDelegation(userId, id);
  }

  @Get('potential-delegatees')
  @Roles(Role.MANAGER, Role.DIRECTOR)
  async getPotentialDelegatees(@CurrentUser() user: any) {
    // Trả về danh sách quản lý hoặc đồng nghiệp có thể nhận ủy quyền
    return this.prisma.user.findMany({
      where: {
        id: { not: user.id },
        role: { in: [Role.MANAGER, Role.DIRECTOR] },
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        department: true,
        email: true,
      },
    });
  }
}
