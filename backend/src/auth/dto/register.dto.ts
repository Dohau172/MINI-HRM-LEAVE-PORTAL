import { IsEmail, IsEnum, IsNotEmpty, Length, Matches } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @Length(2, 50, { message: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự' })
  fullName: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng chuẩn' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(8, 100, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và chữ số (theo BR-09)',
  })
  password: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;

  @IsNotEmpty({ message: 'Vui lòng chọn vai trò' })
  @IsEnum(Role, { message: 'Vai trò phải là EMPLOYEE hoặc MANAGER' })
  role: Role;

  @IsNotEmpty({ message: 'Vui lòng chọn phòng ban' })
  department: string;
}
