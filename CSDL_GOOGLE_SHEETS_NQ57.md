# HỆ THỐNG CƠ SỞ DỮ LIỆU GOOGLE SHEETS - CỔNG ĐIỀU HÀNH CHUYỂN ĐỔI SỐ NQ57
**Trường Đại học Hùng Vương (HVU)**  
**Mã Bảng Tính (Spreadsheet ID):** `1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc`

---

## 1. SƠ ĐỒ MỐI QUAN HỆ CƠ SỞ DỮ LIỆU (RELATIONAL ERD)

```
+--------------------------+          +--------------------------+
|    02_Nhom_Ke_Hoach      |          |    03_Danh_Muc_Don_Vi    |
+--------------------------+          +--------------------------+
| PK: Ma_Nhom_KH           |<----+    | PK: Ma_Don_Vi            |<----+
|     Ten_Ke_Hoach         |     |    |     Ten_Don_Vi           |     |
|     So_Quyet_Dinh        |     |    |     Phan_Loai            |     |
|     Ngay_Ban_Hanh        |     |    |     Email_Don_Vi         |     |
+--------------------------+     |    +--------------------------+     |
                                 |                                     |
                                 |    +--------------------------+     |
                                 |    | 04_Tai_Khoan_Nguoi_Dung  |     |
                                 |    +--------------------------+     |
                                 |    | PK: Ma_Nguoi_Dung        |<--+ |
                                 |    |     Ten_Dang_Nhap        |   | |
                                 |    |     Ho_Ten, Email        |   | |
                                 |    | FK: Ma_Don_Vi            |---+ |
                                 |    |     Vai_Tro_He_Thong     |   |
                                 |    +--------------------------+   |
                                 |                                   |
+--------------------------------+---------------------------------+ |
|                       01_Nhiem_Vu_NQ57                           | |
+------------------------------------------------------------------+ |
| PK: Ma_NV (NV01, NV02...)                                        | |
| FK: Ma_Nhom_KH --------------------------------------------------+ |
|     Tieu_de_Nhiem_vu, Noi_dung_Chi_tiet                          | |
| FK: Ma_Don_vi_Chu_tri -------------------------------------------+ |
|     Don_vi_Phoi_hop, San_pham_Dau_ra                             | |
|     Thoi_han (YYYY-MM-DD), Trang_thai                            | |
|     Muc_do_Uu_tien, Tien_do_Phan_tram                            | |
| FK: Ma_Nguoi_Phu_trach ------------------------------------------+ |
|     Thu_muc_Minh_chung_Drive, Ghi_chu_Noi_bo, Y_kien_Lanh_dao    | |
|     Ngay_Tao, Ngay_Cap_nhat                                      | |
+------------------------------------------------------------------+ |
           |                                  |                      |
           | 1:N                              | 1:N                  | 1:N
           v                                  v                      v
+-----------------------+          +--------------------+  +----------------------+
|  05_Minh_Chung_File   |          | 06_Nhat_Ky_Log     |  | 07_Chi_Dao_Binh_Luan |
+-----------------------+          +--------------------+  +----------------------+
| PK: Ma_Minh_Chung     |          | PK: Ma_Nhat_Ky     |  | PK: Ma_Binh_Luan     |
| FK: Ma_NV             |          | FK: Ma_NV          |  | FK: Ma_NV            |
|     Ten_File          |          | FK: Ma_Nguoi_Dung  |  | FK: Ma_Nguoi_Dung    |
|     Duong_Dan_Drive   |          |     Loai_Hanh_Dong |  |     Phan_Loai_Tin    |
|     Dung_Luong_KB     |          |     Gia_Tri_Cu     |  |     Noi_Dung         |
|     Trang_Thai_Kiem_Dinh|        |     Gia_Tri_Moi    |  |     Thoi_Gian        |
+-----------------------+          +--------------------+  +----------------------+
```

---

## 2. CẤU TRÚC CHI TIẾT CÁC BẢNG DỮ LIỆU (SHEET TABS)

## 2. CẤU TRÚC CHI TIẾT CÁC BẢNG DỮ LIỆU (SHEET TABS)

### Bảng 1: `01_Nhiem_Vu_NQ57` (Bảng trung tâm - Quản lý 57 nhiệm vụ chuẩn hóa)
| Cột | Tên trường | Kiểu dữ liệu | Ràng buộc / Ý nghĩa |
|---|---|---|---|
| A | `Ma_NV` | String (PK) | Khóa chính duy nhất (VD: NV01, NV02... NV57) |
| B | `Nhom_Ke_Hoach` | String (FK) | 7 nhóm kế hoạch theo Công văn 674/ĐHHV-KHCN&HTQT |
| C | `Tieu_de_Nhiem_vu` | String | Tên nhiệm vụ / trích yếu công việc theo văn bản |
| D | `Don_vi_Chu_tri` | String (FK) | Đơn vị chịu trách nhiệm chính (19 đơn vị/phòng ban/khoa) |
| E | `Don_vi_Phoi_hop` | Text | Danh sách các đơn vị cùng phối hợp |
| F | `San_pham_Dau_ra` | Text | Tiêu chuẩn nghiệm thu, văn bản, quyết định, CSDL hoàn thành |
| G | `Thoi_han_Van_Ban` | Text | Thời hạn ghi trong văn bản (VD: "Trước 15/9/2026") |
| H | `Thoi_han_Chuan` | Date (YYYY-MM-DD) | Thời hạn chuẩn hóa để tính toán trạng thái và đôn đốc |
| I | `Trang_thai` | Dropdown | `Chưa thực hiện`, `Đang thực hiện`, `Sắp đến hạn`, `Quá hạn`, `Chờ duyệt`, `Đã hoàn thành` |
| J | `Muc_do_Uu_tien` | Dropdown | `Cao`, `Trung bình`, `Thấp` |
| K | `Tien_do_%` | Number (0-100) | % hoàn thành tiến độ (0% đến 100%) |
| L | `Nguoi_phu_trach` | String | Họ tên & chức vụ cán bộ phụ trách |
| M | `Link_Minh_Chung` | URL | Link thư mục/tệp minh chứng trên Google Drive |
| N | `Ghi_chu_Noi_bo` | Text | Báo cáo nhanh, quy cách nghiệm thu theo phụ lục |
| O | `Y_kien_Chi_dao` | Text | Ý kiến chỉ đạo, đôn đốc của Ban Giám hiệu |
| P | `Ngay_Cap_nhat` | Timestamp | Thời điểm cập nhật dữ liệu |

---

### Bảng 2: `02_Nhom_Ke_Hoach` (Danh mục 7 Nhóm Kế hoạch NQ57)
| STT | Mã nhóm | Tên kế hoạch | Số văn bản | Số NV | Phạm vi nhiệm vụ & Nội dung chính thức |
|---|---|---|---|:---:|---|
| 1 | `KH197` | Kế hoạch số 197/KH-ĐHHV | 197/KH-ĐHHV | 11 | **NV01 - NV11**: Kế hoạch hành động 100 ngày xử lý các điểm nghẽn về chuyển đổi số |
| 2 | `KH200` | Kế hoạch số 200/KH-ĐHHV | 200/KH-ĐHHV | 21 | **NV12 - NV32**: Chiến dịch 90 ngày xây dựng, hoàn thiện Kho dữ liệu tỉnh Phú Thọ |
| 3 | `BDHVS` | Kế hoạch số 154 & 201/KH-ĐHHV | 154/KH-ĐHHV & 201/KH-ĐHHV | 10 | **NV33 - NV42**: Triển khai, tiếp tục đẩy mạnh Phong trào “Bình dân học vụ số” |
| 4 | `NQ113` | Kế hoạch số 172/KH-ĐHHV | 172/KH-ĐHHV | 2 | **NV43 - NV44**: Triển khai thực hiện Nghị quyết số 113-NQ/ĐU ngày 23/6/2026 của Đảng ủy |
| 5 | `KH188` | Kế hoạch số 188/KH-ĐHHV | 188/KH-ĐHHV | 5 | **NV45 - NV49**: Triển khai hoạt động KHCN, ĐMST, CĐS và HTQT năm học 2026-2027 |
| 6 | `QD1034`| QĐ số 1034/QĐ-ĐHHV | 1034/QĐ-ĐHHV | 4 | **NV50 - NV53**: Tổ chức hội thảo, tọa đàm khoa học năm học 2026 - 2027 |
| 7 | `UBND_TINH` | Nhiệm vụ UBND Tỉnh giao | VB 10697 & 11028/UBND-KGVX | 4 | **NV54 - NV57**: Nhiệm vụ trọng tâm UBND Tỉnh giao hoàn thành trong tháng 12/2026 |

---

### Bảng 3: `03_Danh_Muc_Don_Vi` (Cơ cấu tổ chức Nhà trường)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả mẫu |
|---|---|---|---|
| A | `Ma_Don_Vi` | String (PK) | BGH, VP, TOCDS, P_DAO_TAO, P_KHCN, P_QLSV, P_KT_DBCL, KHOA_KTCN... |
| B | `Ten_Don_Vi` | String | Ban Giám hiệu, Văn phòng, Tổ Chuyển đổi số... |
| C | `Phan_Loai` | Dropdown | `Lãnh đạo trường`, `Phòng ban chức năng`, `Khoa đào tạo`, `Trung tâm`, `Đoàn thể` |
| D | `Email_Lien_He` | Email | van_phong@hvu.edu.vn |
| E | `Truong_Don_Vi` | String | Họ tên Trưởng phòng/Trưởng khoa |
| F | `So_Dien_Thoai` | String | Số điện thoại liên hệ nội bộ |

---

### Bảng 4: `04_Tai_Khoan_Nguoi_Dung` (Phân quyền & Tài khoản cán bộ)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả mẫu |
|---|---|---|---|
| A | `Ma_Nguoi_Dung` | String (PK) | USR_BGH_01, USR_TOCDS_01, USR_VP_01... |
| B | `Ten_Dang_Nhap` | String | admin, thanhdk, sonlh, kiennt, gianghx... |
| C | `Ho_Ten` | String | Đỗ Khắc Thanh, Lê Hồng Sơn, Nguyễn Trung Kiên... |
| D | `Email_Cong_Vu` | Email | thanhdk@hvu.edu.vn, sonlh@hvu.edu.vn |
| E | `Ma_Don_Vi` | String (FK) | BGH, TOCDS, VP... |
| F | `Chuc_Vu` | String | Hiệu trưởng, Thư ký Tổ CĐS, Phó Trưởng phòng... |
| G | `Vai_Tro_He_Thong` | Dropdown | `Lanh_Dao` (Toàn quyền giám sát), `To_Chuyen_Trach` (Điều phối, đôn đốc), `Don_Vi` (Thực hiện) |
| H | `Trang_Thai` | Dropdown | `Hoạt động`, `Tạm khóa` |

---

### Bảng 5: `05_Minh_Chung_File` (Quản lý hồ sơ minh chứng Google Drive)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả mẫu |
|---|---|---|---|
| A | `Ma_Minh_Chung` | String (PK) | MC0001, MC0002... |
| B | `Ma_NV` | String (FK) | NV01, NV04, NV12... |
| C | `Ten_Tep_Tin` | String | NV01_VanPhong_QuyCheSuDungPhanMem.pdf |
| D | `Duong_Dan_Google_Drive` | URL | https://drive.google.com/file/d/... |
| E | `Dung_Luong_KB` | Number | 1024 KB |
| F | `Dinh_Dang` | String | PDF, DOCX, XLSX, ZIP, PNG |
| G | `Nguoi_Tai_Len` | String (FK) | Họ tên / Email người upload |
| H | `Ngay_Tai_Len` | Timestamp | 2026-09-05 14:30:00 |
| I | `Trang_Thai_Tham_Dinh` | Dropdown | `Chờ thẩm định`, `Đã nghiệm thu`, `Cần bổ sung hồ sơ` |
| J | `Nhan_Xet_Tham_Dinh` | Text | Minh chứng đầy đủ, đúng mẫu quy định |

---

### Bảng 6: `06_Nhat_Ky_Audit_Log` (Lịch sử thao tác & Biến động tiến độ)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả mẫu |
|---|---|---|---|
| A | `Ma_Log` | String (PK) | LOG00001... |
| B | `Ma_NV` | String (FK) | NV01... |
| C | `Nguoi_Thao_Tac` | String | Lê Hồng Sơn (sonlh@hvu.edu.vn) |
| D | `Hanh_Dong` | Dropdown | `Tạo mới`, `Cập nhật tiến độ`, `Đổi trạng thái`, `Nộp minh chứng`, `Lãnh đạo chỉ đạo` |
| E | `Gia_Tri_Cu` | Text | Đang thực hiện (40%) |
| F | `Gia_Tri_Moi` | Text | Đã hoàn thành (100%) |
| G | `Thoi_Diem` | Timestamp | 2026-09-07 10:15:00 |

---

### Bảng 7: `07_Chi_Dao_Va_Binh_Luan` (Ý kiến trao đổi & Chỉ đạo tác nghiệp)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả mẫu |
|---|---|---|---|
| A | `Ma_Binh_Luan` | String (PK) | CMT0001... |
| B | `Ma_NV` | String (FK) | NV02... |
| C | `Nguoi_Gui` | String | Đỗ Khắc Thanh (Lãnh đạo trường) |
| D | `Phan_Loai` | Dropdown | `Chỉ đạo của Lãnh đạo`, `Báo cáo của Đơn vị`, `Trao đổi nghiệp vụ` |
| E | `Noi_Dung` | Text | Yêu cầu Văn phòng khẩn trương hoàn thành báo cáo trước ngày 15/9. |
| F | `Thoi_Gian` | Timestamp | 2026-09-06 09:00:00 |

---

### Bảng 8: `08_Dashboard_KPI_Tong_Hop` (Bảng thống kê Executive Dashboard)
Bảng tính này sử dụng **100% công thức động** của Google Sheets để Lãnh đạo trường mở trực tiếp trên điện thoại/máy tính là thấy ngay tiến độ mà không cần vào phần mềm:
* **Chỉ số chung**:
  * Tổng nhiệm vụ: `=COUNTA('01_Nhiem_Vu_NQ57'!A2:A)`
  * Đã hoàn thành: `=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, "Đã hoàn thành")`
  * Đang thực hiện: `=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, "Đang thực hiện")`
  * Sắp đến hạn: `=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, "Sắp đến hạn")`
  * Quá hạn: `=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, "Quá hạn")`
  * Tỷ lệ hoàn thành toàn trường: `=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, "Đã hoàn thành") / COUNTA('01_Nhiem_Vu_NQ57'!A2:A)`
* **Thống kê tiến độ theo 6 nhóm Kế hoạch**: Hàm `=QUERY('01_Nhiem_Vu_NQ57'!A1:K, "SELECT B, count(A), avg(K) GROUP BY B LABEL count(A) 'Số nhiệm vụ', avg(K) 'Tiến độ trung bình'")`
* **Thống kê tiến độ theo từng Đơn vị**: Hàm `=QUERY('01_Nhiem_Vu_NQ57'!A1:K, "SELECT E, count(A), avg(K) GROUP BY E LABEL count(A) 'Tổng việc', avg(K) 'Tiến độ trung bình'")`
