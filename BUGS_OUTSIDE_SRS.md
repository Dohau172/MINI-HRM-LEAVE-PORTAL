# BÁO CÁO CÁC LỖI CẤY THÊM NGOÀI ĐẶC TẢ SRS (INJECTED BUGS OUTSIDE SRS)
## MÔN HỌC: ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM (SQA) - BCSE2023
**Hệ thống:** Mini HRM Leave Portal (v3.3)  
**Tài liệu quy chiếu:** `SRS_Leave_Management_System.md`  

---

## 📌 1. TỔNG QUAN

Tài liệu này ghi nhận **03 lỗi phần mềm (Defects/Bugs)** được cấy thêm vào hệ thống với 3 cấp độ nghiêm trọng khác nhau: **Low (Thấp)**, **Medium (Trung bình)** và **High (Cao)**.

### Vì sao các lỗi này được gọi là "Ngoài đặc tả SRS"?
- **15 Quy tắc Nghiệp vụ (BR-01 đến BR-15)** trong tài liệu SRS vẫn được cài đặt đầy đủ và **100% vượt qua bộ Unit Test tự động** (`leave-rules.spec.ts`).
- Các lỗi này phát sinh từ các góc độ **Kiểm thử Thực tế chuyên sâu** mà một tài liệu đặc tả nghiệp vụ thông thường (Business SRS) thường không liệt kê cụ thể hoặc xem là mặc định:
  1. **Kiểm thử Giao diện & Biên chuỗi (UI Boundary & Word-break):** SRS không đặc tả việc cắt chuỗi khi người dùng cố tình nhập chuỗi siêu dài không có khoảng trắng.
  2. **Kiểm thử Tương tác Bất đồng bộ & Race Condition (Client-side Double Submit):** SRS quy định quy tắc chống trùng lịch (BR-13) ở mức dữ liệu tĩnh, nhưng không đặc tả xử lý Double-click/Debounce trên giao diện mạng bất đồng bộ.
  3. **Kiểm thử An toàn Thông tin & Phân quyền Đối tượng (Security / IDOR - OWASP Top 1):** SRS quy định quyền rút đơn cho nhân viên, nhưng thiếu cơ chế kiểm tra phân quyền sở hữu đối tượng ở tầng backend controller/service.

---

## 📊 2. BẢNG TỔNG HỢP 3 LỖI

| Mã Bug | Tên lỗi | Phân loại | Mức độ (Severity) | Vị trí mã nguồn |
| :--- | :--- | :--- | :---: | :--- |
| **BUG-01-LOW** | Vỡ giao diện bảng lịch sử khi lý do chứa chuỗi dài liên tục không ngắt quãng | UI/UX Display Glitch | 🟢 **Low** | `frontend/src/pages/EmployeeDashboard.tsx` (dòng ~580) |
| **BUG-02-MEDIUM** | Tạo đơn nghỉ phép trùng lặp do thiếu Debounce/Disable nút gửi (Double Submission) | Functional / Race Condition | 🟡 **Medium** | `frontend/src/pages/EmployeeDashboard.tsx` (dòng ~490) |
| **BUG-03-HIGH** | Lỗ hổng IDOR cho phép nhân viên rút/hủy đơn của người khác | Security / Broken Access Control | 🔴 **High** | `backend/src/leave/leave.service.ts` (dòng ~320) |

---

## 🔍 3. CHI TIẾT TỪNG LỖI & HƯỚNG DẪN KIỂM THỬ

### 🟢 BUG-01-LOW: Vỡ layout bảng khi nhập lý do dài không có khoảng cách

- **Vị trí file:** `frontend/src/pages/EmployeeDashboard.tsx`
- **Mô tả lỗi:**
  - Trong bảng hiển thị lịch sử đơn của nhân viên, ô hiển thị Lý do (`req.reason`) được đặt thuộc tính `whitespace-nowrap overflow-visible` và loại bỏ cơ chế cắt chuỗi (`truncate` / `break-words` / `max-w-xs`).
  - Khi nhân viên nộp đơn có lý do là một chuỗi ký tự liền nhau không có dấu cách (ví dụ đường dẫn Jira Ticket rất dài hoặc chuỗi ký tự lặp liên tục `aaaaaa...`), ô dữ liệu bị kéo giãn vô hạn theo chiều ngang.
- **Hậu quả:**
  - Cột lý do làm phình to chiều rộng toàn bộ bảng dữ liệu, đẩy các cột quan trọng phía sau như **"Số ngày"**, **"Trạng thái"**, và **"Thao tác" (nút Rút đơn, Sửa đơn)** văng ra khỏi khung hình bên phải.
  - Gây thanh cuộn ngang khó chịu và phá vỡ tính tương thích giao diện Responsive (NFR-01).
- **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập với tài khoản nhân viên (ví dụ: `an.nguyen@company.vn` / `Pass@123`).
  2. Tại form xin nghỉ phép, chọn ngày và loại phép bất kỳ.
  3. Tại ô **Lý do nghỉ**, nhập chuỗi ký tự liền nhau không có khoảng trắng dài hơn 80 ký tự:
     `https://jira.company.vn/browse/SQA-PROJECT-LONG-TASK-KEY-WITHOUT-ANY-SPACE-IN-THE-REASON-TEXT-FOR-TESTING`
  4. Bấm **"Nộp đơn xin nghỉ phép"**.
  5. Nhìn sang bảng **"Lịch sử đơn của tôi"** ở bên phải: Bảng bị vỡ layout ngang, thanh cuộn xuất hiện, nút "Rút đơn" bị đẩy trôi ra ngoài màn hình.
- **Kết quả thực tế (Actual Result):** Cột bảng bị kéo giãn không giới hạn, mất cân đối UI.
- **Kết quả mong đợi (Expected Result):** Chuỗi dài phải được tự động ngắt dòng (`break-words`) hoặc hiển thị dạng rút gọn (`truncate`) kèm tooltip (`title`).
- **Cách khắc phục (Fix):**
  Thêm class CSS `truncate max-w-xs` hoặc `break-words` vào thẻ `div` hiển thị lý do:
  ```tsx
  <div className="text-xs text-slate-500 truncate max-w-xs" title={req.reason}>
    {req.reason}
  </div>
  ```

---

### 🟡 BUG-02-MEDIUM: Lỗi gửi đơn trùng lặp do thiếu Debounce / Disabled khi Submit

- **Vị trí file:** `frontend/src/pages/EmployeeDashboard.tsx`
- **Mô tả lỗi:**
  - Nút bấm `[Nộp đơn xin nghỉ phép]` bị loại bỏ thuộc tính `disabled={submitting}` trong lúc đang chờ server phản hồi.
  - SRS có quy tắc **BR-13 (Chống trùng lịch cá nhân)**, tuy nhiên BR-13 chỉ so sánh khoảng thời gian xin nghỉ với các đơn **đã được lưu trong cơ sở dữ liệu**.
  - Khi người dùng click đúp (double-click nhanh) hoặc nhấn phím Enter liên tục khi mạng có độ trễ, trình duyệt sẽ phát sinh 2 yêu cầu HTTP `POST /api/leave/request` song song gần như cùng một tích tắc. Cả 2 yêu cầu đều đọc DB trước khi yêu cầu nào kịp ghi xong, dẫn đến cả 2 đều qua được bước kiểm tra BR-13.
- **Hậu quả:**
  - Tạo ra 2 bản ghi đơn nghỉ phép giống hệt nhau (cùng ngày, cùng loại phép, cùng lý do) trong hệ thống.
  - Người quản lý khi duyệt sẽ thấy 2 đơn trùng nhau, gây hoang mang và có thể trừ đúp quỹ phép nếu quản lý duyệt cả hai.
- **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập tài khoản nhân viên (`an.nguyen@company.vn`).
  2. Điền thông tin đơn xin nghỉ phép hợp lệ.
  3. Bật tab Network trong Developer Tools (F12) và chỉnh tốc độ mạng về **"Slow 3G"** hoặc **"Fast 3G"** (để dễ dàng quan sát).
  4. Nhấn đúp chuột thật nhanh (double-click liên tiếp 2 lần) vào nút **"Nộp đơn xin nghỉ phép (Hoàn tất)"**.
  5. Quan sát tab Network: Có 2 request `POST /api/leave/request` được gửi đi và đều trả về `201 Created`.
  6. Tải lại trang hoặc kiểm tra danh sách: Xuất hiện **2 đơn nghỉ phép trùng ngày** nằm cạnh nhau ở trạng thái `CHỜ DUYỆT`.
- **Kết quả thực tế (Actual Result):** Hệ thống tạo ra 2 đơn nghỉ phép trùng thời gian.
- **Kết quả mong đợi (Expected Result):** Nút gửi phải bị vô hiệu hóa (`disabled`) ngay từ cú click đầu tiên, ngăn chặn hoàn toàn việc gửi request thứ hai.
- **Cách khắc phục (Fix):**
  Bật lại thuộc tính `disabled={submitting}` trên nút Submit và thêm cờ kiểm tra ở đầu hàm `handleSubmit`:
  ```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Chặn double-submit
    setSubmitting(true);
    // ...
  };

  <button type="submit" disabled={submitting} className="...">
    {submitting ? 'Đang gửi...' : 'Nộp đơn xin nghỉ phép'}
  </button>
  ```

---

### 🔴 BUG-03-HIGH: Lỗ hổng IDOR cho phép rút đơn của nhân viên khác

- **Vị trí file:** `backend/src/leave/leave.service.ts` (phương thức `recallRequest`)
- **Mô tả lỗi:**
  - Lập trình viên đã vô tình (hoặc thiếu sót) comment bỏ dòng code kiểm tra quyền sở hữu đơn:
    ```typescript
    /*
    if (leave.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền rút đơn của nhân viên khác.');
    }
    */
    ```
  - API `DELETE /api/leave/request/:id/recall` chỉ kiểm tra: Đơn có tồn tại không? Đơn có ở trạng thái `PENDING` không? **Nhưng hoàn toàn không kiểm tra xem đơn đó có thuộc về người dùng đang đăng nhập hay không!**
- **Hậu quả:**
  - **Lỗ hổng Broken Object Level Authorization (IDOR - OWASP API Security Top 1):** Bất kỳ người dùng nào có tài khoản hợp lệ (kể cả nhân viên thử việc `linh.dang@company.vn`) đều có thể rút/hủy đơn xin nghỉ phép của đồng nghiệp, trưởng phòng hoặc giám đốc nếu biết hoặc dò được `requestId`.
  - Vi phạm nghiêm trọng tính toàn vẹn (Integrity) và bảo mật dữ liệu doanh nghiệp.
- **Các bước tái hiện (Steps to Reproduce):**
  1. Đăng nhập bằng tài khoản nhân viên A: `an.nguyen@company.vn` (`Pass@123`).
  2. Tạo một đơn nghỉ phép mới (trạng thái sẽ là `PENDING`). Mở F12 -> tab Network để xem và copy `id` của đơn vừa tạo (ví dụ: `d9e8f7a6-...`).
  3. Đăng xuất khỏi hệ thống.
  4. Đăng nhập bằng tài khoản nhân viên B: `linh.dang@company.vn` (`Pass@123`).
  5. Mở Postman hoặc Console trình duyệt (F12) tại màn hình của B, chạy câu lệnh fetch gọi API rút đơn bằng `id` của nhân viên A:
     ```javascript
     fetch('/api/leave/request/ID_DON_CUA_NGUYEN_VAN_AN/recall', {
       method: 'DELETE',
       headers: {
         'Authorization': 'Bearer ' + localStorage.getItem('token')
       }
     }).then(res => res.json()).then(data => console.log(data));
     ```
  6. Phản hồi trả về: `HTTP 200 OK` kèm thông báo `{"message": "Rút đơn xin nghỉ phép thành công!"}`.
  7. Đăng nhập lại bằng tài khoản A: Đơn của A đã bị chuyển sang trạng thái `ĐÃ HỦY` (CANCELLED) một cách bất thường mà A không hề hay biết!
- **Kết quả thực tế (Actual Result):** Nhân viên B hủy được đơn của nhân viên A mà không bị chặn `403 Forbidden`.
- **Kết quả mong đợi (Expected Result):** Server phải trả về `403 Forbidden` với thông báo: *"Bạn không có quyền rút đơn của nhân viên khác."*
- **Cách khắc phục (Fix):**
  Bỏ comment và kích hoạt lại khối lệnh kiểm tra quyền sở hữu trong `backend/src/leave/leave.service.ts`:
  ```typescript
  if (leave.userId !== userId) {
    throw new ForbiddenException('Bạn không có quyền rút đơn của nhân viên khác.');
  }
  ```

---

## 🎯 4. HƯỚNG DẪN DÀNH CHO GIÁO VIÊN / NGƯỜI ĐÁNH GIÁ (SQA EVALUATOR)

- Cả 3 lỗi trên đã được cấy trực tiếp vào mã nguồn của dự án và có chú thích rõ ràng bằng comment:
  - `[INJECTED_BUG: BUG-01-LOW ...]`
  - `[INJECTED_BUG: BUG-02-MEDIUM ...]`
  - `[INJECTED_BUG: BUG-03-HIGH ...]`
- Các bạn sinh viên / tester có thể sử dụng các kịch bản kiểm thử (Test Scenarios / Test Cases) sau để phát hiện:
  1. **UI Boundary Testing:** Nhập chuỗi độ dài cực đại không có whitespace.
  2. **Concurrency / Monkey Testing:** Click spam liên tục nhiều lần vào các nút submit.
  3. **Security / Negative API Testing:** Thay thế ID trên URL/Path parameters bằng ID của đối tượng khác để kiểm tra lỗ hổng phân quyền IDOR.
