import { TaskNQ57 } from '../types';
import { formatVietnameseDate } from './dateUtils';

/**
 * Generates and triggers download of a standardized HVU Excel (.xls) file
 * with clean styling, headers, and UTF-8 encoding support.
 */
export function exportTasksToExcel(tasks: TaskNQ57[], title: string = 'Bao_Cao_Tien_Do_NQ57_HVU'): void {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  
  const headers = [
    'Mã NV',
    'Nhóm Kế Hoạch',
    'Tên Nhiệm Vụ',
    'Đơn Vị Chủ Trì',
    'Đơn Vị Phối Hợp',
    'Sản Phẩm Đầu Ra',
    'Thời Hạn',
    'Trạng Thái',
    'Tiến Độ (%)',
    'Mức Độ Ưu Tiên',
    'Người Phụ Trách',
    'Tình Trạng Duyệt',
    'Số File Minh Chứng',
    'Link Minh Chứng',
    'Ý Kiến Chỉ Đạo',
    'Ngày Cập Nhật'
  ];

  let rowsHtml = '';
  tasks.forEach((t, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const statusColor = 
      t.trangThai === 'Đã hoàn thành' ? '#15803d' :
      t.trangThai === 'Quá hạn' ? '#be123c' :
      t.trangThai === 'Sắp đến hạn' ? '#b45309' : '#334155';

    const driveUrl = t.linkMinhChung || (t.filesMinhChung && t.filesMinhChung[0]?.driveUrl) || '';

    rowsHtml += `
      <tr style="background-color: ${bgColor};">
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${t.id}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${t.nhomKeHoach || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: 500;">${t.tenNhiemVu}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #0B2545;">${t.donViChuTri}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${t.donViPhoiHop || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${t.sanPhamDauRa || ''}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${formatVietnameseDate(t.thoiHan)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: ${statusColor};">${t.trangThai}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${t.tiendo}%</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${t.mucDoUuTien || 'Bình thường'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${t.nguoiPhuTrach || ''}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${t.approvalStatus === 'Da_Duyet' ? 'Đã duyệt' : t.approvalStatus === 'Cho_Duyet' ? 'Chờ duyệt' : 'Chưa nộp'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${t.filesMinhChung?.length || 0}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${driveUrl ? `<a href="${driveUrl}">${driveUrl}</a>` : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-style: italic; color: #881337;">${t.yKienChiDao || ''}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${t.ngayCapNhat || ''}</td>
      </tr>
    `;
  });

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Nhiem_Vu_NQ57</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background-color: #0B2545; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #000000; text-align: center; }
        td { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
      </style>
    </head>
    <body>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td colspan="${headers.length}" style="font-size: 16pt; font-weight: bold; text-align: center; color: #0B2545; padding: 12px;">
            TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG - BÁO CÁO TIẾN ĐỘ THỰC HIỆN NGHỊ QUYẾT 57-NQ/TW
          </td>
        </tr>
        <tr>
          <td colspan="${headers.length}" style="font-size: 11pt; font-style: italic; text-align: center; padding-bottom: 12px; color: #64748b;">
            Ngày xuất báo cáo: ${currentDate} • Tổng số nhiệm vụ: ${tasks.length}
          </td>
        </tr>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `.trim();

  const blob = new Blob(['\ufeff', template], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const safeFilename = `${title}_${new Date().toISOString().slice(0, 10)}.xls`;
  downloadLink.href = url;
  downloadLink.download = safeFilename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
