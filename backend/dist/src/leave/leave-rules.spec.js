"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const leave_rules_util_1 = require("./leave-rules.util");
describe('Kiểm thử Quy tắc nghiệp vụ Cốt lõi (SRS v3.2 Core Business Rules)', () => {
    describe('BR-05: Weekend & Public Holiday Exclusion Rule', () => {
        it('Chỉ tính ngày làm việc (Thứ 2 đến Thứ 6), loại trừ Thứ 7 và Chủ nhật', () => {
            const days = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-09', '2026-10-12', client_1.LeaveUnit.FULL_DAY);
            expect(days).toBe(2.0);
        });
        it('Nghỉ trọn 1 tuần từ Thứ 2 đến Chủ nhật chỉ tính 5 ngày làm việc', () => {
            const days = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-12', '2026-10-18', client_1.LeaveUnit.FULL_DAY);
            expect(days).toBe(5.0);
        });
        it('Nếu chọn khoảng ngày hoàn toàn rơi vào Thứ 7 và Chủ nhật thì trả về 0 ngày', () => {
            const days = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-10', '2026-10-11', client_1.LeaveUnit.FULL_DAY);
            expect(days).toBe(0);
        });
        it('Tự động loại trừ ngày Lễ/Tết quốc gia nằm trong khoảng nghỉ', () => {
            const holidays = [
                new Date('2026-04-30T00:00:00.000Z'),
                new Date('2026-05-01T00:00:00.000Z'),
            ];
            const days = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-04-29', '2026-05-04', client_1.LeaveUnit.FULL_DAY, holidays);
            expect(days).toBe(2.0);
        });
    });
    describe('BR-06: Leave Unit & Half-Day Rule', () => {
        it('Nghỉ nửa ngày (0.5) hợp lệ khi Từ ngày trùng với Đến ngày (ngày trong tuần)', () => {
            const morning = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-13', client_1.LeaveUnit.MORNING);
            expect(morning).toBe(0.5);
            const afternoon = leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-13', client_1.LeaveUnit.AFTERNOON);
            expect(afternoon).toBe(0.5);
        });
        it('Báo lỗi nếu chọn nửa ngày khi Từ ngày khác Đến ngày (từ 2 ngày trở lên)', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-14', client_1.LeaveUnit.MORNING);
            }).toThrow('Nghỉ nửa ngày (0.5 ngày) chỉ được áp dụng khi Từ ngày trùng với Đến ngày');
        });
    });
    describe('BR-07: Backdated Leave & Payroll Lock Rule', () => {
        it('Báo lỗi nếu Đến ngày nhỏ hơn Từ ngày', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.calculateWorkingDays('2026-10-15', '2026-10-14', client_1.LeaveUnit.FULL_DAY);
            }).toThrow('Đến ngày phải lớn hơn hoặc bằng Từ ngày');
        });
        it('Hợp lệ nếu Từ ngày lùi về quá khứ trong giới hạn <= 3 ngày làm việc', () => {
            const refDate = new Date('2026-10-15T00:00:00.000Z');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-10-12', refDate, []);
            }).not.toThrow();
        });
        it('Báo lỗi nếu Từ ngày lùi về quá khứ quá 3 ngày làm việc', () => {
            const refDate = new Date('2026-10-15T00:00:00.000Z');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-10-09', refDate, []);
            }).toThrow('Từ ngày không được lùi về quá khứ quá 3 ngày làm việc');
        });
        it('Báo lỗi nếu nộp đơn vào khoảng thời gian thuộc kỳ công đã bị khóa', () => {
            const lockedCutoff = new Date('2026-09-25T23:59:59.999Z');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-09-24', new Date('2026-09-28'), [lockedCutoff]);
            }).toThrow('Khoảng thời gian nghỉ thuộc kỳ tính lương đã khóa sổ');
        });
    });
    describe('BR-01 & BR-04: Annual Leave Balance & Carry-Over Rule', () => {
        it('Hợp lệ khi số ngày xin nghỉ <= số phép khả dụng còn lại', () => {
            const balance = leave_rules_util_1.LeaveRulesUtil.validateAnnualLeaveBalance(2.0, 12.0, 9.0, 0, new Date('2026-10-15'));
            expect(balance.remaining).toBe(1.0);
        });
        it('Báo lỗi khi số ngày xin nghỉ vượt quá số phép còn lại', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateAnnualLeaveBalance(4.0, 12.0, 9.0, 0, new Date('2026-10-15'));
            }).toThrow('vượt quá số phép năm khả dụng còn lại');
        });
        it('Được cộng dồn phép tồn năm cũ nếu thời điểm xin nghỉ trước ngày 31/03', () => {
            const balance = leave_rules_util_1.LeaveRulesUtil.validateAnnualLeaveBalance(10.0, 12.0, 2.0, 3.0, new Date('2026-02-15'));
            expect(balance.available).toBe(13.0);
            expect(balance.remaining).toBe(3.0);
        });
    });
    describe('BR-02: Probationary Employee Constraints', () => {
        it('Nhân viên thử việc chỉ được phép xin Nghỉ không hưởng lương', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateProbationConstraint(client_1.ContractType.PROBATION, client_1.LeaveType.UNPAID);
            }).not.toThrow();
        });
        it('Báo lỗi nếu nhân viên thử việc chọn loại phép có hưởng lương', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateProbationConstraint(client_1.ContractType.PROBATION, client_1.LeaveType.ANNUAL);
            }).toThrow('Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương"');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateProbationConstraint(client_1.ContractType.PROBATION, client_1.LeaveType.SICK);
            }).toThrow('Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương"');
        });
    });
    describe('BR-08: Flexible Sick Leave Attachment Rule', () => {
        it('Nghỉ ốm dưới 2 ngày không bắt buộc có chứng từ y tế', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(client_1.LeaveType.SICK, 1.0, null);
            }).not.toThrow();
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(client_1.LeaveType.SICK, 0.5, undefined);
            }).not.toThrow();
        });
        it('Nghỉ ốm >= 2 ngày bắt buộc phải có chứng từ y tế hợp lệ', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(client_1.LeaveType.SICK, 2.0, null);
            }).toThrow('Nghỉ ốm đau từ 2 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateMedicalAttachment(client_1.LeaveType.SICK, 2.0, '/uploads/doctor-note.pdf');
            }).not.toThrow();
        });
    });
    describe('BR-09: Multi-level Approval Threshold Rule', () => {
        it('Đơn nghỉ dưới 3 ngày chỉ cần 1 cấp duyệt', () => {
            const result = leave_rules_util_1.LeaveRulesUtil.determineApprovalLevel(2.0);
            expect(result.approvalLevel).toBe(1);
        });
        it('Đơn nghỉ từ 3 ngày trở lên yêu cầu 2 cấp duyệt (Line Manager -> Giám đốc)', () => {
            const result = leave_rules_util_1.LeaveRulesUtil.determineApprovalLevel(3.0);
            expect(result.approvalLevel).toBe(2);
            const result4 = leave_rules_util_1.LeaveRulesUtil.determineApprovalLevel(4.5);
            expect(result4.approvalLevel).toBe(2);
        });
    });
    describe('BR-13: Overlapping Leave Rule', () => {
        const existingRequests = [
            {
                startDate: '2026-10-12',
                endDate: '2026-10-14',
                status: client_1.LeaveStatus.PENDING,
            },
            {
                startDate: '2026-10-20',
                endDate: '2026-10-22',
                status: client_1.LeaveStatus.APPROVED,
            },
            {
                startDate: '2026-10-26',
                endDate: '2026-10-28',
                status: client_1.LeaveStatus.REJECTED,
            },
        ];
        it('Báo lỗi nếu đơn mới trùng lặp với đơn PENDING', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateOverlapping('2026-10-13', '2026-10-15', existingRequests);
            }).toThrow('Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có');
        });
        it('Báo lỗi nếu đơn mới trùng lặp với đơn APPROVED', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateOverlapping('2026-10-19', '2026-10-21', existingRequests);
            }).toThrow('Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có');
        });
        it('Hợp lệ nếu khoảng thời gian trùng với đơn đã REJECTED hoặc không giao thoa', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateOverlapping('2026-10-26', '2026-10-28', existingRequests);
            }).not.toThrow();
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateOverlapping('2026-10-15', '2026-10-16', existingRequests);
            }).not.toThrow();
        });
    });
    describe('BR-11 & BR-12: Recall, Cancellation & Rejection Rules', () => {
        it('Chỉ cho phép Rút đơn khi trạng thái là PENDING hoặc PENDING_DIRECTOR', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateCanRecall(client_1.LeaveStatus.PENDING);
            }).not.toThrow();
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateCanRecall(client_1.LeaveStatus.PENDING_DIRECTOR);
            }).not.toThrow();
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateCanRecall(client_1.LeaveStatus.APPROVED);
            }).toThrow('Chỉ được phép Rút đơn khi đơn chưa được duyệt');
        });
        it('Chỉ cho phép tạo Yêu cầu hủy đối với đơn đã APPROVED', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateCanRequestCancel(client_1.LeaveStatus.APPROVED);
            }).not.toThrow();
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateCanRequestCancel(client_1.LeaveStatus.PENDING);
            }).toThrow('Chỉ có thể tạo Yêu cầu hủy đối với các đơn đã được phê duyệt');
        });
        it('Bắt buộc nhập lý do từ chối tối thiểu 10 ký tự (BR-12)', () => {
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateRejectReason('Không duyệt');
            }).toThrow('Lý do từ chối bắt buộc phải có tối thiểu 10 ký tự');
            expect(() => {
                leave_rules_util_1.LeaveRulesUtil.validateRejectReason('Trùng lịch dự án kiểm thử hệ thống định kỳ');
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=leave-rules.spec.js.map