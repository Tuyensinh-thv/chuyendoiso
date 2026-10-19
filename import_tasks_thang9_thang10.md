# Kế hoạch triển khai: Nạp và Phân nhóm Nhiệm vụ Tháng 9 & Tháng 10 vào CSDL

## 1. Mục tiêu
Nạp toàn bộ 132 nhiệm vụ từ Google Sheets vào hệ thống Chuyển đổi số Trường Đại học Hùng Vương (Supabase + Local):
- **Đại học Hùng Vương - Tháng 9**: 83 nhiệm vụ (Tab KẾT QUẢ THỰC HIỆN CÔNG TÁC THÁNG 9)
- **Đại học Hùng Vương - Tháng 10**: 49 nhiệm vụ (Tab KẾ HOẠCH THÁNG 10)

## 2. Quy tắc chuẩn hoá dữ liệu
| Trường dữ liệu | Quy ước xử lý |
| :--- | :--- |
| **`id`** | `T09_01` -> `T09_83` (Tháng 9) và `T10_01` -> `T10_49` (Tháng 10) |
| **`nhomKeHoach`** | `Đại học Hùng Vương - Tháng 9` / `Đại học Hùng Vương - Tháng 10` |
| **`category`** | 8 mảng công tác lớn (1) -> (8) |
| **`donViChuTri`** | Tự động ánh xạ về các phòng ban chuẩn của ĐHHV |
| **`trangThai`** | Tháng 9: `Đã hoàn thành` (có kết quả) / Tháng 10: `Đang thực hiện` / `Chưa thực hiện` |
| **`tiendo`** | Tháng 9: 100% / Tháng 10: 0% |
| **`ghiChuNoiBo`** | Tháng 9: Lưu nội dung cột "Kết quả thực hiện" / Tháng 10: Trống hoặc ghi chú ban đầu |
| **`thoiHan`** | Tháng 9: `2026-09-30` / Tháng 10: `2026-10-31` |

## 3. Các bước thực hiện
1. Đăng ký 2 nhóm kế hoạch vào bảng `plan_groups` trên Supabase:
   - `Đại học Hùng Vương - Tháng 9`
   - `Đại học Hùng Vương - Tháng 10`
2. Tạo script parser và nạp tự động `scripts/import_thang9_thang10.cjs` thực hiện Upsert vào Supabase (đảm bảo idempotency, không làm trùng lặp khi chạy lại).
3. Cập nhật đồng bộ vào `src/data/initialData.ts` để môi trường offline / local fallback cũng có sẵn dữ liệu.
4. Kiểm tra xác nhận trên giao diện local `http://localhost:5173/`.
