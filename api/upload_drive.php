<?php
/**
 * PHP Bridge: Upload File lên Google Drive
 * Trường Đại học Hùng Vương - Cổng Điều Hành NQ57
 *
 * Không cần Composer, không cần GAS, không cần OAuth popup.
 * Dùng Google Service Account JSON + JWT thuần PHP.
 *
 * CÁCH DÙNG:
 *  1. Tạo Service Account trên Google Cloud Console (xem README bên dưới).
 *  2. Tải file JSON key, đặt tên "service_account.json" vào cùng thư mục này.
 *  3. Share thư mục Drive "0AF8hu-TYNSosUk9PVA" với email service account (Editor).
 *  4. Frontend gọi: POST http://localhost/chuyendoiso/api/upload_drive.php
 */

// ─── CORS cho phép React dev server (localhost:5173) gọi ───────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── CẤU HÌNH & TÌM SERVICE ACCOUNT KEY ───────────────────────────────────────
$possibleSaPaths = [
    __DIR__ . '/service_account.json',
    __DIR__ . '/service_account.json.json',
];
$saPath = null;
foreach ($possibleSaPaths as $p) {
    if (file_exists($p)) {
        $saPath = $p;
        break;
    }
}
define('SERVICE_ACCOUNT_FILE', $saPath ?? (__DIR__ . '/service_account.json'));
define('DEFAULT_DRIVE_FOLDER_ID', '0AF8hu-TYNSosUk9PVA');
define('SCOPES', 'https://www.googleapis.com/auth/drive');
define('MAX_FILE_SIZE_MB', 50);

// ─── ACTION: TEST KẾT NỐI (PING) ─────────────────────────────────────────────
$action = trim($_REQUEST['action'] ?? '');
if ($action === 'test' || $action === 'ping') {
    if (!$saPath || !file_exists($saPath)) {
        echo json_encode([
            'success' => false,
            'error'   => 'Chưa tìm thấy file service_account.json trong thư mục api/.',
            'setup_guide' => getSetupGuide()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $sa = json_decode(file_get_contents($saPath), true);
    if (!$sa || empty($sa['private_key']) || empty($sa['client_email'])) {
        echo json_encode([
            'success' => false,
            'error'   => 'File service_account.json bị thiếu private_key hoặc client_email.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $token = getAccessToken($sa);
    if (!$token) {
        echo json_encode([
            'success' => false,
            'error'   => 'Không tạo được Access Token từ Google. Kiểm tra lại private_key trong service_account.json.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $testFolderId = trim($_REQUEST['driveFolderId'] ?? DEFAULT_DRIVE_FOLDER_ID);
    $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$testFolderId}?supportsAllDrives=true&fields=id,name,capabilities");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$token}"],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $folderData = json_decode($res, true);
    if ($code === 200 && !empty($folderData['id'])) {
        echo json_encode([
            'success'     => true,
            'message'     => 'Kết nối Google Drive thành công 100%!',
            'email'       => $sa['client_email'],
            'projectId'   => $sa['project_id'] ?? '',
            'folderId'    => $folderData['id'],
            'folderName'  => $folderData['name'] ?? 'Thư mục Drive',
            'canAddFiles' => $folderData['capabilities']['canAddChildren'] ?? true,
        ], JSON_UNESCAPED_UNICODE);
    } else {
        $msg = $folderData['error']['message'] ?? "Lỗi truy cập thư mục (HTTP $code)";
        echo json_encode([
            'success' => false,
            'error'   => "Đã xác thực thành công tài khoản {$sa['client_email']}, nhưng không truy cập được thư mục Drive {$testFolderId}: $msg. Hãy chắc chắn bạn đã Share thư mục này với email của Service Account và cấp quyền Editor.",
            'email'   => $sa['client_email']
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Chỉ chấp nhận POST request (hoặc GET ?action=test).']);
    exit;
}

// ─── NHẬN THAM SỐ UPLOAD ──────────────────────────────────────────────────────
$taskId         = trim($_POST['taskId'] ?? '');
$taskTitle      = trim($_POST['taskTitle'] ?? '');
$uploadedBy     = trim($_POST['uploadedBy'] ?? 'Cán bộ HVU');
$docType        = trim($_POST['docType'] ?? 'MC');
$driveFolderId  = trim($_POST['driveFolderId'] ?? DEFAULT_DRIVE_FOLDER_ID);
$customFileName = trim($_POST['fileName'] ?? '');

if (empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Không nhận được file. Hãy gửi form-data với key "file".']);
    exit;
}

$uploadedFile = $_FILES['file'];

// Kiểm tra lỗi upload PHP
if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
    $phpErrors = [1 => 'File quá lớn (php.ini)', 2 => 'File quá lớn (form)', 3 => 'Upload không hoàn chỉnh', 4 => 'Không có file'];
    echo json_encode(['success' => false, 'error' => $phpErrors[$uploadedFile['error']] ?? 'Lỗi upload PHP #' . $uploadedFile['error']]);
    exit;
}

// Kiểm tra dung lượng
$maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
if ($uploadedFile['size'] > $maxBytes) {
    echo json_encode(['success' => false, 'error' => "File quá lớn. Tối đa " . MAX_FILE_SIZE_MB . "MB."]);
    exit;
}

// Tên file cuối cùng (ưu tiên tên đã chuẩn hóa từ frontend)
$finalFileName = $customFileName ?: sanitizeFileName($uploadedFile['name']);

// ─── ĐỌC SERVICE ACCOUNT ─────────────────────────────────────────────────────
if (!$saPath || !file_exists($saPath)) {
    echo json_encode([
        'success' => false,
        'error'   => 'Chưa có file service_account.json trong thư mục api/.',
        'setup_guide' => getSetupGuide()
    ]);
    exit;
}

$sa = json_decode(file_get_contents($saPath), true);
if (!$sa || empty($sa['private_key']) || empty($sa['client_email'])) {
    echo json_encode(['success' => false, 'error' => 'File service_account.json không hợp lệ hoặc bị thiếu trường.']);
    exit;
}

// ─── LẤY ACCESS TOKEN QUA JWT ────────────────────────────────────────────────
$tokenError = null;
$accessToken = getAccessToken($sa, $tokenError);
if (!$accessToken) {
    echo json_encode([
        'success' => false,
        'error'   => $tokenError ?: 'Không thể lấy Access Token từ Google. Kiểm tra lại service_account.json và quyền Drive.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── TẠO HOẶC LẤY THƯ MỤC CON THEO NHIỆM VỤ ─────────────────────────────────
$subfolderName = $taskId;
if ($taskTitle) {
    $cleanTitle = preg_replace('/[^a-zA-Z0-9]/', '', removeVietnamese($taskTitle));
    $subfolderName = $taskId . '_' . substr($cleanTitle, 0, 30);
}

$targetFolderId = getOrCreateFolder($accessToken, $subfolderName, $driveFolderId);
if (!$targetFolderId) {
    // Nếu không tạo được subfolder, dùng thư mục gốc
    $targetFolderId = $driveFolderId;
}

// ─── UPLOAD FILE LÊN DRIVE ───────────────────────────────────────────────────
$mimeType = $uploadedFile['type'] ?: mime_content_type($uploadedFile['tmp_name']) ?: 'application/octet-stream';
$result = uploadFileToDrive($accessToken, $uploadedFile['tmp_name'], $finalFileName, $mimeType, $targetFolderId);

if (!$result['success']) {
    echo json_encode($result);
    exit;
}

$fileId = $result['fileId'];

// Cấp quyền "anyone with link can view"
setPublicPermission($accessToken, $fileId);

$driveUrl    = "https://drive.google.com/file/d/{$fileId}/view";
$downloadUrl = "https://drive.google.com/uc?export=download&id={$fileId}";

// ─── GHI VÀO LOG (tùy chọn, ghi vào file local) ──────────────────────────────
$logEntry = [
    'timestamp'  => date('Y-m-d H:i:s'),
    'taskId'     => $taskId,
    'fileName'   => $finalFileName,
    'fileSize'   => $uploadedFile['size'],
    'uploadedBy' => $uploadedBy,
    'driveUrl'   => $driveUrl,
    'folderId'   => $targetFolderId,
];
$logFile = __DIR__ . '/upload_log.json';
$logs = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
array_unshift($logs, $logEntry);
$logs = array_slice($logs, 0, 500); // Giữ tối đa 500 bản ghi
file_put_contents($logFile, json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// ─── TRẢ KẾT QUẢ ─────────────────────────────────────────────────────────────
echo json_encode([
    'success'     => true,
    'fileId'      => $fileId,
    'driveUrl'    => $driveUrl,
    'downloadUrl' => $downloadUrl,
    'folderId'    => $targetFolderId,
    'folderName'  => $subfolderName,
    'fileName'    => $finalFileName,
    'fileSize'    => $uploadedFile['size'],
]);
exit;


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tạo JWT và đổi lấy OAuth2 Access Token từ Google
 */
function getAccessToken(array $sa, ?string &$errorMsg = null): ?string
{
    $now   = time();
    $claim = [
        'iss'   => $sa['client_email'],
        'scope' => SCOPES,
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ];

    $jwt = buildJwt($claim, $sa['private_key']);
    if (!$jwt) {
        $errorMsg = 'Không thể ký số JWT bằng private key trong service_account.json. Kiểm tra định dạng private key.';
        return null;
    }

    // Thử tối đa 2 lần để tránh gián đoạn do mạng chập chờn
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT        => 20,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            $errorMsg = "Lỗi kết nối máy chủ Google: $curlErr";
            if ($attempt < 2) { sleep(1); continue; }
            return null;
        }

        $data = json_decode($response, true);
        if ($httpCode === 200 && !empty($data['access_token'])) {
            return $data['access_token'];
        }

        $errMsg = $data['error_description'] ?? $data['error'] ?? "HTTP $httpCode: $response";
        $errorMsg = "Google từ chối cấp token: $errMsg";
        if ($attempt < 2) { sleep(1); continue; }
        return null;
    }

    return null;
}

/**
 * Xây dựng JWT (RS256) thuần PHP — không cần thư viện ngoài
 */
function buildJwt(array $claim, string $privateKey): ?string
{
    $header  = base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($claim));
    $data    = "$header.$payload";

    $signature = '';
    $ok = openssl_sign($data, $signature, $privateKey, OPENSSL_ALGO_SHA256);
    if (!$ok) return null;

    return "$data." . base64url_encode($signature);
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Upload file lên Google Drive qua multipart upload
 */
function uploadFileToDrive(string $token, string $tmpPath, string $fileName, string $mimeType, string $folderId): array
{
    $metadata = json_encode([
        'name'    => $fileName,
        'parents' => [$folderId],
    ]);
    $fileContent = file_get_contents($tmpPath);
    $boundary    = 'hvu_nq57_boundary_' . uniqid();

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    $body .= $metadata . "\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$mimeType}\r\n\r\n";
    $body .= $fileContent . "\r\n";
    $body .= "--{$boundary}--";

    $ch = curl_init('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size&supportsAllDrives=true');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer {$token}",
            "Content-Type: multipart/related; boundary={$boundary}",
            'Content-Length: ' . strlen($body),
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 120,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'error' => 'cURL error: ' . $curlError];
    }

    $data = json_decode($response, true);
    if ($httpCode !== 200 || empty($data['id'])) {
        $errMsg = $data['error']['message'] ?? "HTTP $httpCode: $response";
        return ['success' => false, 'error' => 'Drive API lỗi: ' . $errMsg];
    }

    return ['success' => true, 'fileId' => $data['id']];
}

/**
 * Cấp quyền public "anyone with link can view"
 */
function setPublicPermission(string $token, string $fileId): void
{
    $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}/permissions?supportsAllDrives=true");
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => json_encode(['type' => 'anyone', 'role' => 'reader']),
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer {$token}",
            'Content-Type: application/json',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Tạo hoặc lấy subfolder trong Drive
 */
function getOrCreateFolder(string $token, string $folderName, string $parentId): ?string
{
    // Tìm folder hiện có
    $q   = urlencode("name='{$folderName}' and '{$parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false");
    $ch  = curl_init("https://www.googleapis.com/drive/v3/files?q={$q}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$token}"],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (!empty($data['files'][0]['id'])) {
        return $data['files'][0]['id'];
    }

    // Tạo folder mới
    $ch = curl_init('https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'name'     => $folderName,
            'parents'  => [$parentId],
            'mimeType' => 'application/vnd.google-apps.folder',
        ]),
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$token}",
            'Content-Type: application/json',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['id'] ?? null;
}

/**
 * Xóa dấu tiếng Việt để tạo tên folder/file an toàn
 */
function removeVietnamese(string $str): string
{
    $map = [
        'à','á','ả','ã','ạ','ă','ắ','ặ','ẳ','ẵ','ằ','â','ấ','ầ','ẩ','ẫ','ậ',
        'è','é','ẻ','ẽ','ẹ','ê','ế','ề','ể','ễ','ệ',
        'ì','í','ỉ','ĩ','ị',
        'ò','ó','ỏ','õ','ọ','ô','ố','ồ','ổ','ỗ','ộ','ơ','ớ','ờ','ở','ỡ','ợ',
        'ù','ú','ủ','ũ','ụ','ư','ứ','ừ','ử','ữ','ự',
        'ỳ','ý','ỷ','ỹ','ỵ','đ',
        'À','Á','Ả','Ã','Ạ','Ă','Ắ','Ặ','Ẳ','Ẵ','Ằ','Â','Ấ','Ầ','Ẩ','Ẫ','Ậ',
        'È','É','Ẻ','Ẽ','Ẹ','Ê','Ế','Ề','Ể','Ễ','Ệ',
        'Ì','Í','Ỉ','Ĩ','Ị',
        'Ò','Ó','Ỏ','Õ','Ọ','Ô','Ố','Ồ','Ổ','Ỗ','Ộ','Ơ','Ớ','Ờ','Ở','Ỡ','Ợ',
        'Ù','Ú','Ủ','Ũ','Ụ','Ư','Ứ','Ừ','Ử','Ữ','Ự',
        'Ỳ','Ý','Ỷ','Ỹ','Ỵ','Đ',
    ];
    $rep = [
        'a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
        'e','e','e','e','e','e','e','e','e','e','e',
        'i','i','i','i','i',
        'o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o',
        'u','u','u','u','u','u','u','u','u','u','u',
        'y','y','y','y','y','d',
        'A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A',
        'E','E','E','E','E','E','E','E','E','E','E',
        'I','I','I','I','I',
        'O','O','O','O','O','O','O','O','O','O','O','O','O','O','O','O','O',
        'U','U','U','U','U','U','U','U','U','U','U',
        'Y','Y','Y','Y','Y','D',
    ];
    return str_replace($map, $rep, $str);
}

function sanitizeFileName(string $name): string
{
    return preg_replace('/[^\w\-.]/', '_', removeVietnamese($name));
}

function getSetupGuide(): string
{
    return <<<GUIDE
=== HƯỚNG DẪN TẠO SERVICE ACCOUNT (5 PHÚT) ===

1. Truy cập: https://console.cloud.google.com/
2. Tạo Project mới (hoặc dùng project hiện có)
3. Bật API: APIs & Services → Library → tìm "Google Drive API" → Enable
4. Tạo Service Account:
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Điền tên: "hvu-nq57-drive-uploader"
   - Role: Basic → Editor (hoặc không cần role cấp project)
   - Nhấn Done
5. Tạo JSON Key:
   - Click vào service account vừa tạo → Keys → Add Key → Create new key → JSON
   - Tải file JSON về → đổi tên thành "service_account.json"
   - Đặt vào thư mục: d:/xampp/htdocs/chuyendoiso/api/
6. Chia sẻ thư mục Drive:
   - Mở Drive → tìm thư mục "HVU_NQ57" (ID: 0AF8hu-TYNSosUk9PVA)
   - Nhấn chuột phải → Share → thêm email service account (dạng xxx@xxx.iam.gserviceaccount.com)
   - Cấp quyền Editor
7. Xong! Upload file ngay từ ứng dụng.
GUIDE;
}
