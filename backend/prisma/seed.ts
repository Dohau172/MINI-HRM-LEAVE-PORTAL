import { PrismaClient, Role, ContractType, LeaveType, LeaveStatus, LeaveUnit } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding enterprise data for Mini HRM Leave Portal (SRS v3.2)...');

  // Xóa sạch dữ liệu cũ theo thứ tự quan hệ
  await prisma.auditLog.deleteMany({});
  await prisma.delegation.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.publicHoliday.deleteMany({});
  await prisma.payrollPeriod.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('Pass@123', 10);

  // 1. Khởi tạo Danh mục Ngày Lễ, Tết năm 2026 (Public Holidays - BR-05)
  const holidays = [
    { name: 'Tết Dương Lịch 2026', date: new Date('2026-01-01T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán (Mùng 1)', date: new Date('2026-02-17T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán (Mùng 2)', date: new Date('2026-02-18T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán (Mùng 3)', date: new Date('2026-02-19T00:00:00.000Z') },
    { name: 'Giỗ Tổ Hùng Vương (10/3 ÂL)', date: new Date('2026-04-26T00:00:00.000Z') },
    { name: 'Giải phóng miền Nam (30/4)', date: new Date('2026-04-30T00:00:00.000Z') },
    { name: 'Quốc tế Lao động (1/5)', date: new Date('2026-05-01T00:00:00.000Z') },
    { name: 'Quốc khánh (2/9)', date: new Date('2026-09-02T00:00:00.000Z') },
  ];

  for (const h of holidays) {
    await prisma.publicHoliday.create({ data: h });
  }
  console.log(`Seeded ${holidays.length} Public Holidays.`);

  // 2. Khởi tạo Kỳ tính lương (Payroll Period - ngày 25 hàng tháng - FR-12)
  await prisma.payrollPeriod.create({
    data: {
      monthYear: '09/2026',
      startDate: new Date('2026-08-26T00:00:00.000Z'),
      endDate: new Date('2026-09-25T00:00:00.000Z'),
      isLocked: true, // Đã chốt khóa sổ kỳ tháng 9
      lockedAt: new Date('2026-09-25T17:00:00.000Z'),
      lockedBy: 'admin@company.vn',
    },
  });

  await prisma.payrollPeriod.create({
    data: {
      monthYear: '10/2026',
      startDate: new Date('2026-09-26T00:00:00.000Z'),
      endDate: new Date('2026-10-25T00:00:00.000Z'),
      isLocked: false, // Kỳ tháng 10 đang mở
    },
  });
  console.log('Seeded Payroll Periods.');

  // 3. Khởi tạo các Tài khoản mẫu chuẩn theo SRS Mục 7
  // Tài khoản 1: IT Admin (System Admin - Quản trị kỹ thuật & Giám sát Audit Log)
  const itadmin = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Hoàng Bách',
      email: 'itadmin@company.vn',
      password: defaultPassword,
      role: Role.ADMIN,
      contractType: ContractType.OFFICIAL,
      position: 'Chuyên viên An ninh Thông tin & IT Admin',
      department: 'Công nghệ Thông tin',
      canApprove: false, // IT Admin không duyệt đơn hay chốt lương
      annualLeaveQuota: 12.0,
      previousYearQuota: 0.0,
      seniorityYears: 3,
    },
  });

  // Tài khoản 2: HR Manager (Business Admin - Vận hành nhân sự & Tiền lương)
  const admin = await prisma.user.create({
    data: {
      fullName: 'Hoàng Thu Trang',
      email: 'admin@company.vn',
      password: defaultPassword,
      role: Role.HR, // Phân định rõ vai trò HR Manager theo SRS v3.3
      contractType: ContractType.OFFICIAL,
      position: 'Trưởng phòng Nhân sự (HR Manager)',
      department: 'Nhân sự',
      canApprove: true,
      annualLeaveQuota: 15.0,
      previousYearQuota: 2.0,
      seniorityYears: 5,
    },
  });

  // Tài khoản 2: Giám đốc bộ phận (Head of Department)
  const director = await prisma.user.create({
    data: {
      fullName: 'Lê Khắc Hoàng',
      email: 'director@company.vn',
      password: defaultPassword,
      role: Role.DIRECTOR,
      contractType: ContractType.OFFICIAL,
      position: 'Giám đốc Khối Kỹ thuật',
      department: 'Kỹ thuật',
      canApprove: true,
      annualLeaveQuota: 16.0,
      previousYearQuota: 4.0,
      seniorityYears: 7,
    },
  });

  // Tài khoản 3: Quản lý trực tiếp (Line Manager)
  const manager = await prisma.user.create({
    data: {
      fullName: 'Trần Thị Mai',
      email: 'mai.tran@company.vn',
      password: defaultPassword,
      role: Role.MANAGER,
      contractType: ContractType.OFFICIAL,
      position: 'Trưởng phòng Kỹ thuật',
      department: 'Kỹ thuật',
      canApprove: true,
      annualLeaveQuota: 14.0,
      previousYearQuota: 3.0,
      seniorityYears: 4,
    },
  });

  // Tài khoản 4: Quản lý ủy quyền (DoA Delegatee)
  const deputy = await prisma.user.create({
    data: {
      fullName: 'Lê Anh Tuấn',
      email: 'tuan.le@company.vn',
      password: defaultPassword,
      role: Role.MANAGER,
      contractType: ContractType.OFFICIAL,
      position: 'Phó phòng Kỹ thuật',
      department: 'Kỹ thuật',
      canApprove: true,
      annualLeaveQuota: 13.0,
      previousYearQuota: 1.0,
      seniorityYears: 3,
    },
  });

  // Tài khoản 5: Nhân viên chính thức (thâm niên 3 năm)
  const employee = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@company.vn',
      password: defaultPassword,
      role: Role.EMPLOYEE,
      contractType: ContractType.OFFICIAL,
      position: 'Kỹ sư phần mềm (Senior)',
      department: 'Kỹ thuật',
      canApprove: false,
      annualLeaveQuota: 13.0, // 12 + 1 ngày thâm niên
      previousYearQuota: 3.0,  // Phép tồn năm cũ
      seniorityYears: 3,
    },
  });

  // Tài khoản 6: Nhân viên thử việc (Probation)
  const probation = await prisma.user.create({
    data: {
      fullName: 'Đặng Thùy Linh',
      email: 'linh.dang@company.vn',
      password: defaultPassword,
      role: Role.EMPLOYEE,
      contractType: ContractType.PROBATION,
      position: 'Nhân viên Thử việc (Frontend Dev)',
      department: 'Kỹ thuật',
      canApprove: false,
      annualLeaveQuota: 0.0, // Chưa có phép năm
      previousYearQuota: 0.0,
      seniorityYears: 0,
    },
  });

  console.log('Seeded 6 Pre-seeded Accounts successfully.');

  // 4. Khởi tạo một số Đơn nghỉ phép mẫu để test các luồng
  // Đơn 1: Đơn 1 ngày của Nguyễn Văn An đã duyệt trong quá khứ
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveType: LeaveType.ANNUAL,
      leaveUnit: LeaveUnit.FULL_DAY,
      startDate: new Date('2026-10-02T00:00:00.000Z'),
      endDate: new Date('2026-10-02T00:00:00.000Z'),
      workingDays: 1.0,
      reason: 'Giải quyết công việc gia đình',
      status: LeaveStatus.APPROVED,
      approvalLevel: 1,
      approvedById: manager.id,
    },
  });

  // Đơn 2: Đơn ngắn (< 3 ngày) đang Chờ duyệt (Cấp 1 - Quản lý trực tiếp)
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveType: LeaveType.ANNUAL,
      leaveUnit: LeaveUnit.FULL_DAY,
      startDate: new Date('2026-10-15T00:00:00.000Z'),
      endDate: new Date('2026-10-16T00:00:00.000Z'),
      workingDays: 2.0,
      reason: 'Đưa người thân đi khám sức khỏe định kỳ',
      status: LeaveStatus.PENDING,
      approvalLevel: 1,
    },
  });

  // Đơn 3: Đơn dài ngày (>= 3 ngày) đang Chờ Giám đốc duyệt (Cấp 2)
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveType: LeaveType.ANNUAL,
      leaveUnit: LeaveUnit.FULL_DAY,
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-23T00:00:00.000Z'),
      workingDays: 4.0, // 4 ngày làm việc
      reason: 'Nghỉ phép năm đi du lịch cùng gia đình',
      status: LeaveStatus.PENDING_DIRECTOR,
      approvalLevel: 2,
    },
  });

  // 5. Khởi tạo 1 Thiết lập Ủy quyền DoA mẫu:
  // Quản lý Trần Thị Mai ủy quyền cho Lê Anh Tuấn trong 5 ngày
  await prisma.delegation.create({
    data: {
      delegatorId: manager.id,
      delegateeId: deputy.id,
      startDate: new Date('2026-10-10T00:00:00.000Z'),
      endDate: new Date('2026-10-25T00:00:00.000Z'),
      reason: 'Đi công tác chi nhánh miền Trung',
      isActive: true,
    },
  });
  console.log('Seeded active Delegation of Authority (DoA).');

  console.log('All Seeding Completed Successfully! Ready for enterprise operations.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
