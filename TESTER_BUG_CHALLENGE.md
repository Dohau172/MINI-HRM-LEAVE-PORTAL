# BỘ 10 LỖI CÀI CẮM KIỂM THỬ PHẦN MỀM (SEEDED DEFECTS MATRIX)
## DỰ ÁN: MINI HRM LEAVE PORTAL (HỆ THỐNG QUẢN LÝ NGHỈ PHÉP DOANH NGHIỆP)
> **Mục đích:** Cung cấp danh mục 10 lỗi thực tế từ **Low $\rightarrow$ High** (chính xác 1 lỗi High) đã được cài cắm trực tiếp vào hệ thống để Tester thực hành kiểm thử chức năng (Functional Testing), kiểm thử giá trị biên (Boundary Value Testing), kiểm thử phân vùng tương đương (Equivalence Partitioning) và kiểm thử giao diện (UI/UX Testing).

---

## 📊 BẢNG TỔNG HỢP 10 LỖI (DEFECT SUMMARY TABLE)

| Mã Bug | Mức độ (Severity) | Phân loại lỗi (Bug Category) | Module / Chức năng | Tiêu chuẩn vi phạm | Tệp mã nguồn cài cắm |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **BUG-01** | 🔴 **HIGH** | Business Logic / Data Integrity | Nộp đơn Phép năm (Leave Request) | **BR-01 & BR-06** | `backend/src/leave/leave.service.ts` |
| **BUG-02** | 🟠 **MEDIUM** | Boundary Value (Off-by-one) | Ràng buộc nộp lùi ngày (Backdated) | **BR-07** | `backend/src/leave/leave-rules.util.ts` |
| **BUG-03** | 🟠 **MEDIUM** | Role & Contract Constraint | Hợp đồng nhân sự thử việc | **BR-02** | `frontend/src/pages/EmployeeDashboard.tsx` |
| **BUG-04** | 🟠 **MEDIUM** | Boundary Value / Validation | Chứng từ y tế khi nghỉ ốm | **BR-08** | `backend/src/leave/leave-rules.util.ts` |
| **BUG-05** | 🟠 **MEDIUM** | Workflow Logic / Approval Level | Phân cấp phê duyệt đơn 3 ngày | **BR-09** | `backend/src/leave/leave-rules.util.ts` |
| **BUG-06** | 🟡 **LOW** | UI Data Formatting / Precision | Hiển thị số dư ngày phép | **BR-01 / UX** | `frontend/src/pages/EmployeeDashboard.tsx` |
| **BUG-07** | 🟡 **LOW** | UI Color & Theme Consistency | Mã màu Lịch phòng ban (Team Calendar) | **BR-05 / SRS** | `frontend/src/components/TeamCalendar.tsx` |
| **BUG-08** | 🟡 **LOW** | Localization / Text Quality | Thông báo lỗi từ chối đơn | **BR-12** | `backend/src/leave/dto/leave.dto.ts` |
| **BUG-09** | 🟡 **LOW** | Search Functionality / Usability | Tìm kiếm nhân sự trên Admin Portal | **FR-11 / UX** | `frontend/src/pages/AdminDashboard.tsx` |
| **BUG-10** | 🟡 **LOW** | File Export / Operating System | Xuất báo cáo công lương (.csv) | **FR-14 / UX** | `frontend/src/pages/AdminDashboard.tsx` |

---

## 🔍 CHI TIẾT KỊCH BẢN KIỂM THỬ TỪNG LỖI (TEST SPECIFICATIONS)

---

### 🔴 LỖI 1: BUG-01 (MỨC ĐỘ CAO - HIGH SEVERITY)
* **Tên lỗi:** Bỏ qua kiểm tra số dư quỹ phép năm khi nộp đơn nghỉ Nửa ngày (Morning/Afternoon), gây bội chi và âm quỹ phép.
* **Mức độ:** **High (Critical Business Logic & Data Integrity)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-01** (Kiểm soát quỹ phép khả dụng) và **BR-06** (Đơn vị nghỉ nửa ngày).
* **Tài khoản kiểm thử:** `linh.dang@company.vn` (Nhân sự có số dư phép năm = 0.0) hoặc nhân sự đã dùng hết phép.
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập vào hệ thống với tài khoản nhân sự có số phép năm còn lại bằng `0.0`.
  2. Tại form **Tạo đơn xin nghỉ phép**, chọn:
     - **Khoảng ngày:** Cùng 1 ngày trong tuần (ví dụ `2026-10-21` đến `2026-10-21`).
     - **Hình thức:** Phép năm (`ANNUAL`).
     - **Đơn vị nghỉ:** Nửa ngày sáng (`MORNING`) hoặc Nửa ngày chiều (`AFTERNOON`).
     - **Lý do:** Nhập tối thiểu 10 ký tự.
  3. Bấm **"Gửi đơn xin nghỉ phép"**.
* **Kết quả mong đợi (Expected):** Hệ thống phải chặn và báo lỗi: *"Số ngày xin nghỉ (0.5 ngày) vượt quá số phép năm khả dụng còn lại (0.0 ngày) (theo BR-01)"*.
* **Kết quả thực tế bị lỗi (Actual):** Đơn được tạo thành công với trạng thái `CHỜ DUYỆT`! Quỹ phép công ty bị khai khống và sẽ dẫn đến tính sai lương.
* **Vị trí trong mã nguồn:** `backend/src/leave/leave.service.ts` dòng 140 (điều kiện `dto.leaveType === LeaveType.ANNUAL && dto.leaveUnit === LeaveUnit.FULL_DAY`).
* **Cách khắc phục:** Bỏ điều kiện `&& dto.leaveUnit === LeaveUnit.FULL_DAY`.

---

### 🟠 LỖI 2: BUG-02 (MỨC ĐỘ TRUNG BÌNH - MEDIUM SEVERITY)
* **Tên lỗi:** Lỗi so sánh giá trị biên (Off-by-one Error) khiến nhân sự nộp đơn lùi đúng 3 ngày làm việc bị báo lỗi sai.
* **Mức độ:** **Medium (Boundary Value Analysis Defect)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-07** (Cho phép nộp đơn lùi ngày về quá khứ tối đa 3 ngày làm việc).
* **Tài khoản kiểm thử:** `an.nguyen@company.vn`
* **Các bước tái hiện (Steps to Reproduce):**
  1. Giả sử hôm nay là Thứ 5 (ví dụ `2026-10-15`).
  2. Nhân viên tạo đơn nghỉ cho Thứ 2 cùng tuần (`2026-10-12`). Khoảng cách lùi về quá khứ là đúng 3 ngày làm việc (Thứ 4, Thứ 3, Thứ 2 = 3 ngày làm việc).
  3. Bấm gửi đơn xin nghỉ phép.
* **Kết quả mong đợi (Expected):** Đơn hợp lệ và được chấp nhận gửi lên hệ thống vì nằm đúng mốc biên cho phép ($\le 3$ ngày).
* **Kết quả thực tế bị lỗi (Actual):** Hệ thống báo lỗi: *"Từ ngày không được lùi về quá khứ quá 3 ngày làm việc (theo BR-07)"*.
* **Vị trí trong mã nguồn:** `backend/src/leave/leave-rules.util.ts` dòng 96 (`pastWorkingDays >= 3`).
* **Cách khắc phục:** Sửa thành `pastWorkingDays > 3`.

---

### 🟠 LỖI 3: BUG-03 (MỨC ĐỘ TRUNG BÌNH - MEDIUM SEVERITY)
* **Tên lỗi:** Form cho phép nhân viên thử việc chọn loại phép có hưởng lương "Cưới / Tang (Có lương)".
* **Mức độ:** **Medium (Business Rule / Role Constraints)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-02** (Nhân sự thử việc chỉ được phép xin duy nhất "Nghỉ không hưởng lương").
* **Tài khoản kiểm thử:** `linh.dang@company.vn` (Nhân sự thử việc - `PROBATION`).
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập bằng tài khoản `linh.dang@company.vn` (Mật khẩu: `Pass@123`).
  2. Mở form **Tạo đơn xin nghỉ phép**, nhấp vào dropdown **Hình thức**.
* **Kết quả mong đợi (Expected):** Dropdown bị khóa hoặc chỉ hiển thị duy nhất tùy chọn *"Nghỉ không hưởng lương (Thử việc)"*.
* **Kết quả thực tế bị lỗi (Actual):** Dropdown hiển thị thêm tùy chọn *"Cưới / Tang (Có lương)"* và cho phép chọn để nộp đơn.
* **Vị trí trong mã nguồn:** `frontend/src/pages/EmployeeDashboard.tsx` dòng 392.
* **Cách khắc phục:** Xóa option `WEDDING_BEREAVEMENT` trong nhánh `isProbation` và khóa select nếu cần.

---

### 🟠 LỖI 4: BUG-04 (MỨC ĐỘ TRUNG BÌNH - MEDIUM SEVERITY)
* **Tên lỗi:** Nghỉ ốm đúng 2.0 ngày làm việc không bị bắt buộc đính kèm chứng từ y tế.
* **Mức độ:** **Medium (Boundary Condition / Verification)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-08** (Nghỉ ốm dưới 2 ngày là tùy chọn; từ 2 ngày trở lên bắt buộc 100% phải có file y tế).
* **Tài khoản kiểm thử:** `an.nguyen@company.vn`
* **Các bước tái hiện (Steps to Reproduce):**
  1. Tạo đơn nghỉ với **Hình thức:** Nghỉ ốm đau (`SICK`).
  2. Chọn khoảng ngày nghỉ đúng **2.0 ngày làm việc** (ví dụ Thứ 2 và Thứ 3).
  3. **Không đính kèm** bất kỳ tệp chứng từ y tế nào.
  4. Bấm **"Gửi đơn xin nghỉ phép"**.
* **Kết quả mong đợi (Expected):** Hệ thống bắt buộc phải chặn và yêu cầu: *"Nghỉ ốm đau từ 2 ngày làm việc trở lên bắt buộc phải đính kèm chứng từ y tế hợp lệ (theo BR-08)"*.
* **Kết quả thực tế bị lỗi (Actual):** Đơn vẫn được gửi đi thành công mà không cần file đính kèm!
* **Vị trí trong mã nguồn:** `backend/src/leave/leave-rules.util.ts` dòng 117 (`workingDays > 2.0`).
* **Cách khắc phục:** Sửa điều kiện thành `workingDays >= 2.0`.

---

### 🟠 LỖI 5: BUG-05 (MỨC ĐỘ TRUNG BÌNH - MEDIUM SEVERITY)
* **Tên lỗi:** Đơn xin nghỉ đúng 3.0 ngày làm việc bị gán thiếu cấp duyệt (chỉ cần 1 cấp thay vì 2 cấp lên Giám đốc).
* **Mức độ:** **Medium (Workflow & Authorization Flaw)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-09** (Đơn dưới 3 ngày: 1 cấp duyệt; Đơn từ 3 ngày trở lên: 2 cấp duyệt LM $\rightarrow$ Director).
* **Tài khoản kiểm thử:** `an.nguyen@company.vn`
* **Các bước tái hiện (Steps to Reproduce):**
  1. Tạo đơn xin nghỉ phép năm với thời gian đúng **3.0 ngày làm việc** (ví dụ Thứ 2, Thứ 3, Thứ 4).
  2. Nộp đơn thành công.
  3. Kiểm tra thông tin đơn trên bảng Lịch sử hoặc dùng tài khoản `mai.tran@company.vn` duyệt đơn.
* **Kết quả mong đợi (Expected):** Đơn phải có nhãn *"Đơn $\ge 3$ ngày (Cần 2 cấp duyệt)"* và sau khi Quản lý duyệt phải chuyển sang trạng thái `CHỜ GĐ DUYỆT (Cấp 2)`.
* **Kết quả thực tế bị lỗi (Actual):** Đơn chỉ được gán `approvalLevel = 1`. Quản lý trực tiếp duyệt xong là đơn lập tức chuyển thành `ĐÃ DUYỆT`, bỏ qua sự phê duyệt của Giám đốc khối.
* **Vị trí trong mã nguồn:** `backend/src/leave/leave-rules.util.ts` dòng 159 (`workingDays > 3.0`).
* **Cách khắc phục:** Sửa thành `workingDays >= 3.0`.

---

### 🟡 LỖI 6: BUG-06 (MỨC ĐỘ THẤP - LOW SEVERITY)
* **Tên lỗi:** Thẻ "Số phép khả dụng còn lại" dùng hàm làm tròn cắt cụt số thập phân, hiển thị sai số ngày lẻ 0.5.
* **Mức độ:** **Low (UI Display / Formatting Defect)**
* **Tiêu chuẩn vi phạm:** Độ chính xác hiển thị số liệu ngày phép (Yêu cầu số thập phân `0.5` ngày).
* **Tài khoản kiểm thử:** `an.nguyen@company.vn` hoặc tài khoản có số dư lẻ (ví dụ `12.5` ngày).
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập vào Cổng Cá nhân (`/employee`).
  2. Quan sát thẻ màu xanh lá **"Số phép khả dụng còn lại"** ở hàng thẻ thống kê trên cùng.
* **Kết quả mong đợi (Expected):** Hiển thị số ngày chính xác kèm phần thập phân, ví dụ: `12.5 ngày`.
* **Kết quả thực tế bị lỗi (Actual):** Thẻ hiển thị `12 ngày` (bị mất phần `.5` do sử dụng `Math.floor()`).
* **Vị trí trong mã nguồn:** `frontend/src/pages/EmployeeDashboard.tsx` dòng 310.
* **Cách khắc phục:** Sửa `Math.floor(balance.remainingDays)` thành `balance?.remainingDays.toFixed(1)`.

---

### 🟡 LỖI 7: BUG-07 (MỨC ĐỘ THẤP - LOW SEVERITY)
* **Tên lỗi:** Màu sắc trạng thái "Nghỉ nửa ngày" trên Lịch phòng ban hiển thị màu Tím (🟣) thay vì màu Vàng (🟡).
* **Mức độ:** **Low (UI Consistency / Specification Compliance)**
* **Tiêu chuẩn vi phạm:** Đặc tả màu sắc SRS v3.3 (Quy chuẩn 4 màu: 🟢 Đi làm, 🔴 Nghỉ cả ngày, 🟡 Nghỉ nửa ngày, 🔵 Lễ/Tết).
* **Tài khoản kiểm thử:** Bất kỳ tài khoản nào.
* **Các bước tái hiện (Steps to Reproduce):**
  1. Vào tab **"Lịch vắng mặt phòng ban (4 màu)"**.
  2. Tìm một ngày có nhân viên xin nghỉ nửa ngày (Morning/Afternoon).
* **Kết quả mong đợi (Expected):** Thẻ nhân viên hiển thị icon chấm tròn màu vàng `🟡` và nền vàng nhạt `bg-amber-100`.
* **Kết quả thực tế bị lỗi (Actual):** Thẻ nhân viên hiển thị icon chấm tròn màu tím `🟣` và nền tím nhạt `bg-purple-100`.
* **Vị trí trong mã nguồn:** `frontend/src/components/TeamCalendar.tsx` dòng 270.
* **Cách khắc phục:** Đổi `bg-purple-100 text-purple-800` thành `bg-amber-100 text-amber-800` và đổi `🟣` thành `🟡`.

---

### 🟡 LỖI 8: BUG-08 (MỨC ĐỘ THẤP - LOW SEVERITY)
* **Tên lỗi:** Thông báo lỗi từ chối đơn trả về câu tiếng Anh mặc định của thư viện chưa được bản địa hóa.
* **Mức độ:** **Low (Localization / Text Quality Defect)**
* **Tiêu chuẩn vi phạm:** Quy tắc **BR-12** (Lý do từ chối tối thiểu 10 ký tự, thông báo tiếng Việt chuẩn hóa).
* **Tài khoản kiểm thử:** `mai.tran@company.vn` (Line Manager).
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập vào Cổng Quản lý Duyệt (`/manager`).
  2. Tại một đơn đang chờ duyệt, bấm nút **"Từ chối"**.
  3. Nhập lý do ngắn dưới 10 ký tự (ví dụ: `Không duyệt` = 9 ký tự).
  4. Bấm **"Xác nhận từ chối"**.
* **Kết quả mong đợi (Expected):** Thông báo lỗi tiếng Việt: *"Lý do từ chối phải có tối thiểu 10 ký tự (theo BR-12)"*.
* **Kết quả thực tế bị lỗi (Actual):** Thông báo lỗi trả về tiếng Anh mặc định: *"rejectReason must be longer than or equal to 10 characters"*.
* **Vị trí trong mã nguồn:** `backend/src/leave/dto/leave.dto.ts` dòng 53.
* **Cách khắc phục:** Bổ sung tham số message vào decorator `@Length(10, 500, { message: 'Lý do từ chối phải có tối thiểu 10 ký tự (theo BR-12)' })`.

---

### 🟡 LỖI 9: BUG-09 (MỨC ĐỘ THẤP - LOW SEVERITY)
* **Tên lỗi:** Ô tìm kiếm nhân sự trên Admin Portal bị lỗi phân biệt chữ hoa - chữ thường (Case-sensitive).
* **Mức độ:** **Low (Search Usability Defect)**
* **Tiêu chuẩn vi phạm:** Tính tiện dụng (Usability) của chức năng tìm kiếm người dùng.
* **Tài khoản kiểm thử:** `admin@company.vn` hoặc `itadmin@company.vn`.
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập vào Cổng Quản trị (`/admin`).
  2. Tại ô input **"Tìm nhân sự..."**, nhập chữ thường: `an` (hoặc `bách`, `mai`).
* **Kết quả mong đợi (Expected):** Bảng lọc và hiển thị nhân sự có tên "Nguyễn Văn An" (chữ hoa "An").
* **Kết quả thực tế bị lỗi (Actual):** Bảng trống rỗng! Chỉ khi gõ đúng chữ hoa `An` mới tìm thấy, vì logic so sánh chuỗi đang phân biệt chữ hoa/chữ thường.
* **Vị trí trong mã nguồn:** `frontend/src/pages/AdminDashboard.tsx` dòng 369.
* **Cách khắc phục:** Thêm `.toLowerCase()` cho cả trường dữ liệu và chuỗi tìm kiếm `userSearchQuery.toLowerCase()`.

---

### 🟡 LỖI 10: BUG-10 (MỨC ĐỘ THẤP - LOW SEVERITY)
* **Tên lỗi:** Tên file tải về khi bấm "Xuất File Excel (.csv)" bị thiếu phần mở rộng `.csv`.
* **Mức độ:** **Low (File Format & Export Defect)**
* **Tiêu chuẩn vi phạm:** Chức năng xuất báo cáo công lương FR-14.
* **Tài khoản kiểm thử:** `admin@company.vn` (HR Manager).
* **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập tài khoản HR Manager (`admin@company.vn`).
  2. Chuyển sang tab **"Khóa Kỳ công & Xuất Tiền Lương"**.
  3. Bấm vào nút **"Xuất File Excel (.csv)"**.
* **Kết quả mong đợi (Expected):** Trình duyệt tải về file có đuôi chuẩn: `Bang_Tong_Hop_Cong_Luong_10_2026.csv`.
* **Kết quả thực tế bị lỗi (Actual):** File tải về có tên là `Bang_Tong_Hop_Cong_Luong_export` (không có đuôi `.csv`), khiến Windows/macOS không tự động nhận diện mở bằng Microsoft Excel.
* **Vị trí trong mã nguồn:** `frontend/src/pages/AdminDashboard.tsx` dòng 360.
* **Cách khắc phục:** Sửa thuộc tính download thành `link.setAttribute('download', 'Bang_Tong_Hop_Cong_Luong_10_2026.csv');`.

---

## 🎯 HƯỚNG DẪN TEST VÀ BÀN GIAO CHO TESTER

1. **Khởi chạy hệ thống bình thường:**
   ```powershell
   # Terminal 1: Backend (Port 5000)
   cd D:\BCSE2023\DamBaoChatLuongPhanMem\backend
   npm run start:dev

   # Terminal 2: Frontend (Port 3000)
   cd D:\BCSE2023\DamBaoChatLuongPhanMem\frontend
   npm run dev
   ```

2. **Cách giao việc cho Tester:**
   - Yêu cầu Tester thực hiện kiểm thử chức năng theo bộ tài liệu đặc tả **SRS_Leave_Management_System.md**.
   - Yêu cầu Tester ghi nhận các Defect / Bug Report vào biểu mẫu (gồm: Bug ID, Tóm tắt lỗi, Mức độ nghiêm trọng, Các bước tái hiện, Expected vs Actual Result).
   - Dùng tài liệu này làm **Đáp án chuẩn (Grading Key)** để chấm điểm xem Tester tìm được bao nhiêu lỗi trong số 10 lỗi trên!

3. **Cách thu hồi (Revert) toàn bộ 10 lỗi sau khi test xong:**
   - Trong toàn bộ mã nguồn, cả 10 lỗi đều được gắn cờ comment chuẩn: `[SEEDED_BUG: BUG-xx]`.
   - Bạn chỉ cần tìm từ khóa `[SEEDED_BUG` trong VS Code / Antigravity để xem và hoàn tác dễ dàng.
