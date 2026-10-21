import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdjustQuotaDto,
  CreateHolidayDto,
  CreateUserDto,
  LockPayrollPeriodDto,
  UpdateSsoConfigDto,
  UpdateUserRoleContractDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR) // BR-14: Cổng /admin/* chỉ dành riêng cho IT Admin và HR Manager
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Quản lý Hồ sơ & Chức danh Nhân sự (Cả HR Manager và IT Admin đều xem được)
  @Get('users')
  @Roles(Role.ADMIN, Role.HR)
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // 2. IT Admin Cấp phát Tài khoản Gốc (SoD: Chỉ dành riêng cho IT Admin)
  @Post('users')
  @Roles(Role.ADMIN)
  async createUser(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateUserDto,
    @Ip() ipAddress: string,
  ) {
    return this.adminService.createUser(dto, adminId, ipAddress);
  }

  // 3. HR Manager Điều chỉnh Quỹ phép Thủ công & Ghi Audit Log (SoD: Chỉ dành riêng cho HR Manager - FR-05 & BR-15)
  @Patch('users/:id/adjust-quota')
  @Roles(Role.HR)
  async adjustQuota(
    @CurrentUser('id') adminId: string,
    @Param('id') targetUserId: string,
    @Body() dto: AdjustQuotaDto,
    @Ip() ipAddress: string,
  ) {
    return this.adminService.adjustQuota(adminId, targetUserId, dto, ipAddress);
  }

  // 4. Cập nhật phân loại Hợp đồng & Chức vụ (HR Manager & IT Admin)
  @Patch('users/:id/update')
  @Roles(Role.HR, Role.ADMIN)
  async updateUser(
    @CurrentUser('id') adminId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleContractDto,
    @Ip() ipAddress: string,
  ) {
    return this.adminService.updateUser(adminId, targetUserId, dto, ipAddress);
  }

  // 5. Xem Nhật ký Kiểm toán Bất biến (Audit Log Trail) (IT Admin giám sát bất biến, HR Manager đối soát)
  @Get('audit-logs')
  @Roles(Role.ADMIN, Role.HR)
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  // 6. Quản lý Danh mục Ngày Lễ, Tết (SoD: Chỉ dành riêng cho HR Manager - FR-01 & BR-05)
  @Get('holidays')
  @Roles(Role.HR, Role.ADMIN)
  async getHolidays() {
    return this.adminService.getHolidays();
  }

  @Post('holidays')
  @Roles(Role.HR)
  async createHoliday(@Body() dto: CreateHolidayDto) {
    return this.adminService.createHoliday(dto);
  }

  @Delete('holidays/:id')
  @Roles(Role.HR)
  async deleteHoliday(@Param('id') id: string) {
    return this.adminService.deleteHoliday(id);
  }

  // 7. Quản lý Kỳ công & Khóa sổ ngày 25 (SoD: Chỉ dành riêng cho HR Manager - FR-13 & BR-07)
  @Get('payroll-periods')
  @Roles(Role.HR, Role.ADMIN)
  async getPayrollPeriods() {
    return this.adminService.getPayrollPeriods();
  }

  @Post('payroll-periods/lock')
  @Roles(Role.HR)
  async lockPayrollPeriod(
    @CurrentUser('email') adminEmail: string,
    @Body() dto: LockPayrollPeriodDto,
  ) {
    return this.adminService.lockPayrollPeriod(adminEmail, dto);
  }

  @Patch('payroll-periods/:id/unlock')
  @Roles(Role.HR)
  async unlockPayrollPeriod(@Param('id') id: string) {
    return this.adminService.unlockPayrollPeriod(id);
  }

  // 8. Dữ liệu tổng hợp Tiền lương (SoD: Chỉ dành riêng cho HR Manager - FR-14)
  @Get('payroll/summary')
  @Roles(Role.HR)
  async getPayrollSummary(@Query('monthYear') monthYear?: string) {
    return this.adminService.getPayrollSummary(monthYear || '10/2026');
  }

  // 9. Quản trị Hạ tầng & Cấu hình SSO (SoD: Chỉ dành riêng cho IT Admin)
  @Get('system/sso-config')
  @Roles(Role.ADMIN)
  async getSsoConfig() {
    return this.adminService.getSsoConfig();
  }

  @Post('system/sso-config')
  @Roles(Role.ADMIN)
  async updateSsoConfig(
    @CurrentUser('email') adminEmail: string,
    @Body() dto: UpdateSsoConfigDto,
  ) {
    return this.adminService.updateSsoConfig(dto, adminEmail);
  }
}
