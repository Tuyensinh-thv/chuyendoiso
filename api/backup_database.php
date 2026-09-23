<?php
/**
 * Backend API: Quản lý Sao lưu & Khôi phục CSDL Supabase
 * Dự án: Cổng Điều Hành Chuyển Đổi Số - Trường ĐH Hùng Vương (NQ57)
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$backupDir = dirname(__DIR__) . '/backups/db';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

$historyFile = $backupDir . '/backup_history.json';
$possibleSaPaths = [
    __DIR__ . '/service_account.json',
    __DIR__ . '/service_account.json.json',
];
$saFile = null;
foreach ($possibleSaPaths as $p) {
    if (file_exists($p)) {
        $saFile = $p;
        break;
    }
}
$saFile = $saFile ?? (__DIR__ . '/service_account.json');

// Cấu hình Supabase (ưu tiên từ file .env nếu có)
$supabaseUrl = 'https://whzzmrjoztjcllxmaztk.supabase.co';
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoenptcmpvenRqY2xseG1henRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTI5NjksImV4cCI6MjEwNDQ4ODk2OX0.nnPYuVeLo5ImuDdJeSOGrczwsluXOJ_BqMAo3Zj3Wws';

$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    if (preg_match('/VITE_SUPABASE_URL\s*=\s*(.+)/', $envContent, $m)) {
        $supabaseUrl = trim($m[1], " \t\n\r\0\x0B\"'");
    }
    if (preg_match('/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/', $envContent, $m)) {
        $anonKey = trim($m[1], " \t\n\r\0\x0B\"'");
    }
}

// Thư mục lưu trữ trên Google Drive: "5. KHO DU LIEU" (hoặc folder con Sao_Luu_CSDL)
$parentDriveFolderId = '1vLq09Gbx3cRxHrYYnYiuVX2da70mtB_G';

$tablesToBackup = [
    'tasks',
    'task_subtasks',
    'departments',
    'plan_groups',
    'custom_categories',
    'user_accounts',
    'audit_logs',
];

// Helper: JWT Google Drive
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function getGoogleAccessToken(array $sa): ?string {
    if (empty($sa['client_email']) || empty($sa['private_key'])) return null;
    $now = time();
    $header  = base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode([
        'iss'   => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/drive',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));
    $sig = '';
    openssl_sign("$header.$payload", $sig, $sa['private_key'], OPENSSL_ALGO_SHA256);
    $jwt = "$header.$payload." . base64url_encode($sig);
    
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($res, true);
    return $data['access_token'] ?? null;
}

function getOrCreateBackupDriveFolder(string $token, string $parentId): ?string {
    $folderName = 'Sao_Luu_CSDL';
    $escaped = str_replace("'", "\\'", $folderName);
    $query = urlencode("'{$parentId}' in parents and name = '{$escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    $url = "https://www.googleapis.com/drive/v3/files?q={$query}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true";
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($res, true);
    if (!empty($data['files'][0]['id'])) {
        return $data['files'][0]['id'];
    }
    
    // Tạo folder mới
    $createUrl = "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true";
    $ch = curl_init($createUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$token}",
            "Content-Type: application/json",
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $created = json_decode($res, true);
    return $created['id'] ?? $parentId;
}

function uploadBackupToDrive(string $filePath, string $fileName, string $folderId, string $token): ?array {
    $fileContent = file_get_contents($filePath);
    $mimeType = str_ends_with($fileName, '.json') ? 'application/json' : 'text/plain';
    $boundary = '-------' . md5((string)time());
    $delimiter = "\r\n--" . $boundary . "\r\n";
    $closeDelim = "\r\n--" . $boundary . "--";
    
    $metadata = [
        'name' => $fileName,
        'parents' => [$folderId],
    ];
    
    $multipartBody = $delimiter;
    $multipartBody .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    $multipartBody .= json_encode($metadata);
    $multipartBody .= $delimiter;
    $multipartBody .= "Content-Type: {$mimeType}\r\n\r\n";
    $multipartBody .= $fileContent;
    $multipartBody .= $closeDelim;
    
    $url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size";
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $multipartBody,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$token}",
            "Content-Type: multipart/related; boundary={$boundary}",
            "Content-Length: " . strlen($multipartBody),
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($res, true);
    
    if (empty($data['id'])) return null;
    
    // Set permission
    $permUrl = "https://www.googleapis.com/drive/v3/files/{$data['id']}/permissions?supportsAllDrives=true";
    $ch = curl_init($permUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['role' => 'reader', 'type' => 'anyone']),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}", "Content-Type: application/json"],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    curl_exec($ch);
    curl_close($ch);
    
    return [
        'fileId' => $data['id'],
        'webViewLink' => $data['webViewLink'] ?? "https://drive.google.com/file/d/{$data['id']}/view",
    ];
}

// Lấy danh sách bảng từ Supabase
function fetchTableData(string $tableName, string $supabaseUrl, string $anonKey): array {
    $url = "{$supabaseUrl}/rest/v1/{$tableName}?select=*&limit=5000";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$anonKey}",
            "Authorization: Bearer {$anonKey}",
            "Content-Type: application/json",
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($res, true);
    return is_array($data) ? $data : [];
}

// Xử lý các action
$action = $_REQUEST['action'] ?? 'list';

// ─── ACTION: DOWNLOAD ────────────────────────────────────────────────────────
if ($action === 'download') {
    $file = basename($_GET['file'] ?? '');
    $filePath = $backupDir . '/' . $file;
    if (!file_exists($filePath)) {
        http_response_code(404);
        die("File không tồn tại.");
    }
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $file . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// ─── ACTION: LIST ────────────────────────────────────────────────────────────
if ($action === 'list') {
    $files = glob("{$backupDir}/HVU_NQ57_Backup_*.*") ?: [];
    $backups = [];
    $totalSize = 0;
    
    // Đọc history
    $history = file_exists($historyFile) ? (json_decode(file_get_contents($historyFile), true) ?: []) : [];
    $historyMap = [];
    foreach ($history as $h) {
        if (!empty($h['filename'])) {
            $historyMap[$h['filename']] = $h;
        }
    }
    
    foreach ($files as $f) {
        $name = basename($f);
        $size = filesize($f);
        $totalSize += $size;
        $mtime = filemtime($f);
        $hInfo = $historyMap[$name] ?? [];
        
        $backups[] = [
            'filename' => $name,
            'sizeBytes' => $size,
            'sizeFormatted' => round($size / 1024, 1) . ' KB',
            'createdAt' => date('c', $mtime),
            'format' => str_ends_with($name, '.json') ? 'JSON' : 'SQL',
            'driveUrl' => $hInfo['driveUrl'] ?? null,
            'driveFileId' => $hInfo['driveFileId'] ?? null,
            'status' => 'READY',
        ];
    }
    
    usort($backups, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
    
    // Kiểm tra Drive token
    $saExists = file_exists($saFile);
    
    echo json_encode([
        'success' => true,
        'backups' => $backups,
        'stats' => [
            'totalBackups' => count($backups),
            'totalSizeBytes' => $totalSize,
            'totalSizeFormatted' => round($totalSize / 1048576, 2) . ' MB',
            'driveConnected' => $saExists,
            'lastBackup' => $backups[0]['createdAt'] ?? null,
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ─── ACTION: CREATE ──────────────────────────────────────────────────────────
if ($action === 'create') {
    $logs = [];
    $logs[] = "[INFO] Khởi động tiến trình sao lưu CSDL...";
    
    $format = strtolower($_REQUEST['format'] ?? 'all'); // 'sql', 'json', 'all'
    $timestamp = date('Ymd_His');
    $createdFiles = [];
    $driveLinks = [];
    
    $dumpData = [
        'metadata' => [
            'system' => 'HVU_CHUYENDOI_SO_NQ57',
            'version' => '1.0.0',
            'createdAt' => date('c'),
            'creator' => $_REQUEST['creator'] ?? 'Hệ thống Quản trị',
        ],
        'tables' => [],
    ];
    
    // 1. Trích xuất dữ liệu từ Supabase
    $logs[] = "[INFO] Đang trích xuất 7 bảng dữ liệu từ Supabase...";
    $totalRows = 0;
    foreach ($tablesToBackup as $table) {
        $rows = fetchTableData($table, $supabaseUrl, $anonKey);
        $dumpData['tables'][$table] = $rows;
        $count = count($rows);
        $totalRows += $count;
        $logs[] = "  ├─ Bảng [{$table}]: {$count} dòng";
    }
    $logs[] = "[SUCCESS] Đã trích xuất tổng cộng {$totalRows} dòng dữ liệu.";
    
    // 2. Tạo file JSON
    if ($format === 'json' || $format === 'all') {
        $jsonFileName = "HVU_NQ57_Backup_{$timestamp}.json";
        $jsonFilePath = "{$backupDir}/{$jsonFileName}";
        file_put_contents($jsonFilePath, json_encode($dumpData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $createdFiles[] = $jsonFileName;
        $logs[] = "[INFO] Đã tạo file JSON: {$jsonFileName} (" . round(filesize($jsonFilePath) / 1024, 1) . " KB)";
    }
    
    // 3. Tạo file SQL
    if ($format === 'sql' || $format === 'all') {
        $sqlFileName = "HVU_NQ57_Backup_{$timestamp}.sql";
        $sqlFilePath = "{$backupDir}/{$sqlFileName}";
        
        $sqlContent = "-- ====================================================================\n";
        $sqlContent .= "-- BẢN SAO LƯU CSDL HỆ THỐNG CHUYỂN ĐỔI SỐ NQ57 - ĐẠI HỌC HÙNG VƯƠNG\n";
        $sqlContent .= "-- Ngày tạo: " . date('d/m/Y H:i:s') . "\n";
        $sqlContent .= "-- Tổng số dòng: {$totalRows}\n";
        $sqlContent .= "-- ====================================================================\n\n";
        $sqlContent .= "BEGIN;\n\n";
        
        foreach ($dumpData['tables'] as $table => $rows) {
            if (empty($rows)) continue;
            $sqlContent .= "-- Bảng: {$table}\n";
            $sqlContent .= "DELETE FROM public.{$table};\n";
            
            $firstRow = $rows[0];
            $cols = array_keys($firstRow);
            $colsEscaped = implode(', ', array_map(fn($c) => '"' . $c . '"', $cols));
            
            foreach ($rows as $row) {
                $values = [];
                foreach ($cols as $col) {
                    $val = $row[$col] ?? null;
                    if ($val === null) {
                        $values[] = 'NULL';
                    } elseif (is_bool($val)) {
                        $values[] = $val ? 'TRUE' : 'FALSE';
                    } elseif (is_numeric($val) && !is_string($val)) {
                        $values[] = $val;
                    } elseif (is_array($val)) {
                        $escapedJson = str_replace("'", "''", json_encode($val, JSON_UNESCAPED_UNICODE));
                        $values[] = "'" . $escapedJson . "'::jsonb";
                    } else {
                        $escapedVal = str_replace("'", "''", (string)$val);
                        $values[] = "'" . $escapedVal . "'";
                    }
                }
                $sqlContent .= "INSERT INTO public.{$table} ({$colsEscaped}) VALUES (" . implode(', ', $values) . ");\n";
            }
            $sqlContent .= "\n";
        }
        $sqlContent .= "COMMIT;\n";
        
        file_put_contents($sqlFilePath, $sqlContent);
        $createdFiles[] = $sqlFileName;
        $logs[] = "[INFO] Đã tạo file SQL: {$sqlFileName} (" . round(filesize($sqlFilePath) / 1024, 1) . " KB)";
    }
    
    // 4. Đồng bộ Google Drive
    if (file_exists($saFile)) {
        $sa = json_decode(file_get_contents($saFile), true);
        $token = getGoogleAccessToken($sa);
        if ($token) {
            $logs[] = "[INFO] Kết nối Google Drive thành công, đang tải file lên...";
            $backupDriveFolderId = getOrCreateBackupDriveFolder($token, $parentDriveFolderId);
            
            foreach ($createdFiles as $cFile) {
                $cPath = "{$backupDir}/{$cFile}";
                $driveRes = uploadBackupToDrive($cPath, $cFile, $backupDriveFolderId, $token);
                if ($driveRes) {
                    $driveLinks[$cFile] = $driveRes;
                    $logs[] = "[SUCCESS] Đã đồng bộ lên Drive: {$cFile}";
                    $logs[] = "  └─ Link: {$driveRes['webViewLink']}";
                }
            }
        } else {
            $logs[] = "[WARNING] Không thể lấy Google Access Token, bỏ qua tải lên Drive.";
        }
    } else {
        $logs[] = "[INFO] Chưa có service_account.json, lưu cục bộ an toàn.";
    }
    
    // 5. Cập nhật lịch sử
    $history = file_exists($historyFile) ? (json_decode(file_get_contents($historyFile), true) ?: []) : [];
    foreach ($createdFiles as $cFile) {
        $history[] = [
            'filename' => $cFile,
            'createdAt' => date('c'),
            'sizeBytes' => filesize("{$backupDir}/{$cFile}"),
            'driveUrl' => $driveLinks[$cFile]['webViewLink'] ?? null,
            'driveFileId' => $driveLinks[$cFile]['fileId'] ?? null,
        ];
    }
    file_put_contents($historyFile, json_encode($history, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    
    $logs[] = "[SUCCESS] Quá trình sao lưu hoàn tất 100%!";
    
    echo json_encode([
        'success' => true,
        'message' => 'Sao lưu CSDL thành công!',
        'files' => $createdFiles,
        'driveLinks' => $driveLinks,
        'logs' => $logs,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── ACTION: DELETE ──────────────────────────────────────────────────────────
if ($action === 'delete') {
    $file = basename($_POST['file'] ?? $_GET['file'] ?? '');
    $filePath = $backupDir . '/' . $file;
    if ($file && file_exists($filePath)) {
        unlink($filePath);
        echo json_encode(['success' => true, 'message' => "Đã xóa bản sao lưu {$file}"]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'File không tồn tại.']);
    }
    exit;
}

// ─── ACTION: RESTORE ─────────────────────────────────────────────────────────
if ($action === 'restore') {
    $logs = [];
    $logs[] = "[INFO] Bắt đầu quy trình khôi phục CSDL...";
    
    $file = basename($_POST['file'] ?? '');
    $filePath = $backupDir . '/' . $file;
    
    // Kiểm tra nếu có file upload trực tiếp
    if (!empty($_FILES['backup_file']['tmp_name'])) {
        $uploaded = $_FILES['backup_file'];
        $file = $uploaded['name'];
        $filePath = $uploaded['tmp_name'];
        $logs[] = "[INFO] Khôi phục từ file tải lên: {$file}";
    } elseif (!file_exists($filePath)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Không tìm thấy file {$file}"]);
        exit;
    }
    
    if (str_ends_with($file, '.json')) {
        $jsonContent = file_get_contents($filePath);
        $data = json_decode($jsonContent, true);
        if (empty($data['tables'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Cấu trúc file JSON không hợp lệ.']);
            exit;
        }
        
        $totalRestored = 0;
        foreach ($data['tables'] as $table => $rows) {
            if (!in_array($table, $tablesToBackup) || !is_array($rows)) continue;
            
            // Xóa dữ liệu cũ của bảng qua REST API (hoặc upsert)
            $ch = curl_init("{$supabaseUrl}/rest/v1/{$table}?id=neq.NULL_PLACEHOLDER");
            curl_setopt_array($ch, [
                CURLOPT_CUSTOMREQUEST => 'DELETE',
                CURLOPT_HTTPHEADER => ["apikey: {$anonKey}", "Authorization: Bearer {$anonKey}"],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            curl_exec($ch);
            curl_close($ch);
            
            // Nạp lại từng batch
            if (!empty($rows)) {
                $batchSize = 50;
                $chunks = array_chunk($rows, $batchSize);
                foreach ($chunks as $chunk) {
                    $ch = curl_init("{$supabaseUrl}/rest/v1/{$table}");
                    curl_setopt_array($ch, [
                        CURLOPT_POST => true,
                        CURLOPT_POSTFIELDS => json_encode($chunk),
                        CURLOPT_HTTPHEADER => [
                            "apikey: {$anonKey}",
                            "Authorization: Bearer {$anonKey}",
                            "Content-Type: application/json",
                            "Prefer: resolution=merge-duplicates",
                        ],
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_SSL_VERIFYPEER => true,
                    ]);
                    curl_exec($ch);
                    curl_close($ch);
                }
            }
            $count = count($rows);
            $totalRestored += $count;
            $logs[] = "  └─ Đã khôi phục bảng [{$table}]: {$count} dòng";
        }
        
        $logs[] = "[SUCCESS] Khôi phục thành công tổng cộng {$totalRestored} dòng dữ liệu!";
        echo json_encode(['success' => true, 'message' => 'Khôi phục CSDL thành công!', 'logs' => $logs]);
        exit;
    } else {
        // Hướng dẫn với file SQL
        $logs[] = "[INFO] File định dạng SQL. Hãy mở file và chạy trực tiếp trong Supabase SQL Editor để khôi phục nhanh nhất.";
        echo json_encode([
            'success' => true,
            'message' => 'Với file SQL, bạn có thể tải về và chạy trực tiếp trong SQL Editor của Supabase để khôi phục toàn vẹn.',
            'logs' => $logs,
        ]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Action không hợp lệ']);
