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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./dto/admin.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }
    async createUser(adminId, dto, ipAddress) {
        return this.adminService.createUser(dto, adminId, ipAddress);
    }
    async adjustQuota(adminId, targetUserId, dto, ipAddress) {
        return this.adminService.adjustQuota(adminId, targetUserId, dto, ipAddress);
    }
    async updateUser(adminId, targetUserId, dto, ipAddress) {
        return this.adminService.updateUser(adminId, targetUserId, dto, ipAddress);
    }
    async getAuditLogs() {
        return this.adminService.getAuditLogs();
    }
    async getHolidays() {
        return this.adminService.getHolidays();
    }
    async createHoliday(dto) {
        return this.adminService.createHoliday(dto);
    }
    async deleteHoliday(id) {
        return this.adminService.deleteHoliday(id);
    }
    async getPayrollPeriods() {
        return this.adminService.getPayrollPeriods();
    }
    async lockPayrollPeriod(adminEmail, dto) {
        return this.adminService.lockPayrollPeriod(adminEmail, dto);
    }
    async unlockPayrollPeriod(id) {
        return this.adminService.unlockPayrollPeriod(id);
    }
    async getPayrollSummary(monthYear) {
        return this.adminService.getPayrollSummary(monthYear || '10/2026');
    }
    async getSsoConfig() {
        return this.adminService.getSsoConfig();
    }
    async updateSsoConfig(adminEmail, dto) {
        return this.adminService.updateSsoConfig(dto, adminEmail);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.HR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.CreateUserDto, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/adjust-quota'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.AdjustQuotaDto, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustQuota", null);
__decorate([
    (0, common_1.Patch)('users/:id/update'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UpdateUserRoleContractDto, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.HR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('holidays'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getHolidays", null);
__decorate([
    (0, common_1.Post)('holidays'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateHolidayDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createHoliday", null);
__decorate([
    (0, common_1.Delete)('holidays/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteHoliday", null);
__decorate([
    (0, common_1.Get)('payroll-periods'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPayrollPeriods", null);
__decorate([
    (0, common_1.Post)('payroll-periods/lock'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, current_user_decorator_1.CurrentUser)('email')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.LockPayrollPeriodDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "lockPayrollPeriod", null);
__decorate([
    (0, common_1.Patch)('payroll-periods/:id/unlock'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unlockPayrollPeriod", null);
__decorate([
    (0, common_1.Get)('payroll/summary'),
    (0, roles_decorator_1.Roles)(client_1.Role.HR),
    __param(0, (0, common_1.Query)('monthYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPayrollSummary", null);
__decorate([
    (0, common_1.Get)('system/sso-config'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSsoConfig", null);
__decorate([
    (0, common_1.Post)('system/sso-config'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('email')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateSsoConfigDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSsoConfig", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.HR),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map