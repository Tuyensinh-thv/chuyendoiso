<?php
/**
 * Migration Script: Di chuyển toàn bộ file minh chứng từ Supabase Base64 lên Google Drive
 * Thư mục đích: 0AF8hu-TYNSosUk9PVA / 3. MINH CHUNG (1f-ZLlT550pj_GbJb9zjMeA176EZN882I)
 */

declare(strict_types=1);

echo "=================================================================\n";
echo "🚀 BẮT ĐẦU DI CHUYỂN FILE MINH CHỨNG SANG GOOGLE DRIVE\n";
echo "=================================================================\n\n";

$saFile = dirname(__DIR__) . '/api/service_account.json';
if (!file_exists($saFile)) {
    die("❌ Không tìm thấy file service_account.json tại {$saFile}\n");
}
$sa = json_decode(file_get_contents($saFile), true);

$supabaseUrl = 'https://whzzmrjoztjcllxmaztk.supabase.co';
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoenptcmpvenRqY2xseG1henRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTI5NjksImV4cCI6MjEwNDQ4ODk2OX0.nnPYuVeLo5ImuDdJeSOGrczwsluXOJ_BqMAo3Zj3Wws';

// Thư mục cha đích trên Google Drive: "3. MINH CHUNG"
$minhChungRootFolderId = '1f-ZLlT550pj_GbJb9zjMeA176EZN882I';

// Thư mục sao lưu cục bộ
$backupDir = dirname(__DIR__) . '/backups/evidence_' . date('Ymd_His');
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}
echo "📁 Thư mục backup cục bộ: {$backupDir}\n\n";

// -------------------------------------------------------------
// 1. Google Service Account JWT & Token Functions
// -------------------------------------------------------------
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function getGoogleAccessToken(array $sa): string {
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
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($res, true);
    if (empty($data['access_token'])) {
        throw new Exception("Không lấy được Google Access Token: " . ($res ?: 'cURL fail'));
    }
    return $data['access_token'];
}

$googleToken = getGoogleAccessToken($sa);
echo "✅ Kết nối Google Drive API thành công!\n";

// -------------------------------------------------------------
// 2. Google Drive Helper Functions
// -------------------------------------------------------------
$folderCache = [];

function getOrCreateDriveFolder(string $folderName, string $parentFolderId, string $token): array {
    global $folderCache;
    $cacheKey = "{$parentFolderId}:{$folderName}";
    if (isset($folderCache[$cacheKey])) {
        return $folderCache[$cacheKey];
    }
    
    // Tìm folder đã tồn tại chưa
    $escapedName = str_replace("'", "\\'", $folderName);
    $query = urlencode("'{$parentFolderId}' in parents and name = '{$escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    $url = "https://www.googleapis.com/drive/v3/files?q={$query}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true";
    
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
        $folderInfo = [
            'id' => $data['files'][0]['id'],
            'webViewLink' => $data['files'][0]['webViewLink'] ?? "https://drive.google.com/drive/folders/{$data['files'][0]['id']}",
        ];
        $folderCache[$cacheKey] = $folderInfo;
        return $folderInfo;
    }
    
    // Chưa có thì tạo mới
    $createUrl = "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true";
    $body = json_encode([
        'name' => $folderName,
        'mimeType' => 'application/vnd.google-apps.folder',
        'parents' => [$parentFolderId],
    ]);
    
    $ch = curl_init($createUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
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
    
    if (empty($created['id'])) {
        throw new Exception("Không thể tạo folder '{$folderName}' trên Drive: {$res}");
    }
    
    $folderInfo = [
        'id' => $created['id'],
        'webViewLink' => $created['webViewLink'] ?? "https://drive.google.com/drive/folders/{$created['id']}",
    ];
    $folderCache[$cacheKey] = $folderInfo;
    return $folderInfo;
}

function uploadFileToDrive(string $fileName, string $mimeType, string $fileContent, string $parentFolderId, string $token): array {
    $boundary = '-------314159265358979323846';
    $delimiter = "\r\n--" . $boundary . "\r\n";
    $closeDelim = "\r\n--" . $boundary . "--";
    
    $metadata = [
        'name' => $fileName,
        'parents' => [$parentFolderId],
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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($res, true);
    if ($httpCode !== 200 || empty($data['id'])) {
        throw new Exception("Lỗi upload file {$fileName} lên Drive (HTTP {$httpCode}): {$res}");
    }
    
    // Cấp quyền reader cho bất kỳ ai có link (anyone with link)
    $permUrl = "https://www.googleapis.com/drive/v3/files/{$data['id']}/permissions?supportsAllDrives=true";
    $permBody = json_encode([
        'role' => 'reader',
        'type' => 'anyone',
    ]);
    $ch = curl_init($permUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $permBody,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$token}",
            "Content-Type: application/json",
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    curl_exec($ch);
    curl_close($ch);
    
    return [
        'id' => $data['id'],
        'webViewLink' => $data['webViewLink'] ?? "https://drive.google.com/file/d/{$data['id']}/view",
        'webContentLink' => $data['webContentLink'] ?? "https://drive.google.com/uc?export=download&id={$data['id']}",
        'size' => (int)($data['size'] ?? strlen($fileContent)),
    ];
}

function getMimeTypeFromFilename(string $fileName): string {
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    return match($ext) {
        'pdf' => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc' => 'application/msword',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls' => 'application/vnd.ms-excel',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'zip' => 'application/zip',
        default => 'application/octet-stream',
    };
}

// -------------------------------------------------------------
// 3. Tải Danh Sách Nhiệm Vụ từ Supabase
// -------------------------------------------------------------
$fetchUrl = "{$supabaseUrl}/rest/v1/tasks?select=id,ten_nhiem_vu,link_minh_chung,files_minh_chung&order=id.asc";
$ch = curl_init($fetchUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "apikey: {$anonKey}",
        "Authorization: Bearer {$anonKey}",
    ],
    CURLOPT_SSL_VERIFYPEER => true,
]);
$fetchRes = curl_exec($ch);
curl_close($ch);

$tasks = json_decode($fetchRes, true);
if (!is_array($tasks)) {
    die("❌ Không thể tải danh sách tasks từ Supabase: {$fetchRes}\n");
}

echo "📋 Đã tải " . count($tasks) . " nhiệm vụ từ Supabase\n";

// Lọc các task có file minh chứng
$tasksToMigrate = [];
foreach ($tasks as $t) {
    $files = is_array($t['files_minh_chung']) ? $t['files_minh_chung'] : (json_decode($t['files_minh_chung'] ?? '[]', true) ?: []);
    if (!empty($files)) {
        $tasksToMigrate[] = [
            'task' => $t,
            'files' => $files,
        ];
    }
}

echo "🔹 Tìm thấy " . count($tasksToMigrate) . " nhiệm vụ cần di chuyển minh chứng\n\n";

// -------------------------------------------------------------
// 4. Tiến Hành Di Chuyển Từng File
// -------------------------------------------------------------
$totalFilesProcessed = 0;
$totalFilesSuccess = 0;
$totalFilesFailed = 0;
$migrationReport = [];

foreach ($tasksToMigrate as $item) {
    $t = $item['task'];
    $taskId = $t['id'];
    $taskName = $t['ten_nhiem_vu'];
    $files = $item['files'];
    
    echo "-----------------------------------------------------------------\n";
    echo "📌 Đang xử lý [{$taskId}] " . mb_substr($taskName, 0, 50) . "...\n";
    
    // Xác định tên thư mục nhiệm vụ trên Drive
    // Lấy từ driveFolder của file đầu tiên hoặc tự tạo
    $subFolderName = "{$taskId}_MinhChung";
    if (!empty($files[0]['driveFolder'])) {
        $parts = explode('/', $files[0]['driveFolder']);
        $lastPart = end($parts);
        if (!empty($lastPart)) {
            $subFolderName = $lastPart;
        }
    }
    
    try {
        $folderInfo = getOrCreateDriveFolder($subFolderName, $minhChungRootFolderId, $googleToken);
        $taskFolderId = $folderInfo['id'];
        $taskFolderLink = $folderInfo['webViewLink'];
        echo "   📁 Thư mục Drive: {$subFolderName} (ID: {$taskFolderId})\n";
    } catch (Exception $e) {
        echo "   ❌ Lỗi tạo thư mục Drive cho [{$taskId}]: " . $e->getMessage() . "\n";
        continue;
    }
    
    $updatedFiles = [];
    $taskBackupDir = "{$backupDir}/{$taskId}";
    if (!is_dir($taskBackupDir)) {
        mkdir($taskBackupDir, 0777, true);
    }
    
    foreach ($files as $fIdx => $f) {
        $totalFilesProcessed++;
        $fileName = $f['name'] ?? "file_{$fIdx}.bin";
        $fileData = $f['fileData'] ?? '';
        
        echo "   📄 [{$totalFilesProcessed}/28] {$fileName}...\n";
        
        if (empty($fileData)) {
            echo "      ⚠️ Không có Base64 fileData, giữ nguyên bản ghi\n";
            $updatedFiles[] = $f;
            continue;
        }
        
        // Tách header base64 (data:application/pdf;base64,...)
        if (strpos($fileData, 'base64,') !== false) {
            $parts = explode('base64,', $fileData, 2);
            $rawBase64 = $parts[1];
        } else {
            $rawBase64 = $fileData;
        }
        
        $binaryContent = base64_decode($rawBase64);
        if ($binaryContent === false || strlen($binaryContent) === 0) {
            echo "      ❌ Lỗi giải mã Base64 cho {$fileName}\n";
            $totalFilesFailed++;
            $updatedFiles[] = $f;
            continue;
        }
        
        // 1. Lưu backup cục bộ
        $backupFilePath = "{$taskBackupDir}/{$fileName}";
        file_put_contents($backupFilePath, $binaryContent);
        
        // 2. Xác định MIME type
        $mimeType = getMimeTypeFromFilename($fileName);
        
        // 3. Upload lên Google Drive
        try {
            $driveResult = uploadFileToDrive($fileName, $mimeType, $binaryContent, $taskFolderId, $googleToken);
            $totalFilesSuccess++;
            echo "      ✅ Đã upload Drive! File ID: {$driveResult['id']}\n";
            echo "         Link: {$driveResult['webViewLink']}\n";
            
            // 4. Tạo bản ghi đã cập nhật
            // Xóa fileData base64 để giải phóng dung lượng CSDL như kế hoạch đã duyệt
            $updatedFiles[] = [
                'name' => $fileName,
                'size' => strlen($binaryContent),
                'driveUrl' => $driveResult['webViewLink'],
                'driveFolder' => "Google_Drive/HVU_NQ57/{$subFolderName}",
                'driveFolderUrl' => $taskFolderLink,
                'fileId' => $driveResult['id'],
                'source' => 'google_drive',
                'migratedAt' => date('c'),
            ];
            
            $migrationReport[] = [
                'taskId' => $taskId,
                'fileName' => $fileName,
                'sizeBytes' => strlen($binaryContent),
                'driveFileId' => $driveResult['id'],
                'driveUrl' => $driveResult['webViewLink'],
                'driveFolder' => $subFolderName,
                'status' => 'SUCCESS',
            ];
        } catch (Exception $e) {
            echo "      ❌ Lỗi upload Drive: " . $e->getMessage() . "\n";
            $totalFilesFailed++;
            $updatedFiles[] = $f; // Giữ lại nguyên gốc
            
            $migrationReport[] = [
                'taskId' => $taskId,
                'fileName' => $fileName,
                'error' => $e->getMessage(),
                'status' => 'FAILED',
            ];
        }
    }
    
    // 5. Cập nhật Supabase cho Task này
    $updatePayload = [
        'files_minh_chung' => $updatedFiles,
        'link_minh_chung' => $taskFolderLink, // Cập nhật link thư mục nhiệm vụ
    ];
    
    $patchUrl = "{$supabaseUrl}/rest/v1/tasks?id=eq.{$taskId}";
    $ch = curl_init($patchUrl);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode($updatePayload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$anonKey}",
            "Authorization: Bearer {$anonKey}",
            "Content-Type: application/json",
            "Prefer: return=minimal",
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $patchRes = curl_exec($ch);
    $patchCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($patchCode >= 200 && $patchCode < 300) {
        echo "   💾 Đã đồng bộ thành công vào CSDL Supabase cho [{$taskId}] (HTTP {$patchCode})\n";
    } else {
        echo "   ⚠️ Cảnh báo cập nhật Supabase [{$taskId}] thất bại (HTTP {$patchCode}): {$patchRes}\n";
    }
}

// -------------------------------------------------------------
// 5. Tổng Kết & Ghi Báo Cáo
// -------------------------------------------------------------
$reportFile = "{$backupDir}/migration_report.json";
file_put_contents($reportFile, json_encode([
    'migratedAt' => date('c'),
    'totalProcessed' => $totalFilesProcessed,
    'totalSuccess' => $totalFilesSuccess,
    'totalFailed' => $totalFilesFailed,
    'details' => $migrationReport,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "\n=================================================================\n";
echo "🏁 HOÀN TẤT QUÁ TRÌNH DI CHUYỂN\n";
echo "=================================================================\n";
echo "📊 Tổng file đã xử lý: {$totalFilesProcessed}\n";
echo "✅ Thành công:         {$totalFilesSuccess}\n";
echo "❌ Thất bại:           {$totalFilesFailed}\n";
echo "📁 Báo cáo chi tiết:   {$reportFile}\n";
echo "=================================================================\n";
