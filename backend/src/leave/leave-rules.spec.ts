import { LeaveType, LeaveUnit, LeaveStatus, ContractType } from '@prisma/client';
import { LeaveRulesUtil } from './leave-rules.util';

describe('Kiểm thử Quy tắc nghiệp vụ Cốt lõi (SRS v3.2 Core Business Rules)', () => {
  // ==========================================
  // BR-05: LOẠI TRỪ NGÀY CUỐI TUẦN & NGÀY LỄ, TẾT
  // ==========================================
  describe('BR-05: Weekend & Public Holiday Exclusion Rule', () => {
    it('Chỉ tính ngày làm việc (Thứ 2 đến Thứ 6), loại trừ Thứ 7 và Chủ nhật', () => {
      // Từ Thứ 6 (2026-10-09) đến Thứ 2 tuần sau (2026-10-12): Gồm Thứ 6 và Thứ 2 => 2 ngày
      const days = LeaveRulesUtil.calculateWorkingDays('2026-10-09', '2026-10-12', LeaveUnit.FULL_DAY);
      expect(days).toBe(2.0);
    });

    it('Nghỉ trọn 1 tuần từ Thứ 2 đến Chủ nhật chỉ tính 5 ngày làm việc', () => {
      const days = LeaveRulesUtil.calculateWorkingDays('2026-10-12', '2026-10-18', LeaveUnit.FULL_DAY);
      expect(days).toBe(5.0);
    });

    it('Nếu chọn khoảng ngày hoàn toàn rơi vào Thứ 7 và Chủ nhật thì trả về 0 ngày', () => {
      const days = LeaveRulesUtil.calculateWorkingDays('2026-10-10', '2026-10-11', LeaveUnit.FULL_DAY);
      expect(days).toBe(0);
    });

    it('Tự động loại trừ ngày Lễ/Tết quốc gia nằm trong khoảng nghỉ', () => {
      // 30/4 (Thứ 5) và 1/5 (Thứ 6) là ngày Lễ. Nghỉ từ 29/04 đến 04/05
      const holidays = [
        new Date('2026-04-30T00:00:00.000Z'),
        new Date('2026-05-01T00:00:00.000Z'),
      ];
      // 29/4 (T4: 1d), 30/4 (Lễ: 0), 1/5 (Lễ: 0), 2/5-3/5 (T7-CN: 0), 4/5 (T2: 1d) => Tổng = 2.0 ngày
      const days = LeaveRulesUtil.calculateWorkingDays('2026-04-29', '2026-05-04', LeaveUnit.FULL_DAY, holidays);
      expect(days).toBe(2.0);
    });
  });

  // ==========================================
  // BR-06: ĐƠN VỊ NGHỈ & NGHỈ NỬA NGÀY
  // ==========================================
  describe('BR-06: Leave Unit & Half-Day Rule', () => {
    it('Nghỉ nửa ngày (0.5) hợp lệ khi Từ ngày trùng với Đến ngày (ngày trong tuần)', () => {
      const morning = LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-13', LeaveUnit.MORNING);
      expect(morning).toBe(0.5);

      const afternoon = LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-13', LeaveUnit.AFTERNOON);
      expect(afternoon).toBe(0.5);
    });

    it('Báo lỗi nếu chọn nửa ngày khi Từ ngày khác Đến ngày (từ 2 ngày trở lên)', () => {
      expect(() => {
        LeaveRulesUtil.calculateWorkingDays('2026-10-13', '2026-10-14', LeaveUnit.MORNING);
      }).toThrow('Nghỉ nửa ngày (0.5 ngày) chỉ được áp dụng khi Từ ngày trùng với Đến ngày');
    });
  });

  // ==========================================
  // BR-07: RÀNG BUỘC NỘP LÙI NGÀY & KHÓA KỲ CÔNG
  // ==========================================
  describe('BR-07: Backdated Leave & Payroll Lock Rule', () => {
    it('Báo lỗi nếu Đến ngày nhỏ hơn Từ ngày', () => {
      expect(() => {
        LeaveRulesUtil.calculateWorkingDays('2026-10-15', '2026-10-14', LeaveUnit.FULL_DAY);
      }).toThrow('Đến ngày phải lớn hơn hoặc bằng Từ ngày');
    });

    it('Hợp lệ nếu Từ ngày lùi về quá khứ trong giới hạn <= 3 ngày làm việc', () => {
      const refDate = new Date('2026-10-15T00:00:00.000Z'); // Thứ 5
      expect(() => {
        LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-10-12', refDate, []);
      }).not.toThrow();
    });

    it('Báo lỗi nếu Từ ngày lùi về quá khứ quá 3 ngày làm việc', () => {
      const refDate = new Date('2026-10-15T00:00:00.000Z');
      expect(() => {
        LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-10-09', refDate, []);
      }).toThrow('Từ ngày không được lùi về quá khứ quá 3 ngày làm việc');
    });

    it('Báo lỗi nếu nộp đơn vào khoảng thời gian thuộc kỳ công đã bị khóa', () => {
      const lockedCutoff = new Date('2026-09-25T23:59:59.999Z');
      expect(() => {
        LeaveRulesUtil.validateBackdatedAndPayrollLock('2026-09-24', new Date('2026-09-28'), [lockedCutoff]);
      }).toThrow('Khoảng thời gian nghỉ thuộc kỳ tính lương đã khóa sổ');
    });
  });

  // ==========================================
  // BR-01 & BR-04: KIỂM SOÁT QUỸ PHÉP NĂM & CARRY-OVER
  // ==========================================
  describe('BR-01 & BR-04: Annual Leave Balance & Carry-Over Rule', () => {
    it('Hợp lệ khi số ngày xin nghỉ <= số phép khả dụng còn lại', () => {
      const balance = LeaveRulesUtil.validateAnnualLeaveBalance(2.0, 12.0, 9.0, 0, new Date('2026-10-15'));
      expect(balance.remaining).toBe(1.0);
    });

    it('Báo lỗi khi số ngày xin nghỉ vượt quá số phép còn lại', () => {
      expect(() => {
        LeaveRulesUtil.validateAnnualLeaveBalance(4.0, 12.0, 9.0, 0, new Date('2026-10-15'));
      }).toThrow('vượt quá số phép năm khả dụng còn lại');
    });

    it('Được cộng dồn phép tồn năm cũ nếu thời điểm xin nghỉ trước ngày 31/03', () => {
      // Trước 31/03: Phép năm (12) + Phép cũ (3) - Đã dùng (2) = 13 ngày khả dụng
      const balance = LeaveRulesUtil.validateAnnualLeaveBalance(10.0, 12.0, 2.0, 3.0, new Date('2026-02-15'));
      expect(balance.available).toBe(13.0);
      expect(balance.remaining).toBe(3.0);
    });
  });

  // ==========================================
  // BR-02: RÀNG BUỘC NHÂN SỰ THỬ VIỆC
  // ==========================================
  describe('BR-02: Probationary Employee Constraints', () => {
    it('Nhân viên thử việc chỉ được phép xin Nghỉ không hưởng lương', () => {
      expect(() => {
        LeaveRulesUtil.validateProbationConstraint(ContractType.PROBATION, LeaveType.UNPAID);
      }).not.toThrow();
    });

    it('Báo lỗi nếu nhân viên thử việc chọn loại phép có hưởng lương', () => {
      expect(() => {
        LeaveRulesUtil.validateProbationConstraint(ContractType.PROBATION, LeaveType.ANNUAL);
      }).toThrow('Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương"');

      expect(() => {
        LeaveRulesUtil.validateProbationConstraint(ContractType.PROBATION, LeaveType.SICK);
      }).toThrow('Nhân sự trong giai đoạn thử việc chỉ được phép xin "Nghỉ không hưởng lương"');
    });
  });

  // ==========================================
  // BR-08: LINH HOẠT CHỨNG TỪ Y TẾ CHO NGHỈ ỐM
  // ==========================================
  describe('BR-08: Flexible Sick Leave Attachment Rule', () => {
    it('Nghỉ ốm dưới 2 ngày không bắt buộc có chứng từ y tế', () => {
      expect(() => {
        LeaveRulesUtil.validateMedicalAttachment(LeaveType.SICK, 1.0, null);
      }).not.toThrow();

      expect(() => {
        LeaveRulesUtil.validateMedicalAttachment(LeaveType.SICK, 0.5, undefined);
      }).not.toThrow();
    });

    it('Nghỉ ốm >= 2 ngày bắt buộc phải có chứng từ y tế hợp lệ', () => {
      expect(() => {
        LeaveRulesUtil.validateMedicalAttachment(LeaveType.SICK, 2.0, null);
      }).toThrow('Nghỉ ốm đau từ 2 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế');

      expect(() => {
        LeaveRulesUtil.validateMedicalAttachment(LeaveType.SICK, 2.0, '/uploads/doctor-note.pdf');
      }).not.toThrow();
    });
  });

  // ==========================================
  // BR-09: PHÊ DUYỆT ĐA CẤP THEO THỜI LƯỢNG
  // ==========================================
  describe('BR-09: Multi-level Approval Threshold Rule', () => {
    it('Đơn nghỉ dưới 3 ngày chỉ cần 1 cấp duyệt', () => {
      const result = LeaveRulesUtil.determineApprovalLevel(2.0);
      expect(result.approvalLevel).toBe(1);
    });

    it('Đơn nghỉ từ 3 ngày trở lên yêu cầu 2 cấp duyệt (Line Manager -> Giám đốc)', () => {
      const result = LeaveRulesUtil.determineApprovalLevel(3.0);
      expect(result.approvalLevel).toBe(2);

      const result4 = LeaveRulesUtil.determineApprovalLevel(4.5);
      expect(result4.approvalLevel).toBe(2);
    });
  });

  // ==========================================
  // BR-13: CHỐNG TRÙNG LỊCH NGHỈ CÁ NHÂN
  // ==========================================
  describe('BR-13: Overlapping Leave Rule', () => {
    const existingRequests = [
      {
        startDate: '2026-10-12',
        endDate: '2026-10-14',
        status: LeaveStatus.PENDING,
      },
      {
        startDate: '2026-10-20',
        endDate: '2026-10-22',
        status: LeaveStatus.APPROVED,
      },
      {
        startDate: '2026-10-26',
        endDate: '2026-10-28',
        status: LeaveStatus.REJECTED, // Đã từ chối thì không tính trùng
      },
    ];

    it('Báo lỗi nếu đơn mới trùng lặp với đơn PENDING', () => {
      expect(() => {
        LeaveRulesUtil.validateOverlapping('2026-10-13', '2026-10-15', existingRequests);
      }).toThrow('Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có');
    });

    it('Báo lỗi nếu đơn mới trùng lặp với đơn APPROVED', () => {
      expect(() => {
        LeaveRulesUtil.validateOverlapping('2026-10-19', '2026-10-21', existingRequests);
      }).toThrow('Khoảng thời gian nghỉ trùng lặp với đơn nghỉ phép đã có');
    });

    it('Hợp lệ nếu khoảng thời gian trùng với đơn đã REJECTED hoặc không giao thoa', () => {
      expect(() => {
        LeaveRulesUtil.validateOverlapping('2026-10-26', '2026-10-28', existingRequests);
      }).not.toThrow();

      expect(() => {
        LeaveRulesUtil.validateOverlapping('2026-10-15', '2026-10-16', existingRequests);
      }).not.toThrow();
    });
  });

  // ==========================================
  // BR-11 & BR-12: VÒNG ĐỜI HỦY ĐƠN & LÝ DO TỪ CHỐI
  // ==========================================
  describe('BR-11 & BR-12: Recall, Cancellation & Rejection Rules', () => {
    it('Chỉ cho phép Rút đơn khi trạng thái là PENDING hoặc PENDING_DIRECTOR', () => {
      expect(() => {
        LeaveRulesUtil.validateCanRecall(LeaveStatus.PENDING);
      }).not.toThrow();

      expect(() => {
        LeaveRulesUtil.validateCanRecall(LeaveStatus.PENDING_DIRECTOR);
      }).not.toThrow();

      expect(() => {
        LeaveRulesUtil.validateCanRecall(LeaveStatus.APPROVED);
      }).toThrow('Chỉ được phép Rút đơn khi đơn chưa được duyệt');
    });

    it('Chỉ cho phép tạo Yêu cầu hủy đối với đơn đã APPROVED', () => {
      expect(() => {
        LeaveRulesUtil.validateCanRequestCancel(LeaveStatus.APPROVED);
      }).not.toThrow();

      expect(() => {
        LeaveRulesUtil.validateCanRequestCancel(LeaveStatus.PENDING);
      }).toThrow('Chỉ có thể tạo Yêu cầu hủy đối với các đơn đã được phê duyệt');
    });

    it('Bắt buộc nhập lý do từ chối tối thiểu 10 ký tự (BR-12)', () => {
      expect(() => {
        LeaveRulesUtil.validateRejectReason('Không duyệt');
      }).toThrow('Lý do từ chối bắt buộc phải có tối thiểu 10 ký tự');

      expect(() => {
        LeaveRulesUtil.validateRejectReason('Trùng lịch dự án kiểm thử hệ thống định kỳ');
      }).not.toThrow();
    });
  });
});
