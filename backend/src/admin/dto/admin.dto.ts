import { ContractType, Role } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Length,
  Min,
} from 'class-validator';

export class AdjustQuotaDto {
  @IsNotEmpty({ message: 'Vui lòng nhập số ngày phép mới' })
  @IsNumber({}, { message: 'Số ngày phép phải là số' })
  @Min(0, { message: 'Số ngày phép không được âm' })
  newQuota: number;

  @IsNotEmpty({ message: 'Lý do điều chỉnh không được để trống (theo BR-15)' })
  @Length(5, 500, { message: 'Lý do điều chỉnh tối thiểu 5 ký tự' })
  reason: string;
}

export class UpdateUserRoleContractDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  position?: string;

  @IsOptional()
  department?: string;

  @IsOptional()
  @IsNumber()
  seniorityYears?: number;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @Length(2, 50, { message: 'Họ và tên phải có độ dài từ 2 đến 50 ký tự' })
  fullName: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng chuẩn' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu khởi tạo không được để trống' })
  @Length(8, 100, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Vui lòng chọn vai trò' })
  @IsEnum(Role, { message: 'Vai trò phải là EMPLOYEE, MANAGER, DIRECTOR, HR hoặc ADMIN' })
  role: Role;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsNotEmpty({ message: 'Chức danh không được để trống' })
  position: string;

  @IsNotEmpty({ message: 'Phòng ban không được để trống' })
  department: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualLeaveQuota?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  seniorityYears?: number;
}

export class UpdateSsoConfigDto {
  @IsOptional()
  @IsBoolean()
  googleEnabled?: boolean;

  @IsOptional()
  googleClientId?: string;

  @IsOptional()
  @IsBoolean()
  microsoftEnabled?: boolean;

  @IsOptional()
  microsoftTenantId?: string;

  @IsOptional()
  @IsBoolean()
  enforceMfa?: boolean;
}

export class CreateHolidayDto {
  @IsNotEmpty({ message: 'Tên ngày Lễ/Tết không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'Ngày Lễ không được để trống' })
  @IsDateString({}, { message: 'Ngày Lễ không đúng định dạng ISO' })
  date: string;

  @IsOptional()
  description?: string;
}

export class LockPayrollPeriodDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp mã kỳ công (ví dụ: 10/2026)' })
  monthYear: string;
}
