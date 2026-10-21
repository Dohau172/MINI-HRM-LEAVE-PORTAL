import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { LeaveType, LeaveUnit } from '@prisma/client';

export class CreateLeaveDto {
  @IsNotEmpty({ message: 'Vui lòng chọn hình thức nghỉ' })
  @IsEnum(LeaveType, { message: 'Hình thức nghỉ không hợp lệ' })
  leaveType: LeaveType;

  @IsNotEmpty({ message: 'Vui lòng chọn đơn vị nghỉ' })
  @IsEnum(LeaveUnit, { message: 'Đơn vị nghỉ không hợp lệ' })
  leaveUnit: LeaveUnit;

  @IsNotEmpty({ message: 'Vui lòng chọn Từ ngày' })
  startDate: string;

  @IsNotEmpty({ message: 'Vui lòng chọn Đến ngày' })
  endDate: string;

  @IsNotEmpty({ message: 'Lý do nghỉ không được để trống' })
  @Length(10, 500, { message: 'Lý do nghỉ phải có độ dài tối thiểu 10 ký tự (theo FR-05)' })
  reason: string;

  @IsOptional()
  attachmentUrl?: string;
}

export class EditLeaveDto {
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @IsOptional()
  @IsEnum(LeaveUnit)
  leaveUnit?: LeaveUnit;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  @Length(10, 500, { message: 'Lý do nghỉ phải có độ dài tối thiểu 10 ký tự' })
  reason?: string;

  @IsOptional()
  attachmentUrl?: string;
}

export class RejectLeaveDto {
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  // [SEEDED_BUG: BUG-08 (LOW)] - Thiếu thông điệp lỗi tiếng Việt thân thiện, trả về tiếng Anh mặc định của class-validator
  @Length(10, 500)
  rejectReason: string;
}

export class CalculateDaysDto {
  @IsNotEmpty()
  startDate: string;

  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsEnum(LeaveUnit)
  leaveUnit?: LeaveUnit;
}

export class CreateDelegationDto {
  @IsNotEmpty({ message: 'Vui lòng chọn người nhận ủy quyền' })
  delegateeId: string;

  @IsNotEmpty({ message: 'Vui lòng chọn ngày bắt đầu ủy quyền' })
  startDate: string;

  @IsNotEmpty({ message: 'Vui lòng chọn ngày kết thúc ủy quyền' })
  endDate: string;

  @IsNotEmpty({ message: 'Vui lòng nhập lý do ủy quyền' })
  @Length(5, 500, { message: 'Lý do ủy quyền tối thiểu 5 ký tự' })
  reason: string;
}

export class RequestCancelDto {
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy đơn đã duyệt' })
  @Length(5, 500, { message: 'Lý do hủy đơn tối thiểu 5 ký tự' })
  cancelReason: string;
}

export class ConfirmCancelDto {
  @IsNotEmpty({ message: 'Vui lòng xác nhận đồng ý hoặc từ chối hủy' })
  @IsBoolean()
  approve: boolean;
}
