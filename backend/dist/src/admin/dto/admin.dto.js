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
exports.LockPayrollPeriodDto = exports.CreateHolidayDto = exports.UpdateSsoConfigDto = exports.CreateUserDto = exports.UpdateUserRoleContractDto = exports.AdjustQuotaDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AdjustQuotaDto {
}
exports.AdjustQuotaDto = AdjustQuotaDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập số ngày phép mới' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Số ngày phép phải là số' }),
    (0, class_validator_1.Min)(0, { message: 'Số ngày phép không được âm' }),
    __metadata("design:type", Number)
], AdjustQuotaDto.prototype, "newQuota", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Lý do điều chỉnh không được để trống (theo BR-15)' }),
    (0, class_validator_1.Length)(5, 500, { message: 'Lý do điều chỉnh tối thiểu 5 ký tự' }),
    __metadata("design:type", String)
], AdjustQuotaDto.prototype, "reason", void 0);
class UpdateUserRoleContractDto {
}
exports.UpdateUserRoleContractDto = UpdateUserRoleContractDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], UpdateUserRoleContractDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ContractType),
    __metadata("design:type", String)
], UpdateUserRoleContractDto.prototype, "contractType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserRoleContractDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserRoleContractDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateUserRoleContractDto.prototype, "seniorityYears", void 0);
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Họ và tên không được để trống' }),
    (0, class_validator_1.Length)(2, 50, { message: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Email không được để trống' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email không đúng định dạng chuẩn' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Mật khẩu khởi tạo không được để trống' }),
    (0, class_validator_1.Length)(8, 100, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn vai trò' }),
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'Vai trò phải là EMPLOYEE, MANAGER, DIRECTOR, HR hoặc ADMIN' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ContractType),
    __metadata("design:type", String)
], CreateUserDto.prototype, "contractType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Chức danh không được để trống' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Phòng ban không được để trống' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "annualLeaveQuota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "seniorityYears", void 0);
class UpdateSsoConfigDto {
}
exports.UpdateSsoConfigDto = UpdateSsoConfigDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSsoConfigDto.prototype, "googleEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSsoConfigDto.prototype, "googleClientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSsoConfigDto.prototype, "microsoftEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSsoConfigDto.prototype, "microsoftTenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSsoConfigDto.prototype, "enforceMfa", void 0);
class CreateHolidayDto {
}
exports.CreateHolidayDto = CreateHolidayDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Tên ngày Lễ/Tết không được để trống' }),
    __metadata("design:type", String)
], CreateHolidayDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Ngày Lễ không được để trống' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Ngày Lễ không đúng định dạng ISO' }),
    __metadata("design:type", String)
], CreateHolidayDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateHolidayDto.prototype, "description", void 0);
class LockPayrollPeriodDto {
}
exports.LockPayrollPeriodDto = LockPayrollPeriodDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng cung cấp mã kỳ công (ví dụ: 10/2026)' }),
    __metadata("design:type", String)
], LockPayrollPeriodDto.prototype, "monthYear", void 0);
//# sourceMappingURL=admin.dto.js.map