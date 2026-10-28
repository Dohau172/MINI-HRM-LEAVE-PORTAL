# HƯỚNG DẪN DEPLOY TOÀN DIỆN LÊN RENDER (FREE TIER)
## DỰ ÁN: MINI HRM LEAVE PORTAL
**Repository GitHub:** [Dohau172 / MINI-HRM-LEAVE-PORTAL](https://github.com/Dohau172/MINI-HRM-LEAVE-PORTAL)  
**Công cụ thực hiện:** Git Bash (Windows) & Trình duyệt Web (Render Dashboard)

---

## 📌 TỔNG QUAN KIẾN TRÚC TRÊN RENDER

Để hệ thống hoạt động hoàn chỉnh trên môi trường Cloud Render (Free Tier), chúng ta sẽ triển khai **03 thành phần**:
1. 🗄️ **Render PostgreSQL (Free Database):** Lưu trữ CSDL quan hệ (`mini_hrm_leave`).
2. ⚙️ **Backend Web Service (Node/NestJS):** Chạy REST API tại cổng 5000 (`/api`), kết nối database và nạp sẵn 6 tài khoản mẫu (`seed.ts`).
3. 💻 **Frontend Static Site (React/Vite):** Triển khai Single Page Application (SPA), kết nối sang API Backend.

---

## 🚀 BƯỚC 1: DÙNG GIT BASH ĐẨY CODE LÊN GITHUB

Mở phần mềm **Git Bash** trên máy tính của bạn và thực hiện tuần tự các lệnh sau:

### 1. Di chuyển vào thư mục dự án:
```bash
cd /d/BCSE2023/DamBaoChatLuongPhanMem
```

### 2. Kiểm tra trạng thái các file đã sửa đổi:
```bash
git status
```

### 3. Thêm toàn bộ các file thay đổi vào Git Stage:
```bash
git add .
```

### 4. Tạo Commit ghi nhận các thay đổi (SRS biểu mẫu, 3 Bug ngoài SRS, file render.yaml):
```bash
git commit -m "feat: cap nhat SRS bieu mau, cai cam 3 bug ngoai SRS va bo sung render.yaml"
```

### 5. Đẩy code lên nhánh main của GitHub:
```bash
git push origin main
```
*(Nếu Git yêu cầu đăng nhập, hãy đăng nhập bằng trình duyệt hoặc sử dụng GitHub Personal Access Token).*

---

## 🌐 BƯỚC 2: DEPLOY LÊN RENDER (CHỌN 1 TRONG 2 CÁCH)

Truy cập vào trang chủ: **[https://render.com](https://render.com)** và đăng nhập bằng tài khoản **GitHub** của bạn (`Dohau172`).

---

### 👉 CÁCH 1: TRIỂN KHAI TỰ ĐỘNG BẰNG BLUEPRINT (KHUYÊN DÙNG - 1 CLICK)

Dự án đã được tích hợp sẵn file chuẩn [render.yaml](./render.yaml). Render sẽ tự động khởi tạo CSDL PostgreSQL, Backend và Frontend cùng lúc.

1. Tại màn hình chính của Render Dashboard, nhấp vào nút **New +** (góc trên bên phải) $\rightarrow$ chọn **Blueprint**.
2. Kết nối tới Repository: `Dohau172/MINI-HRM-LEAVE-PORTAL`.
3. Nhập tên Blueprint (ví dụ: `mini-hrm-leave-portal`).
4. Nhấn **Apply**.
5. Render sẽ tự động:
   - Tạo CSDL PostgreSQL miễn phí (`mini-hrm-db`).
   - Tạo Web Service Backend (`mini-hrm-backend`), cài đặt thư viện, chạy `prisma db push`, chạy `prisma:seed` và build code.
   - Tạo Static Site Frontend (`mini-hrm-frontend`).
6. Sau khi Backend deploy xong, lấy URL của Backend (ví dụ `https://mini-hrm-backend-xxxx.onrender.com`), vào phần cấu hình của Frontend $\rightarrow$ thêm biến môi trường:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://mini-hrm-backend-xxxx.onrender.com/api`
   - Nhấn **Save Changes** và chọn **Manual Deploy -> Deploy latest commit** cho Frontend.

---

### 👉 CÁCH 2: TRIỂN KHAI THỦ CÔNG TỪNG BƯỚC (MANUAL SETUP)

Nếu bạn muốn kiểm soát từng thành phần chi tiết:

#### 1. Khởi tạo Cơ sở dữ liệu (PostgreSQL Database):
1. Bấm **New +** $\rightarrow$ chọn **PostgreSQL**.
2. Điền thông tin:
   - **Name:** `mini-hrm-db`
   - **Database:** `mini_hrm_leave`
   - **User:** `postgres`
   - **Region:** `Singapore` (để tốc độ về Việt Nam nhanh nhất)
   - **Instance Type:** `Free`
3. Nhấn **Create Database**.
4. Chờ 1–2 phút cho database khởi tạo xong, cuộn xuống mục **Connections**, tìm và **Copy dòng "Internal Database URL"** (để kết nối nội bộ giữa Backend và DB).

---

#### 2. Khởi tạo Backend Web Service (NestJS):
1. Bấm **New +** $\rightarrow$ chọn **Web Service**.
2. Chọn repository: `Dohau172/MINI-HRM-LEAVE-PORTAL`.
3. Điền thông tin cấu hình:
   - **Name:** `mini-hrm-backend` (hoặc tên tùy thích)
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     rm -rf node_modules && npm install && npx prisma generate && npx prisma db push && npm run prisma:seed && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start:prod
     ```
   - **Instance Type:** `Free`
4. Cuộn xuống mục **Environment Variables**, bấm **Add Environment Variable** và thêm các biến sau:
   - `NODE_VERSION`: `20.18.0`
   - `PORT`: `5000`
   - `DATABASE_URL`: Dán dòng **Internal Database URL** vừa copy ở bước 1 vào đây.
   - `JWT_SECRET`: `super-secret-mini-hrm-key-2026`
   - `JWT_EXPIRES_IN`: `7d`
   - `UPLOAD_DIR`: `./uploads`
5. Nhấn **Create Web Service**.
6. Render sẽ bắt đầu build: nạp schema, chạy seed 6 tài khoản mẫu và khởi động server NestJS. Khi thấy dòng log `Mini HRM Backend Server is running on: http://localhost:5000/api` và trạng thái báo **Live** là thành công!
7. **Copy URL của Backend** (nằm ngay dưới tên dịch vụ, ví dụ: `https://mini-hrm-backend-xxxx.onrender.com`).

---

#### 3. Khởi tạo Frontend Static Site (React + Vite):
1. Bấm **New +** $\rightarrow$ chọn **Static Site**.
2. Chọn repository: `Dohau172/MINI-HRM-LEAVE-PORTAL`.
3. Điền thông tin cấu hình:
   - **Name:** `mini-hrm-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:**
     ```bash
     rm -rf node_modules && npm install && npm run build
     ```
   - **Publish Directory:** `dist`
4. Cuộn xuống mục **Environment Variables**, thêm biến:
   - `NODE_VERSION`: `20.18.0`
   - `VITE_API_URL`: `https://mini-hrm-backend-xxxx.onrender.com/api` *(thay bằng URL Backend thật bạn vừa copy ở bước 2, nhớ có đuôi `/api`)*.
5. **CẤU HÌNH QUAN TRỌNG ĐỂ KHÔNG BỊ LỖI 404 KHI F5 TRANG (SPA REWRITE):**
   - Vào menu bên trái của Frontend $\rightarrow$ chọn **Redirects/Rewrites**.
   - Bấm **Add Rule**:
     * **Type:** `Rewrite`
     * **Source:** `/*`
     * **Destination:** `/index.html`
   - Bấm **Save Changes**.
6. Nhấn **Create Static Site** (hoặc **Manual Deploy $\rightarrow$ Clear build cache & deploy**).
7. Chờ build xong, Render sẽ cấp cho bạn đường link Web Frontend (ví dụ: `https://mini-hrm-frontend-xxxx.onrender.com`).

---

## 🔑 BƯỚC 3: KIỂM TRA ĐĂNG NHẬP SAU KHI DEPLOY

Truy cập vào URL Frontend vừa tạo:
1. Bạn sẽ thấy màn hình đăng nhập với giao diện xanh Trust Blue.
2. Tại màn hình Login có các nút **Điền nhanh tài khoản kiểm thử**:
   - **HR Manager (Admin):** `admin@company.vn` / `Pass@123`
   - **IT Admin:** `itadmin@company.vn` / `Pass@123`
   - **Quản lý trực tiếp:** `mai.tran@company.vn` / `Pass@123`
   - **Giám đốc khối:** `director@company.vn` / `Pass@123`
   - **Nhân viên chính thức:** `an.nguyen@company.vn` / `Pass@123`
   - **Nhân viên thử việc:** `linh.dang@company.vn` / `Pass@123`

---

## ⚠️ LƯU Ý ĐẶC THÙ VỀ RENDER FREE TIER

1. **Cơ chế Cold Start (Ngủ đông):**
   - Trên gói Free của Render, nếu không có ai truy cập trong vòng **15 phút**, Web Service Backend sẽ tự động tạm dừng để tiết kiệm tài nguyên.
   - Khi có người truy cập lại, lượt request đầu tiên sẽ mất khoảng **30 - 50 giây** để server khởi động lại (*Cold Start*). Mã nguồn Frontend đã được cài sẵn cơ chế `timeout: 60000ms (60s)` để kiên nhẫn chờ Backend thức dậy mà không báo lỗi mạng ngay.
2. **Thời hạn PostgreSQL Free của Render:**
   - Database PostgreSQL miễn phí trên Render có thời hạn 30 ngày. Nếu cần sử dụng lâu dài miễn phí vĩnh viễn, bạn có thể tạo database PostgreSQL miễn phí trên **Supabase** (`https://supabase.com`) hoặc **Neon** (`https://neon.tech`) rồi lấy `DATABASE_URL` dán vào Render Backend.
