/**
 * Drive Naming and Organization Utilities
 * Standardizes folder and file names for Google Drive evidence storage.
 * 
 * Folder Scheme: Google_Drive/HVU_NQ57/[NVxx]_[TaskName_Clean]
 * File Scheme:   [NVxx]_[DocType]_[ContentName]_[YYYYMMDD].[ext]
 */

export type DocumentType = 'KH' | 'BC' | 'QD' | 'HD' | 'MC';

export interface DocumentTypeOption {
  code: DocumentType;
  label: string;
  description: string;
}

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { code: 'BC', label: 'Báo cáo', description: 'Báo cáo tiến độ, kết quả, tổng kết' },
  { code: 'KH', label: 'Kế hoạch', description: 'Kế hoạch triển khai, phân công' },
  { code: 'QD', label: 'Quyết định / Chỉ đạo', description: 'Văn bản chỉ đạo, thành lập, phê duyệt' },
  { code: 'HD', label: 'Hợp đồng / Nghiệm thu', description: 'Hợp đồng, biên bản bàn giao, nghiệm thu' },
  { code: 'MC', label: 'Minh chứng khác', description: 'Hình ảnh, danh sách, tài liệu bổ trợ' },
];

/**
 * Strips Vietnamese diacritics and converts to safe ASCII
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim();
}

/**
 * Converts a string into PascalCase or clean CamelCase suitable for file/folder names
 */
export function toSafeAlphanumericName(str: string, maxLength: number = 35): string {
  const clean = removeVietnameseDiacritics(str);
  const words = clean.split(/[\s_-]+/).filter(Boolean);
  if (words.length === 0) return 'TaiLieu';

  const pascal = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return pascal.slice(0, maxLength);
}

/**
 * Guess document type code from file name
 */
export function detectDocumentType(fileName: string): DocumentType {
  const lower = removeVietnameseDiacritics(fileName).toLowerCase();

  if (lower.includes('bao cao') || lower.includes('bc') || lower.includes('tien do') || lower.includes('tong ket')) {
    return 'BC';
  }
  if (lower.includes('ke hoach') || lower.includes('kh') || lower.includes('phuong an') || lower.includes('de cuong')) {
    return 'KH';
  }
  if (lower.includes('quyet dinh') || lower.includes('qd') || lower.includes('chi dao') || lower.includes('thong bao') || lower.includes('tb')) {
    return 'QD';
  }
  if (lower.includes('hop dong') || lower.includes('hd') || lower.includes('nghiem thu') || lower.includes('bien ban') || lower.includes('bb')) {
    return 'HD';
  }
  return 'MC';
}

/**
 * Generates folder name for a specific task
 * Example: "NV32_XacThucVanBangChungChi"
 */
export function generateTaskFolderName(taskId: string, taskTitle: string): string {
  const safeTitle = toSafeAlphanumericName(taskTitle, 30);
  return `${taskId}_${safeTitle}`;
}

/**
 * Generates standardized folder path in Google Drive
 * Example: "Google_Drive/HVU_NQ57/NV32_XacThucVanBangChungChi"
 */
export function generateTaskFolderPath(taskId: string, taskTitle: string): string {
  const folderName = generateTaskFolderName(taskId, taskTitle);
  return `Google_Drive/HVU_NQ57/${folderName}`;
}

/**
 * Generates standardized file name
 * Scheme: [NVxx]_[DocType]_[ContentName]_[YYYYMMDD].[ext]
 * Example: NV32_BC_TienDoGiaiDoan1_20260911.pdf
 */
export function generateEvidenceFileName(
  taskId: string,
  originalFileName: string,
  customDocType?: DocumentType,
  customContentName?: string
): string {
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const rawExtension = lastDotIndex !== -1 ? originalFileName.substring(lastDotIndex) : '';
  const baseName = lastDotIndex !== -1 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

  const docType = customDocType || detectDocumentType(baseName);
  const contentName = customContentName ? toSafeAlphanumericName(customContentName, 30) : toSafeAlphanumericName(baseName, 30);

  // Date format: YYYYMMDD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  return `${taskId}_${docType}_${contentName}_${dateStr}${rawExtension.toLowerCase()}`;
}
