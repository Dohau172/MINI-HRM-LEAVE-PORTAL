"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding enterprise data for Mini HRM Leave Portal (SRS v3.2)...');
    await prisma.auditLog.deleteMany({});
    await prisma.delegation.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.publicHoliday.deleteMany({});
    await prisma.payrollPeriod.deleteMany({});
    await prisma.user.deleteMany({});
    const defaultPassword = await bcrypt.hash('Pass@123', 10);
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
    await prisma.payrollPeriod.create({
        data: {
            monthYear: '09/2026',
            startDate: new Date('2026-08-26T00:00:00.000Z'),
            endDate: new Date('2026-09-25T00:00:00.000Z'),
            isLocked: true,
            lockedAt: new Date('2026-09-25T17:00:00.000Z'),
            lockedBy: 'admin@company.vn',
        },
    });
    await prisma.payrollPeriod.create({
        data: {
            monthYear: '10/2026',
            startDate: new Date('2026-09-26T00:00:00.000Z'),
            endDate: new Date('2026-10-25T00:00:00.000Z'),
            isLocked: false,
        },
    });
    console.log('Seeded Payroll Periods.');
    const itadmin = await prisma.user.create({
        data: {
            fullName: 'Nguyễn Hoàng Bách',
            email: 'itadmin@company.vn',
            password: defaultPassword,
            role: client_1.Role.ADMIN,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Chuyên viên An ninh Thông tin & IT Admin',
            department: 'Công nghệ Thông tin',
            canApprove: false,
            annualLeaveQuota: 12.0,
            previousYearQuota: 0.0,
            seniorityYears: 3,
        },
    });
    const admin = await prisma.user.create({
        data: {
            fullName: 'Hoàng Thu Trang',
            email: 'admin@company.vn',
            password: defaultPassword,
            role: client_1.Role.HR,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Trưởng phòng Nhân sự (HR Manager)',
            department: 'Nhân sự',
            canApprove: true,
            annualLeaveQuota: 15.0,
            previousYearQuota: 2.0,
            seniorityYears: 5,
        },
    });
    const director = await prisma.user.create({
        data: {
            fullName: 'Lê Khắc Hoàng',
            email: 'director@company.vn',
            password: defaultPassword,
            role: client_1.Role.DIRECTOR,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Giám đốc Khối Kỹ thuật',
            department: 'Kỹ thuật',
            canApprove: true,
            annualLeaveQuota: 16.0,
            previousYearQuota: 4.0,
            seniorityYears: 7,
        },
    });
    const manager = await prisma.user.create({
        data: {
            fullName: 'Trần Thị Mai',
            email: 'mai.tran@company.vn',
            password: defaultPassword,
            role: client_1.Role.MANAGER,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Trưởng phòng Kỹ thuật',
            department: 'Kỹ thuật',
            canApprove: true,
            annualLeaveQuota: 14.0,
            previousYearQuota: 3.0,
            seniorityYears: 4,
        },
    });
    const deputy = await prisma.user.create({
        data: {
            fullName: 'Lê Anh Tuấn',
            email: 'tuan.le@company.vn',
            password: defaultPassword,
            role: client_1.Role.MANAGER,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Phó phòng Kỹ thuật',
            department: 'Kỹ thuật',
            canApprove: true,
            annualLeaveQuota: 13.0,
            previousYearQuota: 1.0,
            seniorityYears: 3,
        },
    });
    const employee = await prisma.user.create({
        data: {
            fullName: 'Nguyễn Văn An',
            email: 'an.nguyen@company.vn',
            password: defaultPassword,
            role: client_1.Role.EMPLOYEE,
            contractType: client_1.ContractType.OFFICIAL,
            position: 'Kỹ sư phần mềm (Senior)',
            department: 'Kỹ thuật',
            canApprove: false,
            annualLeaveQuota: 13.0,
            previousYearQuota: 3.0,
            seniorityYears: 3,
        },
    });
    const probation = await prisma.user.create({
        data: {
            fullName: 'Đặng Thùy Linh',
            email: 'linh.dang@company.vn',
            password: defaultPassword,
            role: client_1.Role.EMPLOYEE,
            contractType: client_1.ContractType.PROBATION,
            position: 'Nhân viên Thử việc (Frontend Dev)',
            department: 'Kỹ thuật',
            canApprove: false,
            annualLeaveQuota: 0.0,
            previousYearQuota: 0.0,
            seniorityYears: 0,
        },
    });
    console.log('Seeded 6 Pre-seeded Accounts successfully.');
    await prisma.leaveRequest.create({
        data: {
            userId: employee.id,
            leaveType: client_1.LeaveType.ANNUAL,
            leaveUnit: client_1.LeaveUnit.FULL_DAY,
            startDate: new Date('2026-10-02T00:00:00.000Z'),
            endDate: new Date('2026-10-02T00:00:00.000Z'),
            workingDays: 1.0,
            reason: 'Giải quyết công việc gia đình',
            status: client_1.LeaveStatus.APPROVED,
            approvalLevel: 1,
            approvedById: manager.id,
        },
    });
    await prisma.leaveRequest.create({
        data: {
            userId: employee.id,
            leaveType: client_1.LeaveType.ANNUAL,
            leaveUnit: client_1.LeaveUnit.FULL_DAY,
            startDate: new Date('2026-10-15T00:00:00.000Z'),
            endDate: new Date('2026-10-16T00:00:00.000Z'),
            workingDays: 2.0,
            reason: 'Đưa người thân đi khám sức khỏe định kỳ',
            status: client_1.LeaveStatus.PENDING,
            approvalLevel: 1,
        },
    });
    await prisma.leaveRequest.create({
        data: {
            userId: employee.id,
            leaveType: client_1.LeaveType.ANNUAL,
            leaveUnit: client_1.LeaveUnit.FULL_DAY,
            startDate: new Date('2026-10-20T00:00:00.000Z'),
            endDate: new Date('2026-10-23T00:00:00.000Z'),
            workingDays: 4.0,
            reason: 'Nghỉ phép năm đi du lịch cùng gia đình',
            status: client_1.LeaveStatus.PENDING_DIRECTOR,
            approvalLevel: 2,
        },
    });
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
//# sourceMappingURL=seed.js.map