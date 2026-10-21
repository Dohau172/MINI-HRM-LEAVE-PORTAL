# HỆ THỐNG QUẢN LÝ NGHỈ PHÉP NỘI BỘ (MINI HRM LEAVE PORTAL)
## PHIÊN BẢN 3.3 - BẢN NGHIỆM THU CHÍNH THỨC (SEPARATION OF DUTIES BASELINE)

> **Môn học:** Đảm bảo Chất lượng Phần mềm (Software Quality Assurance - SQA)  
> **Đơn vị:** Khoa Công nghệ Thông tin - BCSE2023  
> **Kiến trúc:** Client - Server (RESTful API)  
> **Tech Stack:** Fullstack TypeScript (React + NestJS + PostgreSQL + Prisma ORM)  
> **Tài liệu chuẩn:** [SRS_Leave_Management_System.md](./SRS_Leave_Management_System.md) (v3.3)

---

## 📖 1. GIỚI THIỆU TỔNG QUAN

**Mini HRM Leave Portal** là nền tảng quản trị vắng mặt tập trung đa thiết bị (Web & Mobile Responsive PWA), tự động hóa toàn diện quy trình xin - duyệt - chuyển đổi ngày nghỉ trong doanh nghiệp. Hệ thống được phát triển bám sát 100% tài liệu đặc tả chuẩn [SRS_Leave_Management_System.md](./SRS_Leave_Management_System.md), đóng vai trò là sản phẩm nền tảng (*Ground Truth / Baseline*) phục vụ các hoạt động kiểm thử phần mềm SQA:

1. **Phân hệ Cổng Nghiệp vụ Nội bộ (HR Portal - URL: `/employee` & `/manager`):**
   - **Nhân viên (Employee):** Quản lý quỹ phép cá nhân, nộp đơn xin nghỉ theo quy chuẩn **4-Clicks**, xem lịch phòng ban trực quan (4 mã màu), rút đơn hoặc yêu cầu hủy đơn đã duyệt. Nhân sự thử việc được áp dụng ràng buộc riêng biệt chỉ được xin nghỉ không lương.
   - **Quản lý trực tiếp (Line Manager):** Xét duyệt đơn dưới 3 ngày, chuyển tiếp đơn từ 3 ngày trở lên, thiết lập ủy quyền duyệt (**DoA**) khi đi công tác/nghỉ phép kèm cơ chế tự động chuyển hướng thông báo đơn mới.
   - **Giám đốc bộ phận (Director / Head of Department):** Phê duyệt cấp 2 cho các đơn nghỉ dài ngày ($\ge 3$ ngày làm việc).

2. **Phân hệ Cổng Quản trị Hệ thống Độc lập (Admin Portal - URL: `/admin/*`):**
   - Phân tách tuyệt đối bằng RBAC (chỉ tài khoản `ADMIN` mới có quyền truy cập, các vai trò khác bị chặn `403 Forbidden`).
   - Quản lý hồ sơ nhân sự, chức danh và phân loại hợp đồng (*Thử việc / Chính thức*).
   - Thiết lập danh mục ngày Lễ/Tết quốc gia (tự động loại trừ không trừ phép năm).
   - Điều chỉnh quỹ phép thủ công bắt buộc lưu vết **Nhật ký Kiểm toán Bất biến (Audit Log Trail)**.
   - Khóa sổ kỳ tính lương ngày 25 hàng tháng (**Monthly Payroll Lock**) và xuất báo cáo tiền lương chuẩn **Excel (`.csv` / `.xlsx`)** & **PDF**.

---

## 🎨 2. THIẾT KẾ UI/UX CHUẨN ENTERPRISE TRUST & MINIMALISM

- **Tone màu thương hiệu chính:** **Xanh dương (Trust Blue `#2563eb`)** và **Xanh Navy (`#1e293b`, `#0f172a`)** mang lại cảm giác tin cậy, chuyên nghiệp cho doanh nghiệp.
- **Nền tổng thể:** **Xám nhạt (Light Gray `#f8fafc`)** và **Trắng (`#ffffff`)** với khoảng trống hiển thị (*white-space*) thoáng đãng, chống mỏi mắt.
- **Lịch vắng mặt phòng ban (Team Visual Calendar):** Áp dụng 4 mã màu chuẩn tuyệt đối:
  - 🟢 **Xanh lá (Present):** Có mặt đi làm.
  - 🔴 **Đỏ (On Leave):** Nghỉ phép cả ngày.
  - 🟡 **Vàng (Half-day):** Nghỉ nửa ngày (sáng / chiều).
  - 🔵 **Xanh dương (Public Holiday):** Ngày Lễ / Tết quốc gia.
- **Typography & Con số:** Font Sans-serif hiện đại (Inter, Roboto) với các con số số dư phép hiển thị to, rõ ràng, dạng thẻ chỉ số trực quan.

---

## 🛠️ 3. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ | Diễn giải chức năng |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite (TypeScript) | Single Page Application (SPA), tối ưu 4-Clicks, Responsive di động |
| **Styling** | Tailwind CSS + Lucide Icons | Giao diện tối giản doanh nghiệp, thẻ trạng thái viền màu chuyên nghiệp |
| **Backend** | NestJS (Node.js + TypeScript) | Kiến trúc Module hóa, Dependency Injection, Validation Pipes |
| **ORM** | Prisma ORM 5 | Quản lý schema, sinh migration và nạp 6 tài khoản mẫu (`seed.ts`) |
| **Database** | PostgreSQL | Chạy qua Docker container (Port `5432`, DB `mini_hrm_leave`) |
| **Testing** | Jest + Ts-Jest | 100% Unit Tests bao phủ 15 Business Rules cốt lõi |
| **Auth & RBAC**| JWT + Passport.js + Guards | Phân quyền 4 vai trò: `EMPLOYEE`, `MANAGER`, `DIRECTOR`, `ADMIN` |

---

## 📁 4. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
DamBaoChatLuongPhanMem/
├── README.md                            # Tài liệu hướng dẫn dự án (File này)
├── SRS_Leave_Management_System.md       # Đặc tả yêu cầu phần mềm chuẩn (SRS v3.2 Baseline)
│
├── backend/                             # MÃ NGUỒN BACKEND (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma                # Schema CSDL (Users, LeaveRequests, Delegations, PublicHolidays, AuditLogs, PayrollPeriods)
│   │   └── seed.ts                      # Nạp 6 tài khoản mẫu SRS Mục 7, Lễ/Tết 2026, Kỳ công, DoA
│   ├── uploads/                         # Thư mục lưu trữ chứng từ y tế tải lên (<= 5MB)
│   ├── src/
│   │   ├── auth/                        # Module Đăng nhập, Đăng ký, JWT Strategy (hỗ trợ 4 Roles)
│   │   ├── common/                      # Guards (JWT, Roles RBAC) & Decorators (CurrentUser, Roles)
│   │   ├── leave/                       # Module Nghiệp vụ Nghỉ phép, Lịch & DoA
│   │   │   ├── leave-rules.util.ts      # Đóng gói logic 15 Business Rules cốt lõi
│   │   │   ├── leave-rules.spec.ts      # BỘ JEST UNIT TESTS MÔN SQA (100% PASSED)
│   │   │   ├── leave.service.ts         # Xử lý duyệt 2 cấp, DoA routing, kiểm tra khóa kỳ công
│   │   │   ├── leave.controller.ts      # Endpoints: balance, request, my-requests, manager, delegations, team-calendar
│   │   │   └── dto/leave.dto.ts         # DTOs: Tạo đơn, Sửa đơn, Từ chối, Ủy quyền DoA, Hủy đơn
│   │   ├── admin/                       # Module Quản trị Hệ thống độc lập (/admin)
│   │   │   ├── admin.service.ts         # Quản lý chức danh, Audit log, chỉnh phép, Lễ/Tết, Khóa kỳ công
│   │   │   ├── admin.controller.ts      # Endpoints quản trị được bảo vệ bởi Role.ADMIN
│   │   │   └── dto/admin.dto.ts         # DTOs: Chỉnh phép + lý do, Ngày lễ, Khóa kỳ công
│   │   ├── prisma/                      # Module PrismaClient kết nối cơ sở dữ liệu
│   │   ├── app.module.ts                # Root Module tích hợp Auth, Leave, Admin
│   │   └── main.ts                      # Entrypoint: Cổng 5000, CORS, Static Files
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                            # MÃ NGUỒN FRONTEND (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx               # Navbar Trust Blue, Portal Switcher, thông tin User & Hợp đồng
    │   │   ├── TeamCalendar.tsx         # Lịch phòng ban 4 màu (🟢, 🔴, 🟡, 🔵), xem chi tiết ngày
    │   │   ├── ProtectedRoute.tsx       # RBAC Route Guarding bảo vệ đường dẫn theo Role
    │   │   └── StatusBadge.tsx          # Badge 6 trạng thái đơn viền màu chuyên nghiệp
    │   ├── context/
    │   │   └── AuthContext.tsx          # Quản lý User, Token & Auth State
    │   ├── services/api.ts              # Axios instance tự động gán Bearer Token & bắt lỗi 401
    │   ├── pages/
    │   │   ├── LoginPage.tsx            # Đăng nhập (hỗ trợ nút điền nhanh 6 tài khoản kiểm thử SRS Mục 7)
    │   │   ├── RegisterPage.tsx         # Đăng ký tài khoản nhân sự
    │   │   ├── EmployeeDashboard.tsx    # Cổng Nhân viên: 4 thẻ số dư, form 4-clicks, rút đơn, yêu cầu hủy
    │   │   ├── ManagerDashboard.tsx     # Cổng Quản lý: Duyệt 2 cấp, Modal Ủy quyền DoA, xác nhận hủy đơn
    │   │   └── AdminDashboard.tsx       # Cổng Quản trị Admin: Hồ sơ, Audit Log, Lễ/Tết, Khóa kỳ công & Xuất Excel/PDF
    │   ├── types/index.ts               # Khai báo TypeScript types, enums và từ điển nhãn
    │   ├── App.tsx                      # Định tuyến /employee, /manager, /admin, /login
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts                   # Chạy cổng 3000, proxy sang Backend cổng 5000
```

---

## 🚀 5. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### Bước 1: Khởi động Cơ sở dữ liệu PostgreSQL (Docker)
Mở cửa sổ PowerShell và chạy lệnh:
```powershell
docker run --name postgres-hrm -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mini_hrm_leave -p 5432:5432 -d postgres:alpine
```
*(Nếu container đã tồn tại từ trước, chỉ cần bật lại: `docker start postgres-hrm`)*

---

### Bước 2: Cài đặt và Khởi chạy Backend (NestJS)
Mở Terminal tại thư mục `backend`:
```powershell
cd D:\BCSE2023\DamBaoChatLuongPhanMem\backend

# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Cập nhật cấu trúc CSDL Prisma (Nếu được hỏi reset, gõ 'y' để nạp sạch)
npx prisma db push

# 3. Nạp dữ liệu mẫu 6 tài khoản kiểm thử chuẩn SRS Mục 7
npm run prisma:seed

# 4. Khởi chạy Backend Server ở chế độ Watch Mode
npm run start:dev
```
👉 Server Backend sẽ lắng nghe tại: **`http://localhost:5000/api`**  
👉 Thư mục file tĩnh upload chứng từ: **`http://localhost:5000/uploads`**

---

### Bước 3: Cài đặt và Khởi chạy Frontend (React + Vite)
Mở Terminal thứ 2 tại thư mục `frontend`:
```powershell
cd D:\BCSE2023\DamBaoChatLuongPhanMem\frontend

# 1. Cài đặt phụ thuộc
npm install

# 2. Khởi chạy giao diện Web
npm run dev
```
👉 Truy cập hệ thống tại: **`http://localhost:3000`**

---

## 🔍 6. CÁCH KIỂM TRA DỮ LIỆU CƠ SỞ DỮ LIỆU (DATABASE INSPECTION)

### Cách 1: Sử dụng Prisma Studio (Giao diện Trực quan - Khuyên dùng)
Tại terminal `backend`:
```powershell
npx prisma studio
```
👉 Trình duyệt sẽ mở **`http://localhost:5555`** để xem và thao tác trực tiếp trên tất cả các bảng dữ liệu!

---

### Cách 2: Bộ câu lệnh SQL kiểm tra trong PostgreSQL (pgAdmin / DBeaver / Docker CLI)

Nếu bạn dùng pgAdmin, DBeaver hoặc dòng lệnh Docker CLI (`docker exec -it postgres-hrm psql -U postgres -d mini_hrm_leave`), dưới đây là các câu lệnh SQL tra cứu:

#### 1. Kiểm tra số lượng bản ghi của tất cả các bảng:
```sql
SELECT 'users' AS table_name, COUNT(*) AS total_rows FROM users
UNION ALL SELECT 'leave_requests', COUNT(*) FROM leave_requests
UNION ALL SELECT 'public_holidays', COUNT(*) FROM public_holidays
UNION ALL SELECT 'delegations', COUNT(*) FROM delegations
UNION ALL SELECT 'payroll_periods', COUNT(*) FROM payroll_periods
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
```

#### 2. Kiểm tra danh sách 6 tài khoản người dùng & chức danh (SRS Mục 7):
```sql
SELECT 
  id, "fullName" AS ho_ten, email, role AS vai_tro,
  "contractType" AS loai_hop_dong, position AS chuc_danh, department AS phong_ban,
  "canApprove" AS co_quyen_duyet, "annualLeaveQuota" AS phep_nam_cap,
  "previousYearQuota" AS phep_ton_nam_cu, "seniorityYears" AS tham_nien_nam
FROM users
ORDER BY CASE role WHEN 'ADMIN' THEN 1 WHEN 'DIRECTOR' THEN 2 WHEN 'MANAGER' THEN 3 ELSE 4 END;
```

#### 3. Kiểm tra danh sách đơn nghỉ phép (Luồng duyệt & Trạng thái):
```sql
SELECT 
  lr.id, u."fullName" AS nhan_vien_nop, u.department AS phong_ban,
  lr."leaveType" AS loai_phep, lr."leaveUnit" AS don_vi_nghi,
  lr."startDate"::date AS tu_ngay, lr."endDate"::date AS den_ngay,
  lr."workingDays" AS so_ngay_tinh, lr.status AS trang_thai,
  lr."approvalLevel" AS cap_duyet, lr."isDelegated" AS duyet_qua_doa,
  approver."fullName" AS nguoi_da_duyet, lr.reason AS ly_do
FROM leave_requests lr
JOIN users u ON lr."userId" = u.id
LEFT JOIN users approver ON lr."approvedById" = approver.id
ORDER BY lr."createdAt" DESC;
```

#### 4. Kiểm tra Danh mục Ngày Lễ, Tết năm 2026 (BR-05):
```sql
SELECT id, name AS ten_ngay_le, date::date AS ngay_dien_ra, description AS ghi_chu
FROM public_holidays
ORDER BY date ASC;
```

#### 5. Kiểm tra Thiết lập Ủy quyền Duyệt đơn (DoA - BR-10):
```sql
SELECT 
  d.id, u_from."fullName" AS nguoi_uy_quyen, u_from.position AS chuc_vu_nguoi_uy_quyen,
  u_to."fullName" AS nguoi_nhan_uy_quyen, u_to.position AS chuc_vu_nguoi_nhan,
  d."startDate"::date AS tu_ngay, d."endDate"::date AS den_ngay,
  d.reason AS ly_do_uy_quyen, d."isActive" AS dang_hieu_luc
FROM delegations d
JOIN users u_from ON d."delegatorId" = u_from.id
JOIN users u_to ON d."delegateeId" = u_to.id
ORDER BY d."createdAt" DESC;
```

#### 6. Kiểm tra Kỳ tính lương & Khóa sổ ngày 25 (BR-07):
```sql
SELECT 
  id, "monthYear" AS ky_tinh_luong, "startDate"::date AS tu_ngay_26,
  "endDate"::date AS den_ngay_25, "isLocked" AS da_khoa_so,
  "lockedAt" AS thoi_diem_khoa, "lockedBy" AS admin_khoa
FROM payroll_periods
ORDER BY "startDate" DESC;
```

#### 7. Kiểm tra Nhật ký Kiểm toán Bất biến (Audit Log Trail - BR-15):
```sql
SELECT 
  a.id, a."createdAt" AS thoi_gian, admin_user."fullName" AS admin_thuc_hien,
  target_user."fullName" AS nhan_su_bi_can_thiep, a.action AS hanh_dong,
  a."oldValue" AS gia_tri_cu, a."newValue" AS gia_tri_moi,
  a.reason AS ly_do_giai_trinh, a."ipAddress" AS ip_truy_cap
FROM audit_logs a
JOIN users admin_user ON a."adminId" = admin_user.id
JOIN users target_user ON a."targetUserId" = target_user.id
ORDER BY a."createdAt" DESC;
```

---

## 🧪 7. KIỂM THỬ ĐƠN VỊ & BÁO CÁO ĐỘ PHỦ (JEST UNIT TESTS)

Toàn bộ 15 quy tắc nghiệp vụ cốt lõi đã được kiểm thử tự động tại `backend/src/leave/leave-rules.spec.ts`.

### 1. Chạy toàn bộ Unit Tests:
```powershell
cd D:\BCSE2023\DamBaoChatLuongPhanMem\backend
npm run test
```
*Kết quả:* **100% Passed (15/15 Business Rules)**.

### 2. Xuất báo cáo độ bao phủ mã nguồn (Code Coverage):
```powershell
npm run test:cov
```
Xem file báo cáo chi tiết trực quan tại: `backend/coverage/lcov-report/index.html`.

---

## 📋 8. BẢNG 15 QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES - BR)

| Mã BR | Tên quy tắc | Cài đặt & Tiêu chuẩn nghiệm thu hệ thống | Trạng thái test |
| :--- | :--- | :--- | :---: |
| **BR-01** | Quỹ phép năm khả dụng | $\text{Khả dụng} = \text{Phép cấp năm nay} + \text{Phép tồn cũ} - \text{Đã duyệt}$. Số ngày xin $\le$ khả dụng. | ✅ Passed |
| **BR-02** | Ràng buộc thử việc | Nhân sự hợp đồng Thử việc (`PROBATION`) **chỉ được phép chọn duy nhất "Nghỉ không hưởng lương"**. | ✅ Passed |
| **BR-03** | Thưởng thâm niên | Cứ đủ 03 năm làm việc liên tục được cộng vĩnh viễn thêm +1.0 ngày phép/năm. | ✅ Passed |
| **BR-04** | Hạn chuyển phép 31/03 | Phép năm cũ chuyển sang năm mới có giá trị sử dụng đến hết 23:59:59 ngày 31/03. Qua hạn reset về 0. | ✅ Passed |
| **BR-05** | Loại trừ Lễ, Tết & Cuối tuần| Hệ thống tự động loại trừ Thứ 7, Chủ Nhật và toàn bộ ngày Lễ/Tết quốc gia khi tính trừ ngày nghỉ. | ✅ Passed |
| **BR-06** | Nghỉ nửa ngày (Half-day) | Nghỉ 0.5 ngày (sáng/chiều) chỉ hợp lệ khi `Từ ngày == Đến ngày` (cùng 1 ngày duy nhất). | ✅ Passed |
| **BR-07** | Lùi ngày & Khóa kỳ công | Cho phép nộp lùi ngày tối đa 3 ngày làm việc, **nhưng chặn tuyệt đối nếu ngày nghỉ thuộc kỳ công đã khóa ($\le 25$)**. | ✅ Passed |
| **BR-08** | Linh hoạt chứng từ y tế | Nghỉ ốm $< 2.0$ ngày: Tùy chọn nộp chứng từ. Nghỉ ốm $\ge 2.0$ ngày: **Bắt buộc 100% tệp $\le 5$ MB**. | ✅ Passed |
| **BR-09** | Phê duyệt đa cấp thời lượng | Đơn $< 3.0$ ngày: 1 cấp duyệt (Line Manager). Đơn $\ge 3.0$ ngày: 2 cấp duyệt (Line Manager $\rightarrow$ Giám đốc Khối). | ✅ Passed |
| **BR-10** | Ủy quyền DoA & Route thông báo| Cho phép Quản lý ủy quyền duyệt khi vắng mặt; **tự động chuyển hướng toàn bộ thông báo đơn mới cho người nhận**. | ✅ Passed |
| **BR-11** | Vòng đời Rút / Hủy đơn | Đơn `CHỜ DUYỆT`: Rút đơn trực tiếp. Đơn `ĐÃ DUYỆT`: Bắt buộc tạo Yêu cầu hủy và cần Quản lý xác nhận mới hoàn phép. | ✅ Passed |
| **BR-12** | Lý do khi từ chối | Người duyệt khi bấm Từ chối bắt buộc phải nhập lý do giải trình tối thiểu **10 ký tự trở lên**. | ✅ Passed |
| **BR-13** | Chống trùng lịch cá nhân | Chặn tạo đơn nếu khoảng thời gian giao thoa với bất kỳ đơn nào trước đó đang ở trạng thái `CHỜ DUYỆT` hoặc `ĐÃ DUYỆT`. | ✅ Passed |
| **BR-14** | Phân tách Cổng truy cập | Đường dẫn `/admin/*` chỉ dành riêng cho vai trò `ADMIN`. Vai trò khác truy cập bị trả mã lỗi `403 Forbidden`. | ✅ Passed |
| **BR-15** | Nhật ký Kiểm toán Bắt buộc | Mọi thao tác điều chỉnh quỹ phép của Admin đều bắt buộc nhập lý do và lưu vào bảng Audit Log bất biến. | ✅ Passed |

---

## 🔄 9. MA TRẬN CHUYỂN ĐỔI TRẠNG THÁI ĐƠN NGHỈ PHÉP (STATE TRANSITION)

| Trạng thái hiện tại | Thao tác kích hoạt | Vai trò thực hiện | Điều kiện ràng buộc | Trạng thái mới |
| :--- | :--- | :--- | :--- | :---: |
| *(Khởi tạo)* | Gửi đơn mới ($< 3$ ngày) | Nhân viên | Hợp lệ, không thuộc kỳ công đã khóa | `CHỜ DUYỆT` |
| *(Khởi tạo)* | Gửi đơn mới ($\ge 3$ ngày) | Nhân viên | Hợp lệ, cần 2 cấp duyệt | `CHỜ DUYỆT` *(Cấp 1)* |
| `CHỜ DUYỆT` | Rút đơn (Recall) | Nhân viên | Đơn chưa xử lý | `ĐÃ HỦY` |
| `CHỜ DUYỆT` | Quản lý duyệt cấp 1 ($< 3$ ngày) | Quản lý / DoA | Khấu trừ quỹ phép | `ĐÃ DUYỆT` |
| `CHỜ DUYỆT` | Quản lý duyệt cấp 1 ($\ge 3$ ngày)| Quản lý / DoA | Chuyển tiếp lên Giám đốc | `CHỜ GĐ DUYỆT` *(Cấp 2)* |
| `CHỜ GĐ DUYỆT` | Giám đốc duyệt cấp 2 | Giám đốc bộ phận | Khấu trừ quỹ phép chính thức | `ĐÃ DUYỆT` |
| `CHỜ DUYỆT` / `CHỜ GĐ`| Từ chối đơn | Người duyệt | Bắt buộc nhập lý do $\ge 10$ ký tự | `ĐÃ TỪ CHỐI` |
| `ĐÃ DUYỆT` | Gửi yêu cầu hủy đơn | Nhân viên | Đơn chưa thuộc kỳ công đã khóa | `CHỜ HỦY DUYỆT` |
| `ĐÃ DUYỆT` | Gửi yêu cầu hủy đơn | Nhân viên | Đơn thuộc kỳ công đã khóa | ❌ **Bị chặn (Locked)** |
| `CHỜ HỦY DUYỆT` | Quản lý xác nhận hủy | Quản lý trực tiếp | Hoàn lại số ngày phép đã trừ | `ĐÃ HỦY` |
| `CHỜ HỦY DUYỆT` | Quản lý bác bỏ yêu cầu hủy | Quản lý trực tiếp | Duy trì đơn đã duyệt | `ĐÃ DUYỆT` |

---

## 🔑 10. DỮ LIỆU 6 TÀI KHOẢN MẪU KIỂM THỬ (SRS SECTION 7)

Tại màn hình Đăng nhập (`http://localhost:3000/login`), hệ thống hỗ trợ các nút **"Điền nhanh"** tương ứng với từng vai trò. Mật khẩu mặc định: **`Pass@123`**.

| Vai trò | Email đăng nhập | Họ và tên | Chức danh & Phòng ban | Đặc điểm kiểm thử phân quyền (SoD) |
| :--- | :--- | :--- | :--- | :--- |
| **IT Admin (System Admin)**| `itadmin@company.vn` | Nguyễn Hoàng Bách | Chuyên viên An ninh & IT Admin | Khởi tạo tài khoản gốc, cấu hình SSO, giám sát bảng Audit Log bất biến; không duyệt đơn, không chốt lương. |
| **HR Manager (Business Admin)**| `admin@company.vn` | Hoàng Thu Trang | Trưởng phòng Nhân sự | Quản lý hồ sơ, phân loại hợp đồng, cấu hình Lễ/Tết, khóa sổ kỳ công ngày 25, xuất Excel/PDF, điều chỉnh quỹ phép + Audit Log. |
| **Giám đốc Khối** | `director@company.vn` | Lê Khắc Hoàng | Giám đốc Khối Kỹ thuật | Phê duyệt cấp 2 cho các đơn dài ngày ($\ge 3$ ngày); thiết lập ủy quyền cho cấp phó. |
| **Quản lý trực tiếp**| `mai.tran@company.vn` | Trần Thị Mai | Trưởng phòng Kỹ thuật | Phê duyệt đơn cấp 1 (< 3 ngày); thiết lập ủy quyền DoA khi đi công tác/nghỉ phép. |
| **Quản lý nhận DoA**| `tuan.le@company.vn` | Lê Anh Tuấn | Phó phòng Kỹ thuật | Nhận ủy quyền DoA phê duyệt thay cho Trần Thị Mai; nhận thông báo chuyển hướng. |
| **Nhân viên (Chính thức)**| `an.nguyen@company.vn` | Nguyễn Văn An | Kỹ sư phần mềm (Senior) | Hợp đồng chính thức, thâm niên 3 năm (+1 ngày phép thưởng), có phép tồn năm cũ trước hạn 31/03. |
| **Nhân viên (Thử việc)** | `linh.dang@company.vn` | Đặng Thùy Linh | Nhân viên Thử việc (Frontend) | Hợp đồng thử việc: Form chỉ hiển thị duy nhất tùy chọn **"Nghỉ không hưởng lương"** (BR-02). |

---

## 📡 11. DANH SÁCH RESTful API ENDPOINTS

### 1. Xác thực & Hồ sơ (Auth Module)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập, trả về JWT Token và `redirectPath` theo Role (`/admin`, `/manager`, `/employee`).
- `GET /api/auth/me`: Lấy thông tin cá nhân đầy đủ (kèm role, contractType, position, canApprove, quota, previousQuota).

### 2. Nghiệp vụ Nghỉ phép & Lịch (Leave Module - Employee & Manager)
- `GET /api/leave/balance`: Lấy 4 chỉ số quỹ phép cá nhân (cấp năm nay, tồn năm cũ hạn 31/03, đã dùng, còn lại).
- `POST /api/leave/calculate-days`: Tính toán nhanh số ngày làm việc loại trừ Thứ 7, CN và ngày Lễ/Tết (BR-05).
- `POST /api/leave/request`: Tạo đơn xin nghỉ phép mới (kiểm tra thử việc, khóa kỳ công, upload file chứng từ y tế).
- `GET /api/leave/my-requests`: Lấy danh sách lịch sử đơn của cá nhân.
- `PUT /api/leave/request/:id`: Chỉnh sửa đơn khi đơn đang `CHỜ DUYỆT`.
- `DELETE /api/leave/request/:id/recall`: Rút đơn trực tiếp khi đơn đang `CHỜ DUYỆT` (BR-11).
- `POST /api/leave/request/:id/request-cancel`: Gửi yêu cầu hủy đơn đối với đơn đã được `APPROVED` (BR-11).
- `GET /api/leave/team-calendar?department=...&month=...&year=...`: Lấy dữ liệu Lịch phòng ban 4 màu sắc.
- `GET /api/leave/manager/requests?status=...`: Quản lý/Giám đốc xem danh sách đơn cần duyệt.
- `PATCH /api/leave/manager/request/:id/approve`: Phê duyệt đơn (Level 1 LM $\rightarrow$ Level 2 Director).
- `PATCH /api/leave/manager/request/:id/reject`: Từ chối đơn (kèm lý do $\ge 10$ ký tự - BR-12).
- `PATCH /api/leave/manager/request/:id/confirm-cancel`: Quản lý xác nhận hoặc bác bỏ yêu cầu hủy đơn đã duyệt.
- `GET /api/leave/delegations`: Lấy danh sách ủy quyền DoA của tài khoản.
- `POST /api/leave/delegations`: Thiết lập ủy quyền DoA mới (tự động chuyển hướng thông báo).
- `PATCH /api/leave/delegations/:id/revoke`: Thu hồi ủy quyền DoA trước hạn.
- `GET /api/leave/potential-delegatees`: Lấy danh sách nhân sự có thẩm quyền nhận ủy quyền.

### 3. Phân hệ Quản trị Hệ thống (Admin Module - Phân tách SoD giữa IT Admin và HR Manager)
- `GET /api/admin/users`: Lấy danh sách nhân sự, chức danh và hợp đồng toàn công ty (Cả `HR` và `ADMIN`).
- `POST /api/admin/users`: **[IT Admin]** Cấp phát tài khoản gốc, đặt mật khẩu ban đầu và phân quyền vai trò.
- `PATCH /api/admin/users/:id/adjust-quota`: **[HR Manager]** Điều chỉnh quỹ phép thủ công (bắt buộc nhập lý do $\ge 5$ ký tự $\rightarrow$ ghi Audit Log).
- `PATCH /api/admin/users/:id/update`: Cập nhật chức danh, vai trò và phân loại hợp đồng (*Thử việc / Chính thức*) (`HR` & `ADMIN`).
- `GET /api/admin/audit-logs`: Lấy danh sách Nhật ký kiểm toán bất biến (Audit Log Trail - BR-15) (`ADMIN` giám sát, `HR` đối soát).
- `GET /api/admin/holidays`: Lấy danh sách ngày Lễ, Tết quốc gia.
- `POST /api/admin/holidays`: **[HR Manager]** Thêm ngày Lễ/Tết mới vào hệ thống (BR-05).
- `DELETE /api/admin/holidays/:id`: **[HR Manager]** Xóa ngày Lễ/Tết khỏi hệ thống.
- `GET /api/admin/payroll-periods`: Lấy danh sách các kỳ tính lương.
- `POST /api/admin/payroll-periods/lock`: **[HR Manager]** Khóa sổ kỳ tính lương ngày 25 (chặn nộp lùi ngày - BR-07).
- `PATCH /api/admin/payroll-periods/:id/unlock`: **[HR Manager]** Mở khóa kỳ tính lương.
- `GET /api/admin/payroll/summary?monthYear=...`: **[HR Manager]** Lấy dữ liệu bảng tổng hợp công - phép phục vụ xuất file Excel & PDF (FR-14).
- `GET /api/admin/system/sso-config`: **[IT Admin]** Lấy thông tin cấu hình SSO Google/Microsoft và trạng thái hạ tầng/DB.
- `POST /api/admin/system/sso-config`: **[IT Admin]** Cập nhật cấu hình SSO OAuth 2.0 / OpenID Connect và chính sách bắt buộc MFA.

