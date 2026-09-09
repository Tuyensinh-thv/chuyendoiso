# KẾ HOẠCH XÂY DỰNG PHẦN MỀM WEB (WEBAPP)
## QUẢN LÝ TIẾN ĐỘ NHIỆM VỤ THEO CÔNG VĂN ĐÔN ĐỐC NGHỊ QUYẾT 57-NQ/TW
*Người lập kế hoạch: Nguyễn Trung Kiên - Giảng viên phụ trách CNTT & Chuyển đổi số, Tổ tuyển sinh - Phòng Đào tạo*

---

### I. ĐẶT VẤN ĐỀ & MỤC TIÊU DỰ ÁN
Nhà trường đã ban hành Công văn đôn đốc thực hiện các nhiệm vụ trọng tâm của Nghị quyết 57-NQ/TW hoàn thành trong tháng 9-10/2026 với tổng cộng **48 nhiệm vụ** được chia làm 5 nhóm lớn (theo các Kế hoạch số 197, 200, 154, 201, 172, 188). 

Để thay đổi phương thức báo cáo thủ công bằng file rời (Word, Excel) vốn gây chậm trễ, khó tổng hợp và khó kiểm soát minh chứng, việc xây dựng một ứng dụng Web (Webapp) gọn nhẹ, trực quan và dễ sử dụng là vô cùng cấp bách. 

**Mục tiêu của ứng dụng:**
1. **Số hóa 100% quy trình theo dõi:** Cập nhật trạng thái thực hiện thời gian thực (Real-time).
2. **Quản lý minh chứng tập trung:** Toàn bộ báo cáo, văn bản, quyết định (file minh chứng) được upload trực tiếp lên Google Drive dùng chung của Nhà trường.
3. **Phân quyền rõ ràng:** Lãnh đạo chỉ đạo - Tổ chuyên trách đôn đốc - Đơn vị chủ trì cập nhật.
4. **Trực quan hóa dạng Kanban:** Quản lý dự án kéo - thả đơn giản, dễ dùng cho mọi đối tượng cán bộ.

---

### II. KIẾN TRÚC GIẢI PHÁP (GOOGLE WORKSPACE - ZERO COST)
Để đảm bảo triển khai nhanh chóng (trong vòng 2-3 tuần), không phát sinh chi phí mua bản quyền phần mềm hay thuê máy chủ, tôi đề xuất giải pháp **Google Apps Script (GAS) Web App** chạy trực tiếp trên hạ tầng Google Workspace sẵn có của Nhà trường (tận dụng tài khoản `@hvu.edu.vn`).

```
  [ Giao diện Web (HTML5/Bootstrap 5) ] 
                 │ (Xác thực tài khoản Google / Phân quyền)
                 ▼
  [ Google Apps Script (GAS) API ] 
         ├── Read/Write ──► [ Google Sheets (Database) ]
         └── Upload File ──► [ Google Drive (Storage Minh chứng) ]
```

*   **Cơ sở dữ liệu (Database):** Google Sheets (Lưu trữ danh sách nhiệm vụ, tài khoản, lịch sử cập nhật).
*   **Không gian lưu trữ (Storage):** Google Drive (Tạo thư mục riêng cho từng đơn vị chủ trì để lưu minh chứng).
*   **Giao diện ứng dụng (Frontend):** Thiết kế bằng HTML5/Bootstrap 5 mang phong cách Kanban hiện đại, hiển thị mượt mà cả trên máy tính và điện thoại di động.

---

### III. THIẾT KẾ CƠ SỞ DỮ LIỆU (CẤU TRÚC GOOGLE SHEETS)

Database sẽ gồm 2 bảng (Sheet) chính:

#### 1. Sheet `Tai_Khoan` (Quản lý và Phân quyền)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| **Email** | Text (Key) | Email định dạng `@hvu.edu.vn` dùng để đăng nhập và xác thực tự động |
| **Ho_Ten** | Text | Họ và tên cán bộ |
| **Don_Vi** | Text | Tên đơn vị thuộc Trường (ví dụ: Văn phòng, Phòng Đào tạo, Khoa KT-CN...) |
| **Vai_Tro** | Text | Quyền hạn: `Lanh_Dao` (Hiệu trưởng/PHT), `To_Chuyen_Trach` (Thư ký/Admin), `Don_Vi` |

#### 2. Sheet `Nhiem_Vu_NQ57` (Danh mục 48 nhiệm vụ)
Cấu trúc bảng được xây dựng chuẩn hóa theo các cột trong Phụ lục Công văn đôn đốc:
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| **ID** | Number (Key) | Mã định danh duy nhất (từ NV01 đến NV48) |
| **Nhom_Ke_Hoach** | Text | Phân loại: *Kế hoạch 197 (100 ngày CĐS)*, *Kế hoạch 200 (90 ngày Kho dữ liệu)*, *Bình dân học vụ số*... |
| **Ten_Nhiem_Vu** | Text | Nội dung chi tiết nhiệm vụ cần thực hiện |
| **Don_Vi_Chu_Tri**| Text | Đơn vị chịu trách nhiệm chính trước Nhà trường |
| **Don_Vi_Phoi_Hop**| Text | Các đơn vị phối hợp triển khai |
| **San_Pham_Dau_Ra**| Text | Sản phẩm hoặc minh chứng yêu cầu (Văn bản cập nhật, báo cáo, quyết định...) |
| **Thoi_Han** | Date | Thời hạn hoàn thành bắt buộc (Ví dụ: Trước 15/9/2026, 30/10/2026...) |
| **Trang_Thai** | Text | Trạng thái hiện tại: `Chưa thực hiện` \| `Đang thực hiện` \| `Sắp đến hạn` \| `Đã hoàn thành` \| `Quá hạn` |
| **Nguoi_Phu_Trach**| Text | Họ tên giảng viên/cán bộ trực tiếp xử lý |
| **Link_Minh_Chung**| Hyperlink | Đường dẫn tới file minh chứng đã upload trên Google Drive |
| **Ghi_Chu_Noi_Bo** | Text | Nhật ký cập nhật tiến độ, vướng mắc của đơn vị |
| **Y_Kien_Chi_Dao** | Text | Ý kiến chỉ đạo, đôn đốc trực tiếp của Lãnh đạo trường |
| **Ngay_Cap_Nhat** | DateTime | Thời gian cập nhật cuối cùng của dòng dữ liệu |

---

### IV. THIẾT KẾ CHỨC NĂNG & PHÂN QUYỀN TRÊN WEBAPP

Hệ thống tự động nhận diện tài khoản Google khi người dùng truy cập để phân quyền hiển thị:

#### 1. Giao diện dành cho Lãnh đạo trường (Vai trò: `Lanh_Dao`)
*   **Trực quan hóa Dashboard:** Biểu đồ tròn hiển thị tỷ lệ % hoàn thành nhiệm vụ của toàn trường, biểu đồ cột so sánh tiến độ giữa các đơn vị.
*   **Chỉ đạo trực tiếp:** Lãnh đạo click vào bất kỳ nhiệm vụ nào để mở Pop-up xem báo cáo tiến độ, xem nhanh file minh chứng và nhập **"Ý kiến chỉ đạo"**. Ý kiến này ngay lập tức được gửi email thông báo/hiển thị nổi bật trên màn hình của đơn vị chủ trì.
*   **Bộ lọc thông minh:** Lọc nhanh các nhiệm vụ theo trạng thái `Quá hạn` hoặc lọc riêng theo từng đơn vị để phục vụ giao ban tuần/tháng.

#### 2. Giao diện dành cho Đơn vị thực hiện (Vai trò: `Don_Vi`)
*   **Bộ lọc cá nhân hóa:** Đơn vị đăng nhập chỉ nhìn thấy các nhiệm vụ mà đơn vị mình được giao làm **Chủ trì** hoặc **Phối hợp** (đơn giản hóa giao diện, tránh làm loãng thông tin).
*   **Cập nhật tiến độ & Upload minh chứng:**
    *   Cán bộ có thể cập nhật trạng thái (`Đang thực hiện` -> `Đã hoàn thành`).
    *   Tích hợp nút **"Tải lên minh chứng"**: Khi bấm nút, cán bộ chọn file từ máy tính/điện thoại. Ứng dụng sử dụng Drive API để tự động tải file lên thư mục Google Drive của đơn vị, tự động đổi tên file theo định dạng chuẩn `[Mã_NV]_[Tên_Đơn_Vị]_[Tên_File]` và tự động ghi nhận link liên kết vào ô `Link_Minh_Chung` trong Google Sheets.
    *   Nhập ghi chú nội bộ về khó khăn gặp phải nếu có.

#### 3. Giao diện dành cho Ban Thư ký / Tổ Chuyển đổi số (Vai trò: `To_Chuyen_Trach`)
*   **Toàn quyền điều phối:** Có quyền chỉnh sửa tất cả các trường dữ liệu, thêm mới hoặc hủy bỏ nhiệm vụ khi có chỉ đạo.
*   **Công cụ đôn đốc tự động:** Nút bấm quét toàn bộ danh sách, tự động gửi Email đôn đốc đến các đơn vị có nhiệm vụ ở trạng thái `Quá hạn` hoặc `Sắp đến hạn` (trước thời hạn 3 ngày).

---

### V. GIAO DIỆN NGƯỜI DÙNG (UI/UX) - TRỰC QUAN & ĐƠN GIẢN

Giao diện được xây dựng theo triết lý **"Phẳng hóa - Trực quan hóa"** gồm 2 khu vực chính:

#### 1. Khu vực Thống kê KPI nhanh (Dashboard gọn)
Phía trên cùng hiển thị 4 khối màu sắc thể hiện các chỉ số sức khỏe của chiến dịch:
*   🟢 **Đã hoàn thành:** [Số lượng] (% hoàn thành)
*   🟡 **Đang thực hiện:** [Số lượng]
*   🟠 **Sắp đến hạn (còn dưới 3 ngày):** [Số lượng] (Hiển thị nhấp nháy cảnh báo)
*   🔴 **Quá hạn/Chưa xong:** [Số lượng]

#### 2. Khu vực Quản lý tiến độ Kanban (Project Board)
Dữ liệu nhiệm vụ được dàn trang thành 4 cột Kanban đứng bên cạnh nhau:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  CHƯA THỰC HIỆN  │ │  ĐANG THỰC HIỆN  │ │   SẮP ĐẾN HẠN    │ │  ĐÃ HOÀN THÀNH   │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ 📄 NV01: Rà soát │ │ 📄 NV13: Rà soát │ │ 📄 NV12: QĐ lập  │ │ 📄 NV04: Rà soát │
│  văn bản quy chế │ │  danh mục CSDL   │ │  tổ giúp việc    │ │  chính sách hỗ trợ│
│  [Văn phòng]     │ │  [Văn phòng]     │ │  [Văn phòng]     │ │  [Văn phòng]     │
│  Hạn: 15/9/2026  │ │  Hạn: 15/9/2026  │ │  Hạn: 07/9/2026  │ │  Hạn: 15/9/2026  │
│                  │ │                  │ │  ⚠️ Còn 1 ngày    │ │  📎 Đã có file   │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

*   **Tính năng tương tác:** Click trực tiếp vào từng thẻ nhiệm vụ sẽ hiển thị một cửa sổ nhỏ (Modal Pop-up) chứa toàn bộ thông tin chi tiết: Tên nhiệm vụ, Đơn vị phối hợp, Sản phẩm đầu ra, Nút tải file minh chứng, ô Ghi chú tiến độ, ô Ý kiến chỉ đạo của Lãnh đạo trường.
*   **Tự động hóa Logic trạng thái:** Hệ thống tự động quét cột `Thoi_Han` so với ngày hiện tại để chuyển trạng thái sang `Quá hạn` (màu đỏ) nếu ngày hiện tại vượt quá ngày hẹn mà trạng thái vẫn chưa là `Đã hoàn thành`.

---

### VI. KẾ HOẠCH TRIỂN KHAI CHI TIẾT (LỘ TRÌNH 4 TUẦN)

#### Tuần 1: Chuẩn bị & Chuẩn hóa dữ liệu nguồn
*   **Công việc 1:** Nhập liệu toàn bộ 48 nhiệm vụ từ Công văn đôn đốc vào Google Sheets chuẩn, tạo các danh mục đơn vị chủ trì.
*   **Công việc 2:** Thu thập danh sách Email `@hvu.edu.vn` của Trưởng các đơn vị và cán bộ đầu mối thực hiện để nạp vào bảng phân quyền.
*   **Công việc 3:** Thiết lập cấu trúc thư mục lưu trữ minh chứng trên Google Drive của Trường, phân quyền thư mục tương ứng cho từng đơn vị.

#### Tuần 2: Lập trình & Kết nối hệ thống (Phòng Đào tạo phối hợp Tổ CĐS)
*   **Công việc 1:** Viết mã Google Apps Script để kết nối và xử lý dữ liệu giữa Sheets, Drive và Web App.
*   **Công việc 2:** Xây dựng giao diện Web động bằng Bootstrap 5, tích hợp thư viện vẽ biểu đồ trực quan (Chart.js) cho màn hình của Lãnh đạo.
*   **Công việc 3:** Lập trình tính năng Upload file trực tiếp từ Webapp lên thư mục Drive đã chỉ định.

#### Tuần 3: Kiểm thử & Đào tạo hướng dẫn sử dụng
*   **Công việc 1:** Chạy thử nghiệm nội bộ trong Tổ chuyển đổi số của Trường để rà soát lỗi bảo mật, kiểm tra độ mượt của việc kéo thả trạng thái và upload file.
*   **Công việc 2:** Gửi tài liệu hướng dẫn và tổ chức phiên họp trực tuyến (khoảng 30 phút) hướng dẫn nhanh cách dùng cho Trưởng các đơn vị. Do giao diện thiết kế cực kỳ đơn giản (chỉ có xem card và bấm nút upload) nên việc tập huấn sẽ rất nhanh chóng.

#### Tuần 4: Nghiệm thu & Vận hành chính thức
*   **Công việc 1:** Trình Hiệu trưởng phê duyệt và chính thức ban hành đường link truy cập hệ thống quản lý tiến độ.
*   **Công việc 2:** Ban thư ký theo dõi, hỗ trợ kỹ thuật và thực hiện đôn đốc tự động hàng tuần.

---
*Kế hoạch này đảm bảo tính khả thi cao, đáp ứng đúng các tiêu chí: **Đơn giản - Trực quan - Bảo mật - Tiết kiệm chi phí**, giúp nâng cao năng lực chuyển đổi số và kỷ luật thực thi nhiệm vụ của Trường Đại học Hùng Vương.*