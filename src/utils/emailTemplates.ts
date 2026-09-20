/**
 * Email Templates with Official HVU Branding
 * Primary colors: HVU Navy (#0B2545), HVU Red (#BE1E2D), Clean white/slate background
 */

export function generateDirectiveEmailHtml(data: {
  taskId: string;
  taskTitle: string;
  donViChuTri: string;
  nguoiPhuTrach?: string;
  thoiHan?: string;
  directiveContent: string;
  directiveAuthor: string;
  directiveRole: string;
  directiveTime: string;
  appUrl?: string;
}): string {
  const appUrl = data.appUrl || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ý Kiến Chỉ Đạo Nhiệm Vụ NQ57</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #0B2545; padding: 20px 24px; border-bottom: 4px solid #BE1E2D; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; font-weight: 600;">TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG</div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">CỔNG ĐIỀU HÀNH NGHỊ QUYẾT 57-NQ/TW</div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="background-color: #BE1E2D; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; rounded-radius: 6px; text-transform: uppercase;">Chỉ đạo mới</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="margin-top: 0; font-size: 15px; line-height: 1.6;">
        Kính gửi: <strong>${data.donViChuTri}</strong> ${data.nguoiPhuTrach ? `(${data.nguoiPhuTrach})` : ''},
      </p>
      
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Lãnh đạo Nhà trường vừa ban hành <strong>Ý kiến chỉ đạo đôn đốc</strong> đối với nhiệm vụ thuộc trách nhiệm thực hiện của đơn vị:
      </p>

      <!-- Task Card -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #0B2545; text-transform: uppercase;">
          [${data.taskId}]
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
          ${data.taskTitle}
        </div>
        ${data.thoiHan ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Thời hạn hoàn thành: <strong style="color: #BE1E2D;">${data.thoiHan}</strong></div>` : ''}
      </div>

      <!-- Directive Box -->
      <div style="background-color: #fff1f2; border-left: 4px solid #BE1E2D; border-radius: 0 8px 8px 0; padding: 14px 16px; margin: 18px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #9f1239; margin-bottom: 6px; display: flex; align-items: center;">
          <span>📢 Ý KIẾN CHỈ ĐẠO CỦA ${data.directiveRole.toUpperCase()}:</span>
        </div>
        <div style="font-size: 14px; color: #881337; line-height: 1.6; font-style: italic; white-space: pre-wrap;">
          "${data.directiveContent}"
        </div>
        <div style="font-size: 11px; color: #9f1239; margin-top: 8px; text-align: right; opacity: 0.85;">
          ${data.directiveAuthor} • ${data.directiveTime}
        </div>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #475569;">
        Đề nghị đơn vị khẩn trương rà soát tiến độ, cập nhật tài liệu minh chứng và báo cáo kết quả thực hiện trên hệ thống.
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${appUrl}" style="background-color: #0B2545; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">
          👉 Truy cập Cổng Điều Hành NQ57
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
      Hệ thống Quản lý Tiến độ 57 Nhiệm vụ NQ57-NQ/TW • Trường Đại học Hùng Vương (HVU)<br>
      Email tự động, vui lòng không trả lời trực tiếp email này.
    </div>

  </div>
</body>
</html>
  `.trim();
}

export function generateReminderEmailHtml(data: {
  donVi: string;
  nguoiNhan?: string;
  items: Array<{
    taskId: string;
    taskTitle: string;
    checklistTitle?: string;
    thoiHan?: string;
    trangThai: string;
    isOverdue?: boolean;
  }>;
  appUrl?: string;
}): string {
  const appUrl = data.appUrl || 'http://localhost:5173';

  const rowsHtml = data.items.map((it, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0B2545; vertical-align: top;">
        ${it.taskId}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top;">
        <div style="font-weight: 600; color: #0f172a;">${it.taskTitle}</div>
        ${it.checklistTitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">• Hạng mục con: ${it.checklistTitle}</div>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; white-space: nowrap;">
        <strong style="color: ${it.isOverdue ? '#BE1E2D' : '#d97706'};">${it.thoiHan || 'Chưa đặt'}</strong>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; text-align: center;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 600; background-color: ${it.isOverdue ? '#ffe4e6' : '#fef3c7'}; color: ${it.isOverdue ? '#be123c' : '#b45309'};">
          ${it.trangThai}
        </span>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Đôn Đốc Tiến Độ Nhiệm Vụ NQ57</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #0B2545; padding: 20px 24px; border-bottom: 4px solid #BE1E2D; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; font-weight: 600;">TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG</div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">CỔNG ĐIỀU HÀNH NGHỊ QUYẾT 57-NQ/TW</div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="background-color: #d97706; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Đôn đốc tiến độ</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="margin-top: 0; font-size: 15px; line-height: 1.6;">
        Kính gửi: <strong>${data.donVi}</strong> ${data.nguoiNhan ? `(${data.nguoiNhan})` : ''},
      </p>
      
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Tổ chuyên trách Chuyển đổi số xin thông báo và đôn đốc các nhiệm vụ thuộc kế hoạch NQ57 đang ở trạng thái <strong>Sắp đến hạn</strong> hoặc <strong>Quá hạn</strong> cần khẩn trương hoàn thành:
      </p>

      <!-- Tasks Table -->
      <div style="margin: 18px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #0B2545; color: #ffffff; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 10px 12px; width: 60px;">Mã</th>
              <th style="padding: 10px 12px;">Tên Nhiệm Vụ</th>
              <th style="padding: 10px 12px; width: 100px;">Thời hạn</th>
              <th style="padding: 10px 12px; width: 100px; text-align: center;">Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #475569;">
        Đề nghị cán bộ phụ trách khẩn trương tải lên minh chứng nghiệm thu (báo cáo, quyết định) và hoàn tất các hạng mục công việc con trước thời hạn quy định.
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${appUrl}" style="background-color: #BE1E2D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">
          🚀 Cập Nhật Tiến Độ Ngay
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
      Hệ thống Quản lý Tiến độ 57 Nhiệm vụ NQ57-NQ/TW • Trường Đại học Hùng Vương (HVU)<br>
      Email tự động được gửi từ Cổng Điều Hành NQ57.
    </div>

  </div>
</body>
</html>
  `.trim();
}
