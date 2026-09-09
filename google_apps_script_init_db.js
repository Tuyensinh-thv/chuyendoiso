/**
 * GOOGLE APPS SCRIPT: KHỞI TẠO HỆ THỐNG CƠ SỞ DỮ LIỆU CỔNG ĐIỀU HÀNH NQ57
 * Trường Đại học Hùng Vương (HVU)
 * Spreadsheet ID: 1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc
 * Cập nhật chuẩn theo Công văn đôn đốc thực hiện nhiệm vụ NQ57 tháng 9-10/2026 (57 nhiệm vụ)
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Mở file Google Sheets trên trình duyệt.
 * 2. Chọn menu "Tiện ích mở rộng" (Extensions) > "Apps Script".
 * 3. Xóa hết code mặc định, dán toàn bộ đoạn mã này vào.
 * 4. Nhấn nút "Lưu" (Ctrl + S), sau đó chọn hàm "khoiTaoCoSoDuLieuNQ57" và nhấn "Chạy" (Run).
 * 5. Cấp quyền truy cập nếu Google yêu cầu. Toàn bộ 57 nhiệm vụ chính thức sẽ được tạo mới và đồng bộ 100%!
 */

function khoiTaoCoSoDuLieuNQ57() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Màu sắc nhận diện HVU
  const HVU_NAVY = "#0B2545";
  const HVU_RED = "#BE1E2D";
  const HEADER_TEXT = "#FFFFFF";

  // Danh sách các bảng cần khởi tạo
  const TABS = {
    NHIEM_VU: "01_Nhiem_Vu_NQ57",
    KE_HOACH: "02_Nhom_Ke_Hoach",
    DON_VI: "03_Danh_Muc_Don_Vi",
    TAI_KHOAN: "04_Tai_Khoan_Nguoi_Dung",
    MINH_CHUNG: "05_Minh_Chung_File",
    AUDIT_LOG: "06_Nhat_Ky_Audit_Log",
    CHI_DAO: "07_Chi_Dao_Va_Binh_Luan",
    DASHBOARD: "08_Dashboard_KPI_Tong_Hop",
    CHECKLIST: "09_Checklist_Sub_Tasks"
  };

  // 1. Tạo hoặc lấy các sheet
  const sheets = {};
  for (const key in TABS) {
    const title = TABS[key];
    let sheet = ss.getSheetByName(title);
    if (!sheet) {
      sheet = ss.insertSheet(title);
    }
    sheets[key] = sheet;
  }

  // 2. KHỞI TẠO BẢNG 02: NHÓM KẾ HOẠCH (7 NHÓM)
  const sheetKH = sheets.KE_HOACH;
  sheetKH.clear();
  const headersKH = ["Ma_Nhom_KH", "Ten_Ke_Hoach", "So_Quyet_Dinh", "Ngay_Ban_Hanh", "Co_Quan_Ban_Hanh", "So_Nhiem_Vu", "Ghi_Chu"];
  const dataKH = [
    ["KH197", "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)", "197/KH-ĐHHV", "2026-06-15", "Hiệu trưởng ĐHHV", 11, "Hành động 100 ngày xử lý các điểm nghẽn về chuyển đổi số"],
    ["KH200", "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)", "200/KH-ĐHHV", "2026-06-20", "Hiệu trưởng ĐHHV", 21, "Chiến dịch 90 ngày làm sạch, tạo lập và đưa vào sử dụng Kho dữ liệu số"],
    ["BDHVS", "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)", "154/KH-ĐHHV & 201/KH-ĐHHV", "2026-05-10", "Ban Giám hiệu / Đảng ủy", 10, "Phát động phong trào Bình dân học vụ số, kỹ năng số, VNeID"],
    ["NQ113", "Kế hoạch số 172/KH-ĐHHV (Triển khai NQ 113 Đảng ủy)", "172/KH-ĐHHV", "2026-08-05", "Đảng ủy ĐHHV", 2, "Thực hiện Nghị quyết số 113-NQ/ĐU về KHCN, ĐMST, CĐS & HTQT đến 2035"],
    ["KH188", "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)", "188/KH-ĐHHV", "2026-08-22", "Hiệu trưởng ĐHHV", 5, "Hoạt động KHCN, đổi mới sáng tạo, chuyển đổi số năm học 2026-2027"],
    ["QD1034", "QĐ số 1034/QĐ-ĐHHV (Hội thảo, tọa đàm khoa học)", "1034/QĐ-ĐHHV", "2026-08-14", "Hiệu trưởng ĐHHV", 4, "Tổ chức hội thảo, tọa đàm khoa học năm học 2026-2027"],
    ["UBND_TINH", "Nhiệm vụ UBND Tỉnh giao (Hoàn thành T12/2026)", "VB 10697 & 11028/UBND-KGVX", "2026-08-10", "UBND Tỉnh Phú Thọ", 4, "Nhiệm vụ trọng tâm UBND Tỉnh giao hoàn thành trong tháng 12/2026"]
  ];
  setupSheetHeader(sheetKH, headersKH, HVU_NAVY, HEADER_TEXT);
  sheetKH.getRange(2, 1, dataKH.length, headersKH.length).setValues(dataKH);
  // Định dạng cột F (So_Nhiem_Vu) là số nguyên thường, không để dính định dạng % cũ
  sheetKH.getRange(2, 6, dataKH.length, 1).setNumberFormat("0").setHorizontalAlignment("center");

  // 3. KHỞI TẠO BẢNG 03: DANH MỤC ĐƠN VỊ
  const sheetDV = sheets.DON_VI;
  sheetDV.clear();
  const headersDV = ["Ma_DV", "Ten_Don_Vi", "Loai_Don_Vi", "Lanh_Dao_Phu_Trach", "Email_Lien_He"];
  const dataDV = [
    ["DV01", "Ban Giám hiệu", "Lãnh đạo trường", "TS. Đỗ Khắc Thanh (Hiệu trưởng)", "thanhdk@hvu.edu.vn"],
    ["DV02", "Tổ Chuyển đổi số Trường ĐHHV", "Tổ chuyên trách", "TS. Đỗ Khắc Thanh (Tổ trưởng)", "chuyendoiso@hvu.edu.vn"],
    ["DV03", "Văn phòng", "Phòng chức năng", "ThS. Hoàng Thị Thu Hương (Chánh VP)", "vanphong@hvu.edu.vn"],
    ["DV04", "Phòng Đào tạo", "Phòng chức năng", "TS. Phạm Đức Thắng (Trưởng phòng)", "daotao@hvu.edu.vn"],
    ["DV05", "Phòng Kế hoạch - Tài chính", "Phòng chức năng", "ThS. Nguyễn Văn Hải (Trưởng phòng)", "khtc@hvu.edu.vn"],
    ["DV06", "Phòng KHCN & HTQT", "Phòng chức năng", "TS. Nguyễn Danh Hướng (Trưởng phòng)", "khcn_htqt@hvu.edu.vn"],
    ["DV07", "Phòng Quản lý sinh viên và học viên", "Phòng chức năng", "ThS. Tạ Duy Hưng (Trưởng phòng)", "qlsv_hv@hvu.edu.vn"],
    ["DV08", "Phòng Khảo thí và Đảm bảo chất lượng", "Phòng chức năng", "TS. Vũ Thị Lan Hương (Trưởng phòng)", "kt_dbcl@hvu.edu.vn"],
    ["DV09", "Trung tâm Học liệu và Truyền thông", "Đơn vị phục vụ", "ThS. Cao Xuân Chung (Giám đốc)", "hoclieu_tt@hvu.edu.vn"],
    ["DV10", "Trung tâm KN & ĐMST", "Đơn vị trực thuộc", "TS. Trần Thành Vinh (Giám đốc)", "khoinghiep@hvu.edu.vn"],
    ["DV11", "Khoa KTCN", "Khoa chuyên môn", "TS. Trần Đình Chiến (Trưởng Khoa)", "ktcn@hvu.edu.vn"],
    ["DV12", "Khoa Tiếng Trung Quốc", "Khoa chuyên môn", "ThS. Nguyễn Thị Huệ (Trưởng Khoa)", "tiengtrung@hvu.edu.vn"],
    ["DV13", "Khoa NT&TDTT", "Khoa chuyên môn", "TS. Nguyễn Hữu Dũng (Trưởng Khoa)", "nt_tdtt@hvu.edu.vn"],
    ["DV14", "Đoàn Thanh niên", "Đoàn thể", "Đ/c Bí thư Đoàn Trường", "doanthanhnien@hvu.edu.vn"],
    ["DV15", "Hội đồng Thi đua Khen thưởng", "Hội đồng", "Hội đồng TĐKT Nhà trường", "thiduakhenthuong@hvu.edu.vn"],
    ["DV16", "Trạm Y tế", "Đơn vị phục vụ", "Trưởng Trạm Y tế", "tramyte@hvu.edu.vn"],
    ["DV17", "Các chi bộ", "Đảng đoàn", "Bí thư các Chi bộ", "danguy@hvu.edu.vn"],
    ["DV18", "Ban biên tập tạp chí", "Ban chuyên môn", "Tổng biên tập Tạp chí KH&CN", "tapchikhcn@hvu.edu.vn"],
    ["DV19", "Các đơn vị thuộc và trực thuộc", "Toàn trường", "Thủ trưởng các đơn vị", "hvu@hvu.edu.vn"]
  ];
  setupSheetHeader(sheetDV, headersDV, HVU_NAVY, HEADER_TEXT);
  sheetDV.getRange(2, 1, dataDV.length, headersDV.length).setValues(dataDV);

  // 4. KHỞI TẠO BẢNG 04: TÀI KHOẢN NGƯỜI DÙNG
  const sheetTK = sheets.TAI_KHOAN;
  sheetTK.clear();
  const headersTK = ["Email", "Ho_Ten", "Don_Vi", "Vai_Tro", "Avatar", "Password_Hash", "Trang_Thai"];
  const dataTK = [
    [
        "kiennt@hvu.edu.vn",
        "Nguyễn Trung Kiên",
        "Phòng Đào tạo / Tổ Tuyển sinh",
        "Admin",
        "👨‍💼",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "thanhdk@hvu.edu.vn",
        "Đỗ Khắc Thanh",
        "Ban Giám hiệu",
        "Lanh_Dao",
        "👨‍🏫",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "hoangcongkien@hvu.edu.vn",
        "Hoàng Công Kiên",
        "Ban Giám hiệu",
        "Lanh_Dao",
        "👨‍🏫",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "dotung@hvu.edu.vn",
        "Đỗ Tùng",
        "Ban Giám hiệu",
        "Lanh_Dao",
        "👨‍🏫",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "trandinhchien@hvu.edu.vn",
        "Trần Đình Chiến",
        "Ban Giám hiệu",
        "Lanh_Dao",
        "👨‍🏫",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "thanhdp83@hvu.edu.vn",
        "Đặng Thị Phương Thanh",
        "Phòng Đào tạo",
        "Don_Vi",
        "🎓",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "lehongson@hvu.edu.vn",
        "Lê Hồng Sơn",
        "Văn phòng",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "loanln@hvu.edu.vn",
        "Phạm Thanh Loan",
        "Phòng QLKH - QHQT",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "dotathung@hvu.edu.vn",
        "Đỗ Tất Hưng",
        "Phòng Đào tạo",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "Phunglinh@hvu.edu.vn",
        "Phùng Duy Linh",
        "Phòng Khảo thí & ĐBCL",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "hoangxuangiang@hvu.edu.vn",
        "Hoàng Xuân Giang",
        "Văn phòng",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "nguyenquanghung77dhhv@gmail.com",
        "Nguyễn Quang Hưng",
        "Phòng QLSV-HV",
        "Don_Vi",
        "🎓",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "lequanghung@hvu.edu.vn",
        "Lê Quang Hưng",
        "Phòng Kế hoạch tài chính",
        "Don_Vi",
        "🎓",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ],
    [
        "trieuquyhung@hvu.edu.vn",
        "Triệu Quý Hùng",
        "Văn phòng",
        "To_Chuyen_Trach",
        "👩‍💻",
        "755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51",
        "Hoạt động"
    ]
];
  setupSheetHeader(sheetTK, headersTK, HVU_NAVY, HEADER_TEXT);
  sheetTK.getRange(2, 1, dataTK.length, headersTK.length).setValues(dataTK);

  // 5. KHỞI TẠO BẢNG 05: MINH CHỨNG FILE
  const sheetMC = sheets.MINH_CHUNG;
  sheetMC.clear();
  const headersMC = ["Ma_Minh_Chung", "Ma_NV", "Ten_File", "Dung_Luong_Bytes", "Dinh_Dang", "Link_Drive", "Nguoi_Tai_Len", "Ngay_Tai_Len"];
  setupSheetHeader(sheetMC, headersMC, HVU_NAVY, HEADER_TEXT);

  // 6. KHỞI TẠO BẢNG 06: AUDIT LOG (NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG)
  const sheetLog = sheets.AUDIT_LOG;
  sheetLog.clear();
  const headersLog = ["Ma_Log", "Thoi_Gian", "Nguoi_Thao_Tac", "Vai_Tro", "Hanh_Dong", "Ma_NV", "Tieu_De_NV", "Chi_Tiet"];
  const sampleLog = [
    ["LOG001", "2026-09-08 08:00:00", "Nguyễn Trung Kiên (Admin)", "Admin", "SYNC", "NV01", "Rà soát các văn bản quy phạm, quy chế...", "Khởi tạo cơ sở dữ liệu 57 nhiệm vụ chuẩn hóa"]
  ];
  setupSheetHeader(sheetLog, headersLog, HVU_NAVY, HEADER_TEXT);
  sheetLog.getRange(2, 1, sampleLog.length, headersLog.length).setValues(sampleLog);

  // 7. KHỞI TẠO BẢNG 07: CHỈ ĐẠO & BÌNH LUẬN
  const sheetCD = sheets.CHI_DAO;
  sheetCD.clear();
  const headersCD = ["Ma_Binh_Luan", "Ma_NV", "Nguoi_Gui", "Phan_Loai", "Noi_Dung", "Thoi_Gian_Gui"];
  setupSheetHeader(sheetCD, headersCD, HVU_NAVY, HEADER_TEXT);

  // 7.1 KHỞI TẠO BẢNG 09: CHECKLIST CÔNG VIỆC CON (SUB-TASKS)
  const sheetCL = sheets.CHECKLIST;
  sheetCL.clear();
  const headersCL = ["Ma_Checklist", "Ma_NV", "Tieu_De", "Hoan_Thanh", "Nguoi_Tao", "Ngay_Tao"];
  setupSheetHeader(sheetCL, headersCL, HVU_NAVY, HEADER_TEXT);
  const sampleCL = [
    ["CL_NV01_1", "NV01", "Lập danh mục văn bản pháp quy cần rà soát theo kế hoạch 197", "true", "Triệu Quý Hùng", "2026-09-08"],
    ["CL_NV01_2", "NV01", "Dự thảo báo cáo đề xuất sửa đổi bổ sung", "false", "Triệu Quý Hùng", "2026-09-08"],
    ["CL_NV02_1", "NV02", "Kiểm kê danh mục toàn bộ hệ thống thông tin máy chủ, phần mềm HVU", "true", "Lê Hồng Sơn", "2026-09-08"],
    ["CL_NV02_2", "NV02", "Phân loại cấp độ an toàn thông tin theo Nghị định 85/2016/NĐ-CP", "false", "Lê Hồng Sơn", "2026-09-08"]
  ];
  sheetCL.getRange(2, 1, sampleCL.length, headersCL.length).setValues(sampleCL);

  // 8. CẬP NHẬT BẢNG 01: 57 NHIỆM VỤ NQ57 CHUẨN TỪ VĂN BẢN
  const sheetNV = sheets.NHIEM_VU;
  sheetNV.clear();
  const headersNV = [
    "Ma_NV", "Nhom_Ke_Hoach", "Tieu_de_Nhiem_vu", "Don_vi_Chu_tri", 
    "Don_vi_Phoi_hop", "San_pham_Dau_ra", "Thoi_han_Van_Ban", "Thoi_han_Chuan", 
    "Trang_thai", "Muc_do_Uu_tien", "Tien_do_%", "Nguoi_phu_trach", 
    "Link_Minh_Chung", "Ghi_chu_Noi_bo", "Y_kien_Chi_dao", "Ngay_Cap_nhat",
    "Trang_Thai_Duyet"
  ];
  setupSheetHeader(sheetNV, headersNV, HVU_NAVY, HEADER_TEXT);

  const dataNV = [
  [
    "NV01",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Rà soát các văn bản quy phạm, quy chế, quy định còn bất cập, cản trở chuyển đổi số",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Văn bản cập nhật, điều chỉnh ban hành",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "TS. Triệu Quý Hùng (Phó tổ trưởng)",
    "",
    "Sản phẩm: Văn bản cập nhật, điều chỉnh ban hành",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV02",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Rà soát, phân loại toàn bộ hệ thống thông tin của Nhà trường theo cấp độ an toàn",
    "Tổ Chuyển đổi số Trường ĐHHV",
    "Văn phòng, Các đơn vị thuộc và trực thuộc",
    "100% hệ thống được rà soát; báo cáo kết quả",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Lê Hồng Sơn",
    "",
    "Sản phẩm: 100% hệ thống được rà soát; báo cáo kết quả",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV03",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Rà soát cán bộ, viên chức, người lao động và sinh viên đã đăng ký, kích hoạt tài khoản định danh điện tử VNeID mức độ 2",
    "Văn phòng, Phòng Quản lý SV&HV",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo kết quả",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "TS. Triệu Quý Hùng (Phó tổ trưởng)",
    "",
    "Sản phẩm: Báo cáo kết quả",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV04",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Triển khai đầy đủ, kịp thời chính sách hỗ trợ đối với người làm công tác chuyên trách chuyển đổi số, an ninh mạng theo Nghị định số 179/2025/NĐ-CP ngày 01/7/2025 của Chính phủ",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "100% cán bộ, viên chức của cơ quan đủ điều kiện rà soát, lập danh sách, phê duyệt và thực hiện chế độ hỗ trợ theo quy định, các vướng mắc về hướng dẫn, thủ tục được xử lý",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "TS. Triệu Quý Hùng (Phó tổ trưởng)",
    "",
    "Sản phẩm: 100% cán bộ, viên chức của cơ quan đủ điều kiện rà soát, lập danh sách, phê duyệt và thực hiện chế độ hỗ trợ theo quy định, các vướng mắc về hướng dẫn, thủ tục được xử lý",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV05",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Rà soát, bảo đảm kinh phí thực hiện nhiệm vụ chuyển đổi số",
    "Phòng Kế hoạch - Tài chính",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo phân bổ kinh phí",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Báo cáo phân bổ kinh phí",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV06",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Ngay từ năm học 2026 - 2027, rà soát, cập nhật các chương trình đào tạo, ưu tiên các lĩnh vực công nghệ chiến lược; đẩy mạnh đào tạo kỹ năng số, năng lực đổi mới sáng tạo và ứng dụng trí tuệ nhân tạo",
    "Phòng Đào tạo",
    "Các đơn vị thuộc và trực thuộc",
    "Các chương trình đào tạo được ban hành, cập nhật theo thẩm quyền",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "Sản phẩm: Các chương trình đào tạo được ban hành, cập nhật theo thẩm quyền",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV07",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Tổ chức diễn tập bảo đảm an toàn thông tin, ứng cứu sự cố mạng",
    "Tổ Chuyển đổi số Trường ĐHHV",
    "Văn phòng, Các đơn vị có liên quan",
    "Kế hoạch, báo cáo diễn tập",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Lê Hồng Sơn",
    "",
    "Sản phẩm: Kế hoạch, báo cáo diễn tập",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV08",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Hoàn thiện chuẩn dữ liệu học bạ điện tử, văn bằng, chứng chỉ số, mã định danh người học và hồ sơ học tập suốt đời; tích hợp xác thực VNeID",
    "Phòng Quản lý sinh viên và học viên",
    "Phòng Đào tạo, Các đơn vị có liên quan",
    "Chuẩn dữ liệu và quy trình xác thực ban hành; văn bằng, chứng chỉ thí điểm được xác thực trên VNeID",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "Sản phẩm: Chuẩn dữ liệu và quy trình xác thực ban hành; văn bằng, chứng chỉ thí điểm được xác thực trên VNeID",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV09",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Tổ chức đào tạo về dữ liệu, an ninh mạng, trí tuệ nhân tạo cho cán bộ tham mưu, cán bộ chuyên trách, cán bộ vận hành hệ thống và cán bộ trực tiếp giải quyết thủ tục hành chính",
    "Tổ Chuyển đổi số Trường ĐHHV",
    "Văn phòng, Các đơn vị có liên quan",
    "Tối thiểu 95% đối tượng thuộc danh sách phải đào tạo hoàn thành chương trình và đạt yêu cầu kiểm tra đầu ra. Triển khai trên nền tảng Bình dân học vụ số",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Lê Hồng Sơn",
    "",
    "Sản phẩm: Tối thiểu 95% đối tượng thuộc danh sách phải đào tạo hoàn thành chương trình và đạt yêu cầu kiểm tra đầu ra. Triển khai trên nền tảng Bình dân học vụ số",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV10",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Rà soát, cắt giảm thời gian giải quyết thủ tục hành chính gắn với chuyển đổi số",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo kết quả",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Báo cáo kết quả",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV11",
    "Kế hoạch số 197/KH-ĐHHV (100 ngày xử lý điểm nghẽn CĐS)",
    "Kiểm tra, giám sát việc thực hiện Kế hoạch hành động 100 ngày",
    "Văn phòng, Phòng KHCN & HTQT",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo kiểm tra",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Báo cáo kiểm tra",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV12",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Thành lập các tổ công tác, tổ giúp việc xây dựng, quản lý, vận hành Kho dữ liệu của Nhà trường",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Quyết định thành lập các tổ công tác, tổ giúp việc",
    "2026-09-07",
    "2026-09-07",
    "Chưa thực hiện",
    "Cao",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Quyết định thành lập các tổ công tác, tổ giúp việc",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV13",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Trên cơ sở hướng dẫn của Công an tỉnh, Sở Khoa học và Công nghệ, Nhà trường tổ chức rà soát, đánh giá, thống kê, hoàn thành Danh mục cơ sở dữ liệu của Nhà trường gửi về Công an tỉnh tổng hợp.",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Danh mục cơ sở dữ liệu của Nhà trường",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Danh mục cơ sở dữ liệu của Nhà trường",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV14",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Ban hành Danh mục cơ sở dữ liệu của Nhà trường",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Danh mục cơ sở dữ liệu của Nhà trường",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Danh mục cơ sở dữ liệu của Nhà trường",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV15",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Thu thập, tạo lập nguồn dữ liệu và hoàn thiện Kho dữ liệu của Nhà trường",
    "Văn phòng, Tổ Chuyển đổi số Trường ĐHHV",
    "Các đơn vị thuộc và trực thuộc",
    "Cơ sở dữ liệu được thu thâp đầy đủ",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "Sản phẩm: Cơ sở dữ liệu được thu thâp đầy đủ",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV16",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Triển khai xây dựng, cập nhật, bổ sung nguồn dữ liệu để duy trì Kho dữ liệu tỉnh bảo đảm đúng, đủ, sạch, sống. Bảo đảm an toàn thông tin dữ liệu",
    "Văn phòng, Tổ Chuyển đổi số Trường ĐHHV",
    "Các đơn vị thuộc và trực thuộc",
    "Hệ thống dữ liệu được xây dựng, cập nhật, đảm bảo an toàn bảo mật thông tin dữ liệu",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Hệ thống dữ liệu được xây dựng, cập nhật, đảm bảo an toàn bảo mật thông tin dữ liệu",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV17",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu nhiệm vụ khoa học và công nghệ",
    "Phòng KHCN & HTQT",
    "Các đơn vị thuộc và trực thuộc",
    "Thông tin nhận diện và phân loại các nhiệm vụ khoa học và công nghệ",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "Sản phẩm: Thông tin nhận diện và phân loại các nhiệm vụ khoa học và công nghệ",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV18",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu chuyên gia khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số",
    "Phòng KHCN & HTQT",
    "Các đơn vị thuộc và trực thuộc",
    "Thông tin nhận diện và phân loại các chuyên gia khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "Sản phẩm: Thông tin nhận diện và phân loại các chuyên gia khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV19",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu tài sản trí tuệ",
    "Phòng KHCN & HTQT",
    "Các đơn vị thuộc và trực thuộc",
    "Thông tin nhận diện và phân loại các đối tượng sở hữu trí tuệ",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "Sản phẩm: Thông tin nhận diện và phân loại các đối tượng sở hữu trí tuệ",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV20",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu nhân lực công nghệ số",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Thông tin nhận diện và phân loại nguồn nhân lực hoạt động trong lĩnh vực công nghệ số, chuyển đổi số, an toàn thông tin và các lĩnh vực liên quan",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Thông tin nhận diện và phân loại nguồn nhân lực hoạt động trong lĩnh vực công nghệ số, chuyển đổi số, an toàn thông tin và các lĩnh vực liên quan",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV21",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu Kết luận Thanh tra",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Các kết luận thanh tra kinh tế - xã hội, kiến nghị và kết quả thực hiện kết luận",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Các kết luận thanh tra kinh tế - xã hội, kiến nghị và kết quả thực hiện kết luận",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV22",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu cơ sở vật chất, thiết bị dạy học",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV23",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu kiểm định chất lượng giáo dục",
    "Phòng Khảo thí và Đảm bảo chất lượng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Phùng Duy Linh",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV24",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu tổ chức bộ máy",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Thông tin về tổ chức, bộ máy",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Thông tin về tổ chức, bộ máy",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV25",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu thi đua - khen thưởng",
    "Hội đồng Thi đua Khen thưởng",
    "Các đơn vị thuộc và trực thuộc",
    "Hồ sơ khen thưởng cấp tỉnh, cấp Nhà nước (gồm QĐ khen thưởng cấp tỉnh, QĐ khen thưởng cấp Nhà nước)",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Hoàng Xuân Giang",
    "",
    "Sản phẩm: Hồ sơ khen thưởng cấp tỉnh, cấp Nhà nước (gồm QĐ khen thưởng cấp tỉnh, QĐ khen thưởng cấp Nhà nước)",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV26",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu tài liệu lưu trữ lịch sử Nhà trường",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV27",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu thanh niên và công tác thanh niên",
    "Tổ Chuyển đổi số Trường ĐHHV",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Đỗ Tất Hưng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV28",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu Hồ sơ cán bộ, viên chức",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV29",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu Bảo hiểm xã hội",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV30",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu Bảo hiểm y tế",
    "Trạm Y tế",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trưởng Trạm Y tế",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV31",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu người học",
    "Phòng Quản lý sinh viên và học viên",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV32",
    "Kế hoạch số 200/KH-ĐHHV (90 ngày Kho dữ liệu tỉnh Phú Thọ)",
    "Dữ liệu Văn bằng chứng chỉ",
    "Phòng Quản lý sinh viên và học viên",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-20",
    "2026-10-20",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV33",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Thực hiện tuyên truyền sâu rộng trên trang thông tin điện tử và fanpage của Nhà trường và các đơn vị về chuyển đổi số và phong trào “Bình dân học vụ số”. Tập trung tuyên truyền cho mọi cán bộ, viên chức, người học truy cập khai thác nền tảng “Bình dân học vụ số” tại địa chỉ: http://binhdanhocvuso.gov.vn/.",
    "Trung tâm Học liệu và Truyền thông",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-10",
    "2026-10-10",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV34",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Triển khai tập huấn, ứng dụng trợ lý ảo hỗ trợ học tập tri thức cơ bản về chuyển đổi số, phát triển kỹ năng số dựa trên công nghệ xử lý ngôn ngữ tự nhiên. Ứng dụng trí tuệ nhân tạo nhằm cá nhân hóa nội dung giảng dạy, học tập, bảo đảm trải nghiệm phù hợp với trình độ và nhu cầu của từng người dùng; triển khai ứng dụng nền tảng Cổng đào tạo AI cho cộng đồng miễn phí tại địa chỉ https://aicongdong.ptit.edu.vn do Bộ KH&CN hướng dẫn",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV35",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Chi bộ trực thuộc tổ chức sinh hoạt chuyên đề “Đảng viên tiên phong học tập kỹ năng số”",
    "Các chi bộ",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV36",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Triển khai khung kỹ năng số và đánh giá, xác nhận đạt trình độ phổ cập kỹ năng số cho các nhóm đối tượng: cán bộ, viên chức, người học",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV37",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Tổ chức nghiên cứu, quán triệt, triển khai hiệu quả mục đích, yêu cầu, nhiệm vụ, giải pháp nêu tại Kế hoạch số 94- KH/BTGDVTW của Ban Tuyên giáo và Dân vận Trung ương và Kế hoạch của Ban Thường vụ Tỉnh ủy. Định kỳ cập nhật dữ liệu và báo cáo kết quả triển khai Phong trào trên hệ thống theo dõi theo quy định",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Văn bản, hội nghị, báo cáo kết quả định kỳ",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Văn bản, hội nghị, báo cáo kết quả định kỳ",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV38",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Tổ chức triển khai học tập, đánh giá, xác nhận phổ cập kỹ năng số dựa trên hệ thống bài giảng, công cụ đánh giá kiến thức, kỹ năng số đã được đưa lên nền tảng “Bình dân học vụ số”",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Nhà trường có trách nhiệm theo dõi tiến độ học tập của từng nhóm đối tượng, cập nhật kết quả học tập trên các nền tảng và sử dụng dữ liệu làm kết quả triển khai phong trào",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Nhà trường có trách nhiệm theo dõi tiến độ học tập của từng nhóm đối tượng, cập nhật kết quả học tập trên các nền tảng và sử dụng dữ liệu làm kết quả triển khai phong trào",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV39",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Tổ chức triển khai Phong trào Bình dân học vụ số; định kỳ cập nhật dữ liệu, minh chứng và kết quả thực hiện trên hệ thống theo dõi",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Kết quả thực hiện phong trào được đánh giá trên cơ sở dữ liệu và minh chứng cụ thể",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Kết quả thực hiện phong trào được đánh giá trên cơ sở dữ liệu và minh chứng cụ thể",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV40",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Tổ chức kiểm tra, giám sát việc triển khai Phong trào trong phạm vi quản lý; định kỳ rà soát tiến độ thực hiện các nhiệm vụ, giải pháp và kết quả phổ cập kỹ năng số của các nhóm đối tượng (giảng viên, người học)",
    "Văn phòng, Phòng Quản lý SV&HV",
    "Các đơn vị thuộc và trực thuộc",
    "Việc kiểm tra không dừng lại ở việc xác nhận số lớp tập huấn hoặc số hoạt động của Nhà trường, cần tập trung vào kết quả thực tế như mức độ tham gia học tập trên nền tảng “Bình dân học vụ số”, số người được ghi nhận trên VNeID, khả năng sử dụng dịch vụ số của cán bộ, giảng viên và người học",
    "2026-12-31",
    "2026-12-31",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: Việc kiểm tra không dừng lại ở việc xác nhận số lớp tập huấn hoặc số hoạt động của Nhà trường, cần tập trung vào kết quả thực tế như mức độ tham gia học tập trên nền tảng “Bình dân học vụ số”, số người được ghi nhận trên VNeID, khả năng sử dụng dịch vụ số của cán bộ, giảng viên và người học",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV41",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Tổ chức “Ngày hội toàn dân học tập số” vào ngày 10/10/2026 (Ngày Chuyển đổi số quốc gia), kết hợp hoạt động trực tiếp và trực tuyến tại cơ sở",
    "Trung tâm Học liệu và Truyền thông",
    "Các đơn vị thuộc và trực thuộc",
    "Ngày hội, lớp học số, hoạt   động trải nghiệm và hướng dẫn sử dụng nền tảng, dịch vụ số cho cộng đồng",
    "2026-10-10",
    "2026-10-10",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Nguyễn Trung Kiên",
    "",
    "Sản phẩm: Ngày hội, lớp học số, hoạt   động trải nghiệm và hướng dẫn sử dụng nền tảng, dịch vụ số cho cộng đồng",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV42",
    "Kế hoạch số 154 & 201/KH-ĐHHV (Bình dân học vụ số)",
    "Rà soát, tập trung hoàn thành các chỉ tiêu năm 2026 theo Kế hoạch số 16-KH/TU; ưu tiên nâng tỷ lệ cán bộ, giảng viên, người học được phổ cập kỹ năng số và tăng tỷ lệ kết quả học tập được đánh giá, xác nhận trên nền tảng, VNeID",
    "Văn phòng, Phòng Quản lý sinh viên và học viên",
    "Các đơn vị thuộc và trực thuộc",
    "- 100% cán bộ, viên chức trong Nhà trường có hiểu biết về chuyển đổi số, kiến thức và kỹ năng số, sử dụng tốt các nền tảng, dịch vụ số phục vụ công việc   - 100% người học được trang bị kiến thức, kỹ năng số để phục vụ học tập, nghiên cứu và sáng tạo, nhận biết được nguy cơ, có kỹ năng bảo đảm an toàn trong môi trường số",
    "2026-11-30",
    "2026-11-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Triệu Quý Hùng",
    "",
    "Sản phẩm: - 100% cán bộ, viên chức trong Nhà trường có hiểu biết về chuyển đổi số, kiến thức và kỹ năng số, sử dụng tốt các nền tảng, dịch vụ số phục vụ công việc   - 100% người học được trang bị kiến thức, kỹ năng số để phục vụ học tập, nghiên cứu và sáng tạo, nhận biết được nguy cơ, có kỹ năng bảo đảm an toàn trong môi trường số",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV43",
    "Kế hoạch số 172/KH-ĐHHV (Triển khai NQ 113 Đảng ủy)",
    "Tổ chức quán triệt Nghị quyết số 113 NQ/ĐU ngày 23/6/2026 tới toàn thể cán bộ, giảng viên trong toàn trường",
    "Các đơn vị thuộc và trực thuộc",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo thực hiện",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Báo cáo thực hiện",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV44",
    "Kế hoạch số 172/KH-ĐHHV (Triển khai NQ 113 Đảng ủy)",
    "Xây dựng Kế hoạch hoạt động KHCN, ĐMST, CĐS, HTQT giai đoạn 2026-2030 của đơn vị",
    "Các đơn vị thuộc và trực thuộc",
    "Các đơn vị thuộc và trực thuộc",
    "Kế hoạch ban hành",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Kế hoạch ban hành",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV45",
    "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)",
    "Xây dựng kế hoạch thực hiện KH số 188/KH-ĐHHV của đơn vị",
    "Các đơn vị thuộc và trực thuộc",
    "Các đơn vị thuộc và trực thuộc",
    "Kế hoạch ban hành",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Kế hoạch ban hành",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV46",
    "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)",
    "Nghiên cứu, đề xuất giải quyết các bài toán lớn về khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số trên địa bàn tỉnh Phú Thọ; các bài toán thực tiễn của địa phương",
    "Các đơn vị thuộc và trực thuộc",
    "Các đơn vị thuộc và trực thuộc",
    "Danh mục đề xuất nhiệm vụ; hồ sơ đề xuất",
    "2026-09-15",
    "2026-09-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Danh mục đề xuất nhiệm vụ; hồ sơ đề xuất",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV47",
    "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)",
    "Xây dựng Đề án phát triển Tạp chí điện tử Trường Đại học Hùng Vương",
    "Ban biên tập tạp chí",
    "Phòng KHCN&HTQT",
    "Đề án được phê duyệt",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "Sản phẩm: Đề án được phê duyệt",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV48",
    "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)",
    "Tập huấn sinh viên tham gia cuộc thi \"Ý tưởng khởi nghiệp sinh viên\" HUNG VUONG STARTUP IDEA 2026 (theo KH số 191/KH-ĐHHV ngày 24/8/2026)",
    "Trung tâm KN & ĐMST, Phòng KHCN & HTQT",
    "Các khoa",
    "Danh sách, báo cáo số lượng sinh viên được tập huấn",
    "2026-09-11",
    "2026-09-11",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "Sản phẩm: Danh sách, báo cáo số lượng sinh viên được tập huấn",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV49",
    "Kế hoạch số 188/KH-ĐHHV (KHCN, ĐMST & CĐS 2026-2027)",
    "Tổ chức cuộc thi “Ý tưởng khởi nghiệp sinh viên” HUNG VUONG STARTUP IDEA 2026 (theo KH số 159/KH-ĐHHV ngày 21/7/2026)",
    "Trung tâm KN & ĐMST, Phòng KHCN & HTQT",
    "Các khoa",
    "Danh sách nhóm ý tưởng/dự án xét chọn",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "Sản phẩm: Danh sách nhóm ý tưởng/dự án xét chọn",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV50",
    "QĐ số 1034/QĐ-ĐHHV (Hội thảo, tọa đàm khoa học)",
    "Hội thảo: Phát triển chương trình đào tạo Sư phạm Tin học đáp ứng yêu cầu chuyển đổi số trong giáo dục",
    "Khoa KTCN",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV51",
    "QĐ số 1034/QĐ-ĐHHV (Hội thảo, tọa đàm khoa học)",
    "Tọa đàm: Phương pháp giảng dạy kỹ năng thực hành tiếng Trung Quốc",
    "Khoa Tiếng Trung Quốc",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-09-30",
    "2026-09-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "PGS. Phạm Thanh Loan (Tổ trưởng)",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV52",
    "QĐ số 1034/QĐ-ĐHHV (Hội thảo, tọa đàm khoa học)",
    "Hội thảo: Phát triển chương trình đào tạo các ngành năng khiếu trong bối cảnh chuyển đổi số",
    "Khoa NT&TDTT",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV53",
    "QĐ số 1034/QĐ-ĐHHV (Hội thảo, tọa đàm khoa học)",
    "Hội thảo: Nâng cao năng lực công bố bài báo khoa học trên tạp chí quốc tế thuộc danh mục Web of Science/Scopus",
    "Phòng KHCN & HTQT, Các Khoa",
    "Các đơn vị thuộc và trực thuộc",
    "Báo cáo / Kết quả thực hiện",
    "2026-10-30",
    "2026-10-30",
    "Chưa thực hiện",
    "Trung bình",
    0,
    "Trần Anh Tuấn",
    "",
    "",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV54",
    "Nhiệm vụ UBND Tỉnh giao (Hoàn thành T12/2026)",
    "Rà soát quy định để đánh giá năng lực nghiên cứu sinh và giảng viên dựa trên số lượng bằng sáng chế được doanh nghiệp thương mại hóa thực tế; chia sẻ các phòng thí nghiệm để tạo điều kiện cho các sinh viên, doanh nghiệp công nghệ nhỏ và vừa sử dụng chung",
    "Văn phòng",
    "Phòng Đào tạo, Phòng Quản lý sinh viên và Học viên, Phòng KHCN & HTQT, các khoa chuyên môn",
    "Báo cáo thực hiện, Quy định ban hành",
    "2026-12-15",
    "2026-12-15",
    "Chưa thực hiện",
    "Cao",
    0,
    "Triệu Quý Hùng",
    "",
    "UBND Tỉnh giao (VB 10697, 11028). Sản phẩm: Báo cáo thực hiện, Quy định ban hành",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV55",
    "Nhiệm vụ UBND Tỉnh giao (Hoàn thành T12/2026)",
    "Phát triển Trường Đại học Hùng Vương, trở thành hạt nhân, nòng cốt và trung tâm đào tạo nguồn nhân lực chất lượng cao đối với một số lĩnh vực của tỉnh, đẩy mạnh hoạt động nghiên cứu khoa học, phát triển công nghệ và đổi mới sáng tạo, đáp ứng yêu cầu nhân lực, nghiên cứu và chuyển giao tri thức phục vụ phát triển khoa học công nghệ và đổi mới sáng tạo của tỉnh, của vùng và khu vực giai đoạn 2026-2030, định hướng đến 2045",
    "Văn phòng",
    "Các đơn vị thuộc và trực thuộc",
    "Đề án/ Chương trình/ Kế hoạch được phê duyệt",
    "2026-12-30",
    "2026-12-30",
    "Chưa thực hiện",
    "Cao",
    0,
    "Triệu Quý Hùng",
    "",
    "UBND Tỉnh giao (VB 10697, 11028). Sản phẩm: Đề án/ Chương trình/ Kế hoạch được phê duyệt",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV56",
    "Nhiệm vụ UBND Tỉnh giao (Hoàn thành T12/2026)",
    "Thực hiện đồng bộ các giải pháp tăng cường giáo dục và hướng nghiệp STEM, thu hút học sinh giỏi theo học các ngành STEM; xây dựng và triển khai các chính sách, các cuộc thi nhằm phát hiện và bồi dưỡng tài năng STEM từ sớm, quy hoạch và đầu tư nâng cấp mở rộng hệ thống trường chuyên, trường năng khiếu về khoa học tự nhiên",
    "Phòng Đào tạo",
    "Các đơn vị thuộc và trực thuộc",
    "Đề án/ Chương trình/ Kế hoạch/ Văn bản triển khai",
    "2026-12-30",
    "2026-12-30",
    "Chưa thực hiện",
    "Cao",
    0,
    "Nguyễn Trung Kiên",
    "",
    "UBND Tỉnh giao (VB 10697, 11028). Sản phẩm: Đề án/ Chương trình/ Kế hoạch/ Văn bản triển khai",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ],
  [
    "NV57",
    "Nhiệm vụ UBND Tỉnh giao (Hoàn thành T12/2026)",
    "Nghiên cứu, đề xuất cơ chế xác định nhu cầu, đặt hàng, giao nhiệm vụ đào tạo nhân lực chất lượng cao trong các lĩnh vực khoa học cơ bản, kỹ thuật then chốt và công nghệ chiến lược đáp ứng nhu cầu nhân lực thuộc phạm vi quản lý theo ngành, lĩnh vực, địa phương",
    "Phòng Đào tạo",
    "Các đơn vị thuộc và trực thuộc",
    "Đề án/ Chương trình/ Kế hoạch được phê duyệt",
    "2026-12-30",
    "2026-12-30",
    "Chưa thực hiện",
    "Cao",
    0,
    "Nguyễn Trung Kiên",
    "",
    "UBND Tỉnh giao (VB 10697, 11028). Sản phẩm: Đề án/ Chương trình/ Kế hoạch được phê duyệt",
    "",
    "2026-09-08 8:00:00",
    "Chua_Nop"
  ]
];

  sheetNV.getRange(2, 1, dataNV.length, headersNV.length).setValues(dataNV);

  // 9. THIẾT LẬP BẢNG 08: EXECUTIVE DASHBOARD KPI VỚI CÔNG THỨC THỜI GIAN THỰC
  const sheetDB = sheets.DASHBOARD;
  sheetDB.clear();
  sheetDB.setTabColor(HVU_RED);
  
  // Tiêu đề Dashboard
  sheetDB.getRange("A1:F1").merge()
    .setValue("CỔNG ĐIỀU HÀNH CHUYỂN ĐỔI SỐ - BẢNG TỔNG HỢP TIẾN ĐỘ THỰC HIỆN NQ57")
    .setBackground(HVU_NAVY)
    .setFontColor(HEADER_TEXT)
    .setFontWeight("bold")
    .setFontSize(14)
    .setHorizontalAlignment("center");

  // Khối 1: Các chỉ số KPI tổng quát
  sheetDB.getRange("A3:B3").merge().setValue("CHỈ SỐ TIẾN ĐỘ CHUNG").setFontWeight("bold").setBackground("#EEF2F6");
  sheetDB.getRange("C3:D3").merge().setValue("SỐ LƯỢNG").setFontWeight("bold").setBackground("#EEF2F6").setHorizontalAlignment("center");
  sheetDB.getRange("E3:F3").merge().setValue("TỶ LỆ %").setFontWeight("bold").setBackground("#EEF2F6").setHorizontalAlignment("center");

  const kpiRows = [
    ["Tổng số nhiệm vụ theo kế hoạch", "=COUNTA('01_Nhiem_Vu_NQ57'!A2:A)", "100%"],
    ["Đã hoàn thành (Có minh chứng nghiệm thu)", "=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, \"Đã hoàn thành\")", "=C5/C4"],
    ["Đang thực hiện (Trong hạn)", "=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, \"Đang thực hiện\")", "=C6/C4"],
    ["Sắp đến hạn (Khẩn trương hoàn thành)", "=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, \"Sắp đến hạn\")", "=C7/C4"],
    ["Quá hạn (Cần Ban Giám hiệu đôn đốc)", "=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, \"Quá hạn\")", "=C8/C4"],
    ["Chưa thực hiện (0%)", "=COUNTIF('01_Nhiem_Vu_NQ57'!I2:I, \"Chưa thực hiện\")", "=C9/C4"]
  ];

  for (let i = 0; i < kpiRows.length; i++) {
    const row = 4 + i;
    sheetDB.getRange(row, 1, 1, 2).merge().setValue(kpiRows[i][0]);
    sheetDB.getRange(row, 3, 1, 2).merge().setValue(kpiRows[i][1]).setHorizontalAlignment("center").setFontWeight("bold");
    sheetDB.getRange(row, 5, 1, 2).merge().setValue(kpiRows[i][2]).setHorizontalAlignment("center").setNumberFormat("0.0%");
  }

  // Tô màu nhấn
  sheetDB.getRange("C5:D5").setFontColor("#15803D");
  sheetDB.getRange("C8:D8").setFontColor("#BE1E2D");

  // Khối 2: Thống kê theo 7 Nhóm Kế hoạch
  sheetDB.getRange("A12:F12").merge().setValue("TIẾN ĐỘ CHI TIẾT THEO TỪNG NHÓM KẾ HOẠCH NQ57").setFontWeight("bold").setBackground("#EEF2F6");
  sheetDB.getRange("A13").setValue("=QUERY('01_Nhiem_Vu_NQ57'!A1:K, \"SELECT B, count(A) WHERE A IS NOT NULL GROUP BY B LABEL count(A) 'Số nhiệm vụ'\", 1)");

  // Kẻ viền và căn chỉnh
  sheetDB.autoResizeColumns(1, 6);
  sheetKH.autoResizeColumns(1, headersKH.length);
  sheetDV.autoResizeColumns(1, headersDV.length);
  sheetTK.autoResizeColumns(1, headersTK.length);
  sheetMC.autoResizeColumns(1, headersMC.length);
  sheetNV.autoResizeColumns(1, headersNV.length);
  sheetCL.autoResizeColumns(1, headersCL.length);

  SpreadsheetApp.flush();
  Logger.log("Đã khởi tạo thành công 8 bảng CSDL Cổng Điều Hành NQ57 với 57 nhiệm vụ chính thức!");
}

/**
 * Hàm phụ trợ định dạng hàng tiêu đề theo phong cách HVU
 */
function setupSheetHeader(sheet, headers, bgHex, textHex) {
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground(bgHex)
    .setFontColor(textHex)
    .setFontWeight("bold")
    .setFontFamily("Inter")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setRowHeight(1, 38);
}

/**
 * ==============================================================================
 * API WEB APP: ĐỒNG BỘ 2 CHIỀU GIỮA WEB APP VÀ GOOGLE SHEETS
 * (Không cần Google Cloud Console OAuth, không bị lỗi origin_mismatch!)
 * ==============================================================================
 */

/**
 * Xử lý yêu cầu GET: Web App gọi lấy danh sách 57 nhiệm vụ
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("01_Nhiem_Vu_NQ57");
    if (!sheet) {
      return createJsonResponse({ error: "Không tìm thấy bảng 01_Nhiem_Vu_NQ57" });
    }
    
    // 1. Đọc bảng Checklist (09_Checklist_Sub_Tasks)
    const sheetCL = ss.getSheetByName("09_Checklist_Sub_Tasks");
    const checklistMap = {};
    if (sheetCL) {
      const clValues = sheetCL.getDataRange().getValues();
      for (let k = 1; k < clValues.length; k++) {
        const clRow = clValues[k];
        const taskId = String(clRow[1] || "").trim();
        if (taskId) {
          if (!checklistMap[taskId]) checklistMap[taskId] = [];
          checklistMap[taskId].push({
            id: String(clRow[0] || ("cl_" + k)),
            title: String(clRow[2] || ""),
            completed: clRow[3] === true || String(clRow[3]).toLowerCase() === "true"
          });
        }
      }
    }

    // 2. Đọc bảng Nhiệm vụ (01_Nhiem_Vu_NQ57)
    const values = sheet.getDataRange().getValues();
    const tasks = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0]) {
        let thoiHanStr = "";
        if (row[7] instanceof Date) {
          thoiHanStr = Utilities.formatDate(row[7], Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          thoiHanStr = String(row[7] || "");
        }
        const taskId = String(row[0]).trim();
        tasks.push({
          id: taskId,
          nhomKeHoach: row[1],
          tenNhiemVu: row[2],
          donViChuTri: row[3],
          donViPhoiHop: row[4],
          sanPhamDauRa: row[5],
          thoiHanVanBan: row[6],
          thoiHan: thoiHanStr,
          trangThai: row[8],
          mucDoUuTien: row[9],
          tiendo: Number(row[10]) || 0,
          nguoiPhuTrach: row[11],
          linkMinhChung: row[12],
          ghiChuNoiBo: row[13],
          yKienChiDao: row[14],
          ngayCapNhat: row[15],
          approvalStatus: String(row[16] || "Chua_Nop").trim(),
          checklist: checklistMap[taskId] || []
        });
      }
    }

    // 3. Đọc bảng tài khoản người dùng (04_Tai_Khoan_Nguoi_Dung)
    const sheetTK = ss.getSheetByName("04_Tai_Khoan_Nguoi_Dung") || ss.getSheetByName("Tai_Khoan");
    const accounts = [];
    if (sheetTK) {
      const tkValues = sheetTK.getDataRange().getValues();
      for (let j = 1; j < tkValues.length; j++) {
        const r = tkValues[j];
        if (r[0] && String(r[0]).includes("@")) {
          accounts.push({
            email: String(r[0]).trim(),
            hoTen: String(r[1] || "").trim(),
            donVi: String(r[2] || "").trim(),
            vaiTro: String(r[3] || "Don_Vi").trim(),
            avatar: String(r[4] || "👤").trim(),
            passwordHash: String(r[5] || "").trim(),
            trangThai: String(r[6] || "Hoạt động").trim()
          });
        }
      }
    }

    // 4. Đọc bảng Audit Log (06_Nhat_Ky_Audit_Log)
    const sheetLog = ss.getSheetByName("06_Nhat_Ky_Audit_Log");
    const auditLogs = [];
    if (sheetLog) {
      const logValues = sheetLog.getDataRange().getValues();
      const startLog = Math.max(1, logValues.length - 200);
      for (let m = logValues.length - 1; m >= startLog; m--) {
        const lr = logValues[m];
        if (lr[0]) {
          let timeStr = "";
          if (lr[1] instanceof Date) {
            timeStr = Utilities.formatDate(lr[1], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
          } else {
            timeStr = String(lr[1] || "");
          }
          auditLogs.push({
            id: String(lr[0]),
            timestamp: timeStr,
            actor: String(lr[2] || ""),
            actorRole: String(lr[3] || ""),
            action: String(lr[4] || "UPDATE"),
            taskId: String(lr[5] || ""),
            taskTitle: String(lr[6] || ""),
            details: String(lr[7] || "")
          });
        }
      }
    }

    return createJsonResponse({ 
      success: true, 
      count: tasks.length, 
      tasks: tasks,
      accounts: accounts,
      auditLogs: auditLogs
    });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

/**
 * Xử lý yêu cầu POST: Web App gửi dữ liệu cập nhật lên Google Sheets
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("01_Nhiem_Vu_NQ57");
    if (!sheet) {
      return createJsonResponse({ error: "Không tìm thấy bảng 01_Nhiem_Vu_NQ57" });
    }
    const payload = JSON.parse(e.postData.contents);

    // 1. Cập nhật Nhiệm vụ & Checklist
    if (payload.action === "updateTasks" && Array.isArray(payload.tasks)) {
      const existingData = sheet.getDataRange().getValues();
      const idRowMap = {};
      for (let i = 1; i < existingData.length; i++) {
        idRowMap[existingData[i][0]] = i + 1;
      }

      const sheetCL = ss.getSheetByName("09_Checklist_Sub_Tasks");

      payload.tasks.forEach(function(t) {
        const row = idRowMap[t.id];
        if (row) {
          if (t.trangThai !== undefined) sheet.getRange(row, 9).setValue(t.trangThai);
          if (t.mucDoUuTien !== undefined) sheet.getRange(row, 10).setValue(t.mucDoUuTien);
          if (t.tiendo !== undefined) sheet.getRange(row, 11).setValue(t.tiendo);
          if (t.nguoiPhuTrach !== undefined) sheet.getRange(row, 12).setValue(t.nguoiPhuTrach);
          if (t.linkMinhChung !== undefined) sheet.getRange(row, 13).setValue(t.linkMinhChung);
          if (t.ghiChuNoiBo !== undefined) sheet.getRange(row, 14).setValue(t.ghiChuNoiBo);
          if (t.yKienChiDao !== undefined) sheet.getRange(row, 15).setValue(t.yKienChiDao);
          sheet.getRange(row, 16).setValue(new Date().toISOString());
          if (t.approvalStatus !== undefined) sheet.getRange(row, 17).setValue(t.approvalStatus);

          // Cập nhật Checklist nếu có gửi kèm
          if (sheetCL && Array.isArray(t.checklist)) {
            const clData = sheetCL.getDataRange().getValues();
            for (let c = clData.length - 1; c >= 1; c--) {
              if (String(clData[c][1]).trim() === String(t.id).trim()) {
                sheetCL.deleteRow(c + 1);
              }
            }
            t.checklist.forEach(function(item, idx) {
              sheetCL.appendRow([
                item.id || ("cl_" + t.id + "_" + (idx + 1)),
                t.id,
                item.title || "",
                item.completed === true ? "true" : "false",
                t.nguoiPhuTrach || "Cán bộ",
                Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")
              ]);
            });
          }
        }
      });
      return createJsonResponse({ success: true, message: "Đã cập nhật nhiệm vụ và checklist thành công" });
    }

    // 2. Thêm Audit Log
    if (payload.action === "addAuditLog" && payload.log) {
      const sheetLog = ss.getSheetByName("06_Nhat_Ky_Audit_Log");
      if (sheetLog) {
        const l = payload.log;
        sheetLog.appendRow([
          l.id || ("log_" + Date.now()),
          l.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
          l.actor || "",
          l.actorRole || "",
          l.action || "UPDATE",
          l.taskId || "",
          l.taskTitle || "",
          l.details || ""
        ]);
        return createJsonResponse({ success: true, message: "Đã ghi nhật ký thành công" });
      }
    }

    // 3. Đổi mật khẩu
    if (payload.action === "changePassword" && payload.email && payload.passwordHash) {
      const sheetTK = ss.getSheetByName("04_Tai_Khoan_Nguoi_Dung");
      if (sheetTK) {
        const tkData = sheetTK.getDataRange().getValues();
        for (let i = 1; i < tkData.length; i++) {
          if (String(tkData[i][0]).toLowerCase().trim() === String(payload.email).toLowerCase().trim()) {
            sheetTK.getRange(i + 1, 6).setValue(payload.passwordHash);
            return createJsonResponse({ success: true, message: "Đã đổi mật khẩu thành công" });
          }
        }
      }
      return createJsonResponse({ success: false, message: "Không tìm thấy tài khoản để đổi mật khẩu" });
    }

    return createJsonResponse({ success: false, message: "Action không hợp lệ" });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
