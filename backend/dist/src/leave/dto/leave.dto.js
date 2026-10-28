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
exports.ConfirmCancelDto = exports.RequestCancelDto = exports.CreateDelegationDto = exports.CalculateDaysDto = exports.RejectLeaveDto = exports.EditLeaveDto = exports.CreateLeaveDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateLeaveDto {
}
exports.CreateLeaveDto = CreateLeaveDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn hình thức nghỉ' }),
    (0, class_validator_1.IsEnum)(client_1.LeaveType, { message: 'Hình thức nghỉ không hợp lệ' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "leaveType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn đơn vị nghỉ' }),
    (0, class_validator_1.IsEnum)(client_1.LeaveUnit, { message: 'Đơn vị nghỉ không hợp lệ' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "leaveUnit", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn Từ ngày' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn Đến ngày' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Lý do nghỉ không được để trống' }),
    (0, class_validator_1.Length)(10, 500, { message: 'Lý do nghỉ phải có độ dài tối thiểu 10 ký tự (theo FR-05)' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "attachmentUrl", void 0);
class EditLeaveDto {
}
exports.EditLeaveDto = EditLeaveDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveType),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "leaveType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveUnit),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "leaveUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(10, 500, { message: 'Lý do nghỉ phải có độ dài tối thiểu 10 ký tự' }),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EditLeaveDto.prototype, "attachmentUrl", void 0);
class RejectLeaveDto {
}
exports.RejectLeaveDto = RejectLeaveDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Lý do từ chối không được để trống' }),
    (0, class_validator_1.Length)(10, 500),
    __metadata("design:type", String)
], RejectLeaveDto.prototype, "rejectReason", void 0);
class CalculateDaysDto {
}
exports.CalculateDaysDto = CalculateDaysDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CalculateDaysDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CalculateDaysDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveUnit),
    __metadata("design:type", String)
], CalculateDaysDto.prototype, "leaveUnit", void 0);
class CreateDelegationDto {
}
exports.CreateDelegationDto = CreateDelegationDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn người nhận ủy quyền' }),
    __metadata("design:type", String)
], CreateDelegationDto.prototype, "delegateeId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn ngày bắt đầu ủy quyền' }),
    __metadata("design:type", String)
], CreateDelegationDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn ngày kết thúc ủy quyền' }),
    __metadata("design:type", String)
], CreateDelegationDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập lý do ủy quyền' }),
    (0, class_validator_1.Length)(5, 500, { message: 'Lý do ủy quyền tối thiểu 5 ký tự' }),
    __metadata("design:type", String)
], CreateDelegationDto.prototype, "reason", void 0);
class RequestCancelDto {
}
exports.RequestCancelDto = RequestCancelDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập lý do hủy đơn đã duyệt' }),
    (0, class_validator_1.Length)(5, 500, { message: 'Lý do hủy đơn tối thiểu 5 ký tự' }),
    __metadata("design:type", String)
], RequestCancelDto.prototype, "cancelReason", void 0);
class ConfirmCancelDto {
}
exports.ConfirmCancelDto = ConfirmCancelDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng xác nhận đồng ý hoặc từ chối hủy' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfirmCancelDto.prototype, "approve", void 0);
//# sourceMappingURL=leave.dto.js.map