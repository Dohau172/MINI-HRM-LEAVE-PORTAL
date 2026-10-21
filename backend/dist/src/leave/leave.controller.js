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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = require("fs");
const leave_service_1 = require("./leave.service");
const leave_dto_1 = require("./dto/leave.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const multerConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: uploadDir,
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = (0, path_1.extname)(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return cb(new common_1.BadRequestException('Định dạng file không hợp lệ! Chỉ chấp nhận .pdf, .jpg, .jpeg, .png (theo BR-08).'), false);
        }
        cb(null, true);
    },
};
let LeaveController = class LeaveController {
    constructor(leaveService, prisma) {
        this.leaveService = leaveService;
        this.prisma = prisma;
    }
    async getBalance(userId) {
        return this.leaveService.getLeaveBalance(userId);
    }
    async calculateDays(dto) {
        return this.leaveService.calculateDays(dto);
    }
    async createRequest(userId, dto, file) {
        const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
        return this.leaveService.createRequest(userId, dto, attachmentUrl);
    }
    async getMyRequests(userId) {
        return this.leaveService.getMyRequests(userId);
    }
    async editRequest(userId, id, dto, file) {
        const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
        return this.leaveService.editRequest(userId, id, dto, attachmentUrl);
    }
    async recallRequest(userId, id) {
        return this.leaveService.recallRequest(userId, id);
    }
    async cancelRequestOld(userId, id) {
        return this.leaveService.recallRequest(userId, id);
    }
    async requestCancelApproved(userId, id, dto) {
        return this.leaveService.requestCancelApproved(userId, id, dto);
    }
    async getTeamCalendar(department, month, year) {
        const m = month !== undefined ? parseInt(month, 10) : undefined;
        const y = year !== undefined ? parseInt(year, 10) : undefined;
        return this.leaveService.getTeamCalendar(department, m, y);
    }
    async getManagerRequests(user, status) {
        return this.leaveService.getManagerRequests(user, status);
    }
    async approveRequest(user, id) {
        return this.leaveService.approveRequest(id, user);
    }
    async rejectRequest(user, id, dto) {
        return this.leaveService.rejectRequest(id, user, dto);
    }
    async confirmCancelRequest(user, id, dto) {
        return this.leaveService.confirmCancelRequest(id, user, dto);
    }
    async getDelegations(userId) {
        return this.leaveService.getDelegations(userId);
    }
    async createDelegation(userId, dto) {
        return this.leaveService.createDelegation(userId, dto);
    }
    async revokeDelegation(userId, id) {
        return this.leaveService.revokeDelegation(userId, id);
    }
    async getPotentialDelegatees(user) {
        return this.prisma.user.findMany({
            where: {
                id: { not: user.id },
                role: { in: [client_1.Role.MANAGER, client_1.Role.DIRECTOR] },
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
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Get)('balance'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('calculate-days'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.CalculateDaysDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "calculateDays", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerConfig)),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_dto_1.CreateLeaveDto, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Put)('request/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerConfig)),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, leave_dto_1.EditLeaveDto, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "editRequest", null);
__decorate([
    (0, common_1.Delete)('request/:id/recall'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "recallRequest", null);
__decorate([
    (0, common_1.Delete)('request/:id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "cancelRequestOld", null);
__decorate([
    (0, common_1.Post)('request/:id/request-cancel'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, leave_dto_1.RequestCancelDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "requestCancelApproved", null);
__decorate([
    (0, common_1.Get)('team-calendar'),
    (0, roles_decorator_1.Roles)(client_1.Role.EMPLOYEE, client_1.Role.MANAGER, client_1.Role.DIRECTOR, client_1.Role.HR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('department')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getTeamCalendar", null);
__decorate([
    (0, common_1.Get)('manager/requests'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getManagerRequests", null);
__decorate([
    (0, common_1.Patch)('manager/request/:id/approve'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Patch)('manager/request/:id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, leave_dto_1.RejectLeaveDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Patch)('manager/request/:id/confirm-cancel'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, leave_dto_1.ConfirmCancelDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "confirmCancelRequest", null);
__decorate([
    (0, common_1.Get)('delegations'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getDelegations", null);
__decorate([
    (0, common_1.Post)('delegations'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_dto_1.CreateDelegationDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "createDelegation", null);
__decorate([
    (0, common_1.Patch)('delegations/:id/revoke'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "revokeDelegation", null);
__decorate([
    (0, common_1.Get)('potential-delegatees'),
    (0, roles_decorator_1.Roles)(client_1.Role.MANAGER, client_1.Role.DIRECTOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getPotentialDelegatees", null);
exports.LeaveController = LeaveController = __decorate([
    (0, common_1.Controller)('leave'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [leave_service_1.LeaveService,
        prisma_service_1.PrismaService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map