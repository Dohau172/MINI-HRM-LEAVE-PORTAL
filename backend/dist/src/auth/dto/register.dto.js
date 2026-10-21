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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Họ và tên không được để trống' }),
    (0, class_validator_1.Length)(2, 50, { message: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Email không được để trống' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email không đúng định dạng chuẩn' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Mật khẩu không được để trống' }),
    (0, class_validator_1.Length)(8, 100, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' }),
    (0, class_validator_1.Matches)(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Mật khẩu phải bao gồm cả chữ cái và chữ số (theo BR-09)',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Xác nhận mật khẩu không được để trống' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "confirmPassword", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn vai trò' }),
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'Vai trò phải là EMPLOYEE hoặc MANAGER' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng chọn phòng ban' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "department", void 0);
//# sourceMappingURL=register.dto.js.map