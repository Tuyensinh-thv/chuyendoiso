import { TaskNQ57, UserAccount, CustomCategory, EvidenceFile, AuditLogEntry, TaskChecklistItem } from '../types';
import { saveAccountsToStorage, saveAuditLogsToStorage, DEFAULT_PASSWORD_HASH } from './storage';

const SPREADSHEET_ID_KEY = 'hvu_nq57_google_spreadsheet_id_v1';
const DRIVE_FOLDER_ID_KEY = 'hvu_nq57_google_drive_folder_id_v1';
const GOOGLE_ACCESS_TOKEN_KEY = 'hvu_nq57_google_access_token_v1';
const AUTO_BACKUP_KEY = 'hvu_nq57_auto_backup_v1';
const LAST_SYNC_KEY = 'hvu_nq57_last_sync_v1';
const GAS_WEBAPP_URL_KEY = 'hvu_nq57_gas_webapp_url_v1';

export interface GoogleSyncConfig {
  spreadsheetId: string;
  driveFolderId: string;
  gasWebAppUrl: string;
  autoBackup: boolean;
  lastSync: string;
}

export function loadSyncConfig(): GoogleSyncConfig {
  return {
    spreadsheetId: localStorage.getItem(SPREADSHEET_ID_KEY) || '1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc',
    driveFolderId: localStorage.getItem(DRIVE_FOLDER_ID_KEY) || '',
    gasWebAppUrl: localStorage.getItem(GAS_WEBAPP_URL_KEY) || '',
    autoBackup: localStorage.getItem(AUTO_BACKUP_KEY) === 'true',
    lastSync: localStorage.getItem(LAST_SYNC_KEY) || '',
  };
}

export function saveSyncConfig(config: Partial<GoogleSyncConfig>): void {
  if (config.spreadsheetId !== undefined) {
    localStorage.setItem(SPREADSHEET_ID_KEY, config.spreadsheetId);
  }
  if (config.driveFolderId !== undefined) {
    localStorage.setItem(DRIVE_FOLDER_ID_KEY, config.driveFolderId);
  }
  if (config.gasWebAppUrl !== undefined) {
    localStorage.setItem(GAS_WEBAPP_URL_KEY, config.gasWebAppUrl);
  }
  if (config.autoBackup !== undefined) {
    localStorage.setItem(AUTO_BACKUP_KEY, String(config.autoBackup));
  }
  if (config.lastSync !== undefined) {
    localStorage.setItem(LAST_SYNC_KEY, config.lastSync);
  }
}

/**
 * Direct 2-way sync with Google Apps Script Web App (Bypasses Google OAuth origin restrictions)
 */
export async function fetchTasksFromGas(webAppUrl: string): Promise<{ 
  tasks: TaskNQ57[]; 
  accounts?: UserAccount[];
  auditLogs?: AuditLogEntry[];
}> {
  const url = webAppUrl.trim();
  if (!url) throw new Error('Vui lòng nhập URL Web App của Google Apps Script.');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lỗi kết nối tới Apps Script (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  if (!Array.isArray(result.tasks)) {
    throw new Error('Định dạng dữ liệu trả về từ Apps Script không hợp lệ.');
  }
  let accountsList: UserAccount[] | undefined = undefined;
  if (Array.isArray(result.accounts) && result.accounts.length > 0) {
    accountsList = result.accounts;
    saveAccountsToStorage(result.accounts);
  }
  let logsList: AuditLogEntry[] | undefined = undefined;
  if (Array.isArray(result.auditLogs) && result.auditLogs.length > 0) {
    logsList = result.auditLogs;
    saveAuditLogsToStorage(result.auditLogs);
  }
  return {
    tasks: result.tasks,
    accounts: accountsList,
    auditLogs: logsList,
  };
}

export async function pushTasksToGas(webAppUrl: string, tasks: TaskNQ57[]): Promise<void> {
  const url = webAppUrl.trim();
  if (!url) throw new Error('Vui lòng nhập URL Web App của Google Apps Script.');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'updateTasks',
      tasks: tasks.map(t => ({
        id: t.id,
        trangThai: t.trangThai,
        mucDoUuTien: t.mucDoUuTien,
        tiendo: t.tiendo,
        nguoiPhuTrach: t.nguoiPhuTrach,
        linkMinhChung: t.linkMinhChung,
        ghiChuNoiBo: t.ghiChuNoiBo,
        yKienChiDao: t.yKienChiDao,
        approvalStatus: t.approvalStatus || 'Chua_Nop',
        checklist: t.checklist || []
      }))
    })
  });
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json.error) throw new Error(json.error);
  } catch (e) {
    // Ignore JSON parse error if response was ok
  }
}

export async function pushAuditLogToGas(webAppUrl: string, log: AuditLogEntry): Promise<void> {
  const url = webAppUrl.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'addAuditLog',
        log: log
      })
    });
  } catch (err) {
    console.warn('Failed to push audit log to GAS:', err);
  }
}

export async function pushChangePasswordToGas(webAppUrl: string, email: string, passwordHash: string): Promise<boolean> {
  const url = webAppUrl.trim();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'changePassword',
        email,
        passwordHash
      })
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return data.success === true;
  } catch (err) {
    console.warn('Failed to change password in GAS:', err);
    return false;
  }
}

/**
 * Standard RFC-4180 compliant CSV Parser
 */
export function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

/**
 * Directly fetch tasks and accounts from Google Sheets via public gviz CSV endpoint
 * (Works without OAuth token and without Apps Script URL!)
 */
export async function fetchPublicSpreadsheetData(
  spreadsheetId: string = '1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc'
): Promise<{ tasks: TaskNQ57[]; accounts: UserAccount[]; auditLogs: AuditLogEntry[] }> {
  const id = spreadsheetId.trim() || '1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc';
  
  // 1. Fetch 01_Nhiem_Vu_NQ57
  const nvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=01_Nhiem_Vu_NQ57`;
  const nvRes = await fetch(nvUrl);
  if (!nvRes.ok) {
    throw new Error(`Không thể kết nối đến Google Sheets (HTTP ${nvRes.status})`);
  }
  const nvCsv = await nvRes.text();
  const nvRows = parseCsv(nvCsv);
  if (nvRows.length <= 1) {
    throw new Error('Dữ liệu bảng 01_Nhiem_Vu_NQ57 trống.');
  }

  const tasks: TaskNQ57[] = [];
  for (let i = 1; i < nvRows.length; i++) {
    const r = nvRows[i];
    if (r[0]) {
      tasks.push({
        id: r[0],
        nhomKeHoach: r[1] || '',
        tenNhiemVu: r[2] || '',
        donViChuTri: r[3] || '',
        donViPhoiHop: r[4] || '',
        sanPhamDauRa: r[5] || '',
        thoiHan: (r[7] && r[7].trim()) ? r[7].trim() : (r[6] || ''),
        trangThai: (r[8] as any) || 'Chưa thực hiện',
        mucDoUuTien: (r[9] as any) || 'Trung bình',
        tiendo: Number(r[10]) || 0,
        nguoiPhuTrach: r[11] || '',
        emailPhuTrach: '',
        linkMinhChung: r[12] || '',
        filesMinhChung: [],
        ghiChuNoiBo: r[13] || '',
        yKienChiDao: r[14] || '',
        ngayCapNhat: r[15] || new Date().toISOString(),
        category: 'cat_cds',
        checklist: [],
        comments: [],
        approvalStatus: (r[16] && r[16].trim()) ? (r[16].trim() as any) : 'Chua_Nop'
      });
    }
  }

  // 2. Fetch 09_Checklist_Sub_Tasks
  try {
    const clUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=09_Checklist_Sub_Tasks`;
    const clRes = await fetch(clUrl);
    if (clRes.ok) {
      const clCsv = await clRes.text();
      const clRows = parseCsv(clCsv);
      const clMap: Record<string, TaskChecklistItem[]> = {};
      for (let k = 1; k < clRows.length; k++) {
        const cr = clRows[k];
        const taskId = (cr[1] || '').trim();
        if (taskId) {
          if (!clMap[taskId]) clMap[taskId] = [];
          clMap[taskId].push({
            id: (cr[0] || `cl_${taskId}_${k}`).trim(),
            title: (cr[2] || '').trim(),
            completed: String(cr[3]).toLowerCase().trim() === 'true'
          });
        }
      }
      tasks.forEach(t => {
        if (clMap[t.id] && clMap[t.id].length > 0) {
          t.checklist = clMap[t.id];
        }
      });
    }
  } catch (clErr) {
    console.warn('Could not fetch checklist from sheet 09:', clErr);
  }

  // 3. Fetch 04_Tai_Khoan_Nguoi_Dung
  const accounts: UserAccount[] = [];
  try {
    const tkUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=04_Tai_Khoan_Nguoi_Dung`;
    const tkRes = await fetch(tkUrl);
    if (tkRes.ok) {
      const tkCsv = await tkRes.text();
      const tkRows = parseCsv(tkCsv);
      for (let j = 1; j < tkRows.length; j++) {
        const r = tkRows[j];
        if (r[0] && r[0].includes('@')) {
          const email = r[0].trim();
          let vaiTro = (r[3] || '').trim();
          if (email === 'kiennt@hvu.edu.vn') {
            vaiTro = 'Admin';
          } else if (!vaiTro) {
            vaiTro = 'Don_Vi';
          }
          accounts.push({
            email,
            hoTen: (r[1] || '').trim(),
            donVi: (r[2] || '').trim(),
            vaiTro: vaiTro as any,
            avatar: (r[4] || '👤').trim() || '👤',
            passwordHash: (r[5] && r[5].trim()) ? r[5].trim() : DEFAULT_PASSWORD_HASH,
            trangThai: (r[6] && r[6].trim()) ? (r[6].trim() as any) : 'Hoạt động'
          });
        }
      }
      if (accounts.length > 0) {
        saveAccountsToStorage(accounts);
      }
    }
  } catch (tkErr) {
    console.warn('Could not fetch accounts from sheet 04:', tkErr);
  }

  // 4. Fetch 06_Nhat_Ky_Audit_Log
  const auditLogs: AuditLogEntry[] = [];
  try {
    const logUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=06_Nhat_Ky_Audit_Log`;
    const logRes = await fetch(logUrl);
    if (logRes.ok) {
      const logCsv = await logRes.text();
      const logRows = parseCsv(logCsv);
      for (let m = 1; m < logRows.length; m++) {
        const lr = logRows[m];
        if (lr[0]) {
          auditLogs.push({
            id: (lr[0] || `log_${m}`).trim(),
            timestamp: (lr[1] || '').trim(),
            actor: (lr[2] || '').trim(),
            actorRole: (lr[3] || '').trim(),
            action: ((lr[4] || 'UPDATE').trim() as any),
            taskId: (lr[5] || '').trim(),
            taskTitle: (lr[6] || '').trim(),
            details: (lr[7] || '').trim(),
          });
        }
      }
      if (auditLogs.length > 0) {
        saveAuditLogsToStorage(auditLogs);
      }
    }
  } catch (logErr) {
    console.warn('Could not fetch audit logs from sheet 06:', logErr);
  }

  const nowString = new Date().toLocaleString('vi-VN');
  saveSyncConfig({ lastSync: nowString });

  return { tasks, accounts, auditLogs };
}

export function loadAccessToken(): string {
  return sessionStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY) || localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY) || '';
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, token);
  // Remove from localStorage if previously stored
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
}

/**
 * Triggers client-side Google OAuth popup flow using GIS (Google Identity Services)
 */
export function initGoogleAuthPopup(onSuccess: (token: string) => void, onError: (err: any) => void): void {
  try {
    // 1. Ensure the GIS client script is loaded in the DOM
    if (!(window as any).google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        launchTokenClient(onSuccess, onError);
      };
      script.onerror = (err) => {
        onError(err);
      };
      document.head.appendChild(script);
    } else {
      launchTokenClient(onSuccess, onError);
    }
  } catch (err) {
    onError(err);
  }
}

function launchTokenClient(onSuccess: (token: string) => void, onError: (err: any) => void): void {
  try {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '528953211500-je0ljh9imker5p5bnujppgaps50idn6l.apps.googleusercontent.com';
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error_description) {
          onError(response.error_description);
          return;
        }
        if (response.access_token) {
          saveAccessToken(response.access_token);
          onSuccess(response.access_token);
        }
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    onError(err);
  }
}

/**
 * Helper to execute authorized Google REST API requests
 */
async function googleFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = loadAccessToken();
  if (!token) {
    throw new Error('Chưa liên kết tài khoản Google hoặc phiên làm việc đã hết hạn.');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    clearAccessToken();
    throw new Error('Phiên liên kết Google của bạn đã hết hạn. Vui lòng kết nối lại tài khoản.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || response.statusText;
    throw new Error(`Lỗi Google API: ${message}`);
  }

  return response.json();
}

/**
 * Ensures required sheets exist in the spreadsheet
 */
async function ensureSpreadsheetTabs(spreadsheetId: string): Promise<void> {
  const meta = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  const sheets = meta.sheets || [];
  const existingTitles = sheets.map((s: any) => s.properties?.title);

  const requiredSheets = [
    '01_Nhiem_Vu_NQ57',
    '02_Nhom_Ke_Hoach',
    '03_Danh_Muc_Don_Vi',
    '04_Tai_Khoan_Nguoi_Dung',
    '05_Minh_Chung_File',
    '06_Nhat_Ky_Audit_Log',
    '07_Chi_Dao_Va_Binh_Luan',
    '08_Dashboard_KPI_Tong_Hop'
  ];
  const requests: any[] = [];

  requiredSheets.forEach((title) => {
    if (!existingTitles.includes(title)) {
      requests.push({
        addSheet: {
          properties: { title }
        }
      });
    }
  });

  if (requests.length > 0) {
    await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }
}

/**
 * Creates a brand new Google Spreadsheet
 */
export async function createNewSpreadsheet(title: string): Promise<string> {
  const data = await googleFetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: { title }
    })
  });
  const id = data.spreadsheetId;
  await ensureSpreadsheetTabs(id);
  saveSyncConfig({ spreadsheetId: id });
  return id;
}

/**
 * Creates a Google Drive folder for centralized evidence files
 */
export async function createDriveFolder(folderName: string): Promise<string> {
  const data = await googleFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    })
  });
  const id = data.id;
  saveSyncConfig({ driveFolderId: id });
  return id;
}

/**
 * Exports application database data to Google Sheets
 */
export async function exportToGoogleSheets(
  tasks: TaskNQ57[],
  accounts: UserAccount[],
  categories: CustomCategory[]
): Promise<void> {
  const config = loadSyncConfig();
  let spreadsheetId = config.spreadsheetId;

  if (!spreadsheetId) {
    spreadsheetId = await createNewSpreadsheet('HVU TaskMaster - Lưu trữ & Đồng bộ NQ57');
  }

  await ensureSpreadsheetTabs(spreadsheetId);

  // 1. Prepare Nhiem_Vu_NQ57
  const taskHeader = [
    'Mã Nhiệm Vụ', 'Nhóm Kế Hoạch', 'Tên Nhiệm Vụ', 'Đơn Vị Chủ Trì', 'Đơn Vị Phối Hợp',
    'Sản Phẩm Đầu Ra', 'Ngày Bắt Đầu', 'Thời Hạn', 'Trạng Thái', 'Phụ Trách', 'Tiến Độ (%)',
    'Mức Ưu Tiên', 'Danh Mục', 'Mốc Quan Trọng', 'Người Giao Việc', 'Ý Kiến Chỉ Đạo', 'Ghi Chú Nội Bộ', 'Ngày Cập Nhật'
  ];
  const taskRows = tasks.map(t => [
    t.id, t.nhomKeHoach, t.tenNhiemVu, t.donViChuTri, t.donViPhoiHop,
    t.sanPhamDauRa, t.ngayBatDau || '', t.thoiHan, t.trangThai, t.nguoiPhuTrach, t.tiendo,
    t.mucDoUuTien, t.category || '', t.milestone || '', t.nguoiGiaoViec || '', t.yKienChiDao || '', t.ghiChuNoiBo || '', t.ngayCapNhat
  ]);

  // 2. Prepare Minh_Chung
  const mcHeader = ['Mã Nhiệm Vụ', 'Mã File', 'Tên File', 'Kích Thước (Bytes)', 'Định Dạng', 'Ngày Tải Lên', 'Người Tải Lên', 'Đường Dẫn Drive'];
  const mcRows: any[][] = [];
  tasks.forEach(t => {
    (t.filesMinhChung || []).forEach(f => {
      mcRows.push([t.id, f.id, f.name, f.size, f.mimeType, f.uploadDate, f.uploadedBy, f.driveUrl]);
    });
  });

  // 3. Prepare Tai_Khoan
  const accHeader = ['Email', 'Họ Và Tên', 'Đơn Vị', 'Vai Trò'];
  const accRows = accounts.map(a => [a.email, a.hoTen, a.donVi, a.vaiTro]);

  // 4. Prepare DanhMuc
  const catHeader = ['Mã Danh Mục', 'Tên Danh Mục', 'Màu Sắc', 'Mô Tả'];
  const catRows = categories.map(c => [c.id, c.name, c.color, c.description || '']);

  // 5. Prepare Checklist
  const clHeader = ['Mã Nhiệm Vụ', 'Mã Mục', 'Tên Mục', 'Trạng Thái Hoàn Thành'];
  const clRows: any[][] = [];
  tasks.forEach(t => {
    (t.checklist || []).forEach(item => {
      clRows.push([t.id, item.id, item.title, item.completed ? 'TRUE' : 'FALSE']);
    });
  });

  // 6. Prepare Binh_Luan
  const blHeader = ['Mã Nhiệm Vụ', 'Mã Bình Luận', 'Người Gửi', 'Vai Trò', 'Nội Dung', 'Thời Gian Gửi'];
  const blRows: any[][] = [];
  tasks.forEach(t => {
    (t.comments || []).forEach(c => {
      blRows.push([t.id, c.id, c.author, c.role, c.content, c.createdAt]);
    });
  });

  const meta = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  const sheets = meta.sheets || [];
  const existingTitles: string[] = sheets.map((s: any) => s.properties?.title || '');
  const taskSheetTitle = existingTitles.includes('01_Nhiem_Vu_NQ57') 
    ? '01_Nhiem_Vu_NQ57' 
    : (existingTitles.includes('Nhiem_Vu_NQ57') ? 'Nhiem_Vu_NQ57' : 'Nhiem_Vu');
  const mcSheetTitle = existingTitles.includes('05_Minh_Chung_File') ? '05_Minh_Chung_File' : 'Minh_Chung';

  // Execute batch update values
  const data = [
    { range: `${taskSheetTitle}!A1`, values: [taskHeader, ...taskRows] },
    { range: `${mcSheetTitle}!A1`, values: [mcHeader, ...mcRows] },
    { range: `${existingTitles.includes('04_Tai_Khoan_Nguoi_Dung') ? '04_Tai_Khoan_Nguoi_Dung' : 'Tai_Khoan'}!A1`, values: [accHeader, ...accRows] },
    { range: 'DanhMuc!A1', values: [catHeader, ...catRows] },
    { range: 'Checklist!A1', values: [clHeader, ...clRows] },
    { range: `${existingTitles.includes('07_Chi_Dao_Va_Binh_Luan') ? '07_Chi_Dao_Va_Binh_Luan' : 'Binh_Luan'}!A1`, values: [blHeader, ...blRows] },
  ];

  // First, clear the sheets to avoid stale rows overlapping
  const rangesToClear = [
    `${taskSheetTitle}!A1:Z5000`,
    `${mcSheetTitle}!A1:Z5000`,
    `${existingTitles.includes('04_Tai_Khoan_Nguoi_Dung') ? '04_Tai_Khoan_Nguoi_Dung' : 'Tai_Khoan'}!A1:Z1000`,
    'DanhMuc!A1:Z500',
    'Checklist!A1:Z5000',
    `${existingTitles.includes('07_Chi_Dao_Va_Binh_Luan') ? '07_Chi_Dao_Va_Binh_Luan' : 'Binh_Luan'}!A1:Z10000`,
  ];

  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    body: JSON.stringify({ ranges: rangesToClear }),
  });

  // Write new values
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    })
  });

  const nowString = new Date().toLocaleString('vi-VN');
  saveSyncConfig({ lastSync: nowString });
}

/**
 * Imports tasks and support data from Google Sheets back into application local storage
 */
export async function importFromGoogleSheets(): Promise<{
  tasks: TaskNQ57[];
  categories: CustomCategory[];
  accounts: UserAccount[];
}> {
  const config = loadSyncConfig();
  const spreadsheetId = config.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error('Chưa thiết lập Mã Google Spreadsheet trong Cấu hình hệ thống.');
  }

  await ensureSpreadsheetTabs(spreadsheetId);

  // Read all ranges dynamically based on existing sheets
  const meta = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  const sheets = meta.sheets || [];
  const existingTitles: string[] = sheets.map((s: any) => s.properties?.title || '');

  const taskSheetTitle = existingTitles.includes('01_Nhiem_Vu_NQ57')
    ? '01_Nhiem_Vu_NQ57'
    : existingTitles.includes('Nhiem_Vu_NQ57')
      ? 'Nhiem_Vu_NQ57'
      : 'Nhiem_Vu';

  const mcSheetTitle = existingTitles.includes('05_Minh_Chung_File')
    ? '05_Minh_Chung_File'
    : 'Minh_Chung';

  const accSheetTitle = existingTitles.includes('04_Tai_Khoan_Nguoi_Dung')
    ? '04_Tai_Khoan_Nguoi_Dung'
    : 'Tai_Khoan';

  const ranges = [
    `${taskSheetTitle}!A1:R2000`,
    existingTitles.includes(mcSheetTitle) ? `${mcSheetTitle}!A1:H2000` : 'Minh_Chung!A1:H2000',
    existingTitles.includes('DanhMuc') ? 'DanhMuc!A1:D500' : '02_Nhom_Ke_Hoach!A1:D500',
    existingTitles.includes('Checklist') ? 'Checklist!A1:D5000' : '06_Nhat_Ky_Audit_Log!A1:D5000',
    existingTitles.includes('Binh_Luan') ? 'Binh_Luan!A1:F5000' : '07_Chi_Dao_Va_Binh_Luan!A1:F5000',
    `${accSheetTitle}!A1:E500`
  ];

  const response = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges.map(r => encodeURIComponent(r)).join('&')}`
  );

  const valueRanges = response.valueRanges || [];
  const taskValues = valueRanges[0]?.values || [];
  const mcValues = valueRanges[1]?.values || [];
  const catValues = valueRanges[2]?.values || [];
  const clValues = valueRanges[3]?.values || [];
  const blValues = valueRanges[4]?.values || [];
  const accValues = valueRanges[5]?.values || [];

  // Parse Custom Categories
  const categories: CustomCategory[] = [];
  if (catValues.length > 1) {
    for (let i = 1; i < catValues.length; i++) {
      const row = catValues[i];
      if (row[0]) {
        categories.push({
          id: row[0],
          name: row[1] || 'Danh mục chưa đặt tên',
          color: row[2] || 'blue',
          description: row[3] || '',
        });
      }
    }
  }

  // Parse evidence files
  const evidenceMap: Record<string, EvidenceFile[]> = {};
  if (mcValues.length > 1) {
    for (let i = 1; i < mcValues.length; i++) {
      const row = mcValues[i];
      const taskId = row[0];
      if (taskId) {
        if (!evidenceMap[taskId]) evidenceMap[taskId] = [];
        evidenceMap[taskId].push({
          id: row[1] || `file_${Date.now()}_${i}`,
          name: row[2] || 'tailieu_minh_chung.pdf',
          size: Number(row[3]) || 0,
          mimeType: row[4] || 'application/pdf',
          uploadDate: row[5] || new Date().toISOString(),
          uploadedBy: row[6] || 'Quản trị viên',
          driveUrl: row[7] || '',
          driveFolder: 'Google_Drive/HVU_NQ57/',
        });
      }
    }
  }

  // Parse Checklist items
  const checklistMap: Record<string, any[]> = {};
  if (clValues.length > 1) {
    for (let i = 1; i < clValues.length; i++) {
      const row = clValues[i];
      const taskId = row[0];
      if (taskId) {
        if (!checklistMap[taskId]) checklistMap[taskId] = [];
        checklistMap[taskId].push({
          id: row[1] || `cl_${Date.now()}_${i}`,
          title: row[2] || '',
          completed: row[3] === 'TRUE',
        });
      }
    }
  }

  // Parse Comments
  const commentMap: Record<string, any[]> = {};
  if (blValues.length > 1) {
    for (let i = 1; i < blValues.length; i++) {
      const row = blValues[i];
      const taskId = row[0];
      if (taskId) {
        if (!commentMap[taskId]) commentMap[taskId] = [];
        commentMap[taskId].push({
          id: row[1] || `comm_${Date.now()}_${i}`,
          author: row[2] || 'Thành viên',
          role: row[3] || 'Don_Vi',
          content: row[4] || '',
          createdAt: row[5] || new Date().toISOString(),
        });
      }
    }
  }

  // Parse Tasks NQ57 - Check header for GAS vs web format
  const tasks: TaskNQ57[] = [];
  if (taskValues.length > 1) {
    const header = taskValues[0] || [];
    const isGasLayout = header.includes('Thoi_han_Chuan') || header.includes('Ma_NV');

    for (let i = 1; i < taskValues.length; i++) {
      const row = taskValues[i];
      const id = row[0];
      if (id) {
        if (isGasLayout) {
          tasks.push({
            id,
            nhomKeHoach: row[1] || '',
            tenNhiemVu: row[2] || '',
            donViChuTri: row[3] || '',
            donViPhoiHop: row[4] || '',
            sanPhamDauRa: row[5] || '',
            thoiHan: row[7] || row[6] || '',
            trangThai: (row[8] || 'Chưa thực hiện') as any,
            mucDoUuTien: (row[9] || 'Trung bình') as any,
            tiendo: Number(row[10]) || 0,
            nguoiPhuTrach: row[11] || '',
            linkMinhChung: row[12] || '',
            ghiChuNoiBo: row[13] || '',
            yKienChiDao: row[14] || '',
            ngayCapNhat: row[15] || new Date().toISOString(),
            filesMinhChung: evidenceMap[id] || [],
            checklist: checklistMap[id] || [],
            comments: commentMap[id] || [],
            approvalStatus: (evidenceMap[id] && evidenceMap[id].length > 0) ? 'Cho_Duyet' : 'Chua_Nop'
          });
        } else {
          tasks.push({
            id,
            nhomKeHoach: row[1] || '',
            tenNhiemVu: row[2] || '',
            donViChuTri: row[3] || '',
            donViPhoiHop: row[4] || '',
            sanPhamDauRa: row[5] || '',
            ngayBatDau: row[6] || undefined,
            thoiHan: row[7] || '',
            trangThai: row[8] as any,
            nguoiPhuTrach: row[9] || '',
            tiendo: Number(row[10]) || 0,
            mucDoUuTien: row[11] as any,
            category: row[12] || undefined,
            milestone: row[13] || undefined,
            nguoiGiaoViec: row[14] || '',
            yKienChiDao: row[15] || '',
            ghiChuNoiBo: row[16] || '',
            ngayCapNhat: row[17] || new Date().toISOString(),
            filesMinhChung: evidenceMap[id] || [],
            checklist: checklistMap[id] || [],
            comments: commentMap[id] || [],
            approvalStatus: (evidenceMap[id] && evidenceMap[id].length > 0) ? 'Cho_Duyet' : 'Chua_Nop'
          });
        }
      }
    }
  }

  // Parse User Accounts
  const accounts: UserAccount[] = [];
  if (accValues.length > 1) {
    for (let i = 1; i < accValues.length; i++) {
      const row = accValues[i];
      if (row[0]) {
        accounts.push({
          email: String(row[0]).trim(),
          hoTen: String(row[1] || '').trim(),
          donVi: String(row[2] || '').trim(),
          vaiTro: (row[3] || 'Don_Vi') as any,
          avatar: row[4] || '👤',
        });
      }
    }
    if (accounts.length > 0) {
      saveAccountsToStorage(accounts);
    }
  }

  const nowString = new Date().toLocaleString('vi-VN');
  saveSyncConfig({ lastSync: nowString });

  return { tasks, categories, accounts };
}

/**
 * Finds or creates a task-specific subfolder within the root Google Drive folder
 */
export async function getOrCreateTaskFolder(
  parentFolderId: string,
  folderName: string
): Promise<string> {
  try {
    // Search for existing folder with same name inside parent
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`;
    const searchRes = await googleFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`
    );

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0].id;
    }

    // Create new subfolder if not found
    const createRes = await googleFetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    });

    return createRes.id;
  } catch (error) {
    console.warn('Could not create/find task subfolder on Drive, falling back to parent folder:', error);
    return parentFolderId;
  }
}

/**
 * Uploads a file (evidence) directly into the user's Google Drive folder
 * Optionally creates a subfolder per task and standardizes the file name
 */
export async function uploadFileToGoogleDrive(
  file: File,
  folderId?: string,
  customFileName?: string,
  subfolderName?: string
): Promise<{ driveUrl: string; fileId: string; folderId: string }> {
  const config = loadSyncConfig();
  const rootFolderId = folderId || config.driveFolderId;

  if (!rootFolderId) {
    throw new Error('Chưa thiết lập thư mục lưu trữ Google Drive trong cấu hình hệ thống.');
  }

  // Determine target folder (either task subfolder or root folder)
  let targetFolderId = rootFolderId;
  if (subfolderName) {
    targetFolderId = await getOrCreateTaskFolder(rootFolderId, subfolderName);
  }

  const fileName = customFileName || file.name;

  const metadata = {
    name: fileName,
    parents: [targetFolderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await googleFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        // multipart content types let fetch calculate the boundaries automatically
      },
      body: form,
    }
  );

  return {
    driveUrl: response.webViewLink || `https://drive.google.com/file/d/${response.id}/view`,
    fileId: response.id,
    folderId: targetFolderId,
  };
}

