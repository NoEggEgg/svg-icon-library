<?php
session_start();

/**
 * 删除SVG图标API
 * 通过POST请求删除指定的图标
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/svg_manager.php';

header('Content-Type: application/json; charset=utf-8');

// 仅允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => '仅允许POST请求'
    ]);
    exit;
}

// 仅允许在Debug模式下删除
if (!isset($_GET['debug'])) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => '删除功能仅在Debug模式下可用'
    ]);
    exit;
}

// 验证CSRF令牌
if (!validateCsrfToken()) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'CSRF验证失败'
    ]);
    exit;
}

// 检查是否有要删除的图标数据
if (!isset($_POST['icon_base64']) || empty($_POST['icon_base64'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '缺少图标数据'
    ]);
    exit;
}

$iconBase64 = $_POST['icon_base64'];
$iconsFile = __DIR__ . '/../' . ICON_FILE;

// 添加调试日志
error_log('删除请求 - base64长度: ' . strlen($iconBase64));
error_log('删除请求 - 图标文件: ' . $iconsFile);

try {
    // 读取现有的图标数据
    if (!file_exists($iconsFile)) {
        throw new Exception('图标文件不存在: ' . $iconsFile);
    }
    
    $iconsContent = file_get_contents($iconsFile);
    
    // 添加调试日志
    error_log('图标文件内容长度: ' . strlen($iconsContent));
    
    // 规范化base64编码：移除所有空白字符，并移除可能存在的data URL前缀
    $normalizedBase64 = preg_replace('/\s/', '', $iconBase64);
    $normalizedBase64 = preg_replace('/^data:image\/svg\+xml;base64,/', '', $normalizedBase64);
    $iconToDelete = 'data:image/svg+xml;base64,' . $normalizedBase64;
    
    // 添加调试日志
    error_log('要删除的图标URL前100字符: ' . substr($iconToDelete, 0, 100));
    
    // 将整个文件内容按行分割
    $lines = explode(PHP_EOL, $iconsContent);
    $newLines = [];
    $found = false;
    
    // 添加调试日志
    error_log('文件行数: ' . count($lines));
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) {
            continue;
        }
        
        // 规范化存储的base64编码
        $normalizedLine = preg_replace('/\s/', '', $line);
        
        // 比较规范化后的base64
        if ($normalizedLine === $iconToDelete) {
            error_log('找到匹配的图标，准备删除');
            $found = true;
            continue; // 跳过要删除的图标
        }
        
        $newLines[] = $line;
    }
    
    if (!$found) {
        // 尝试更宽松的匹配（解码后比较SVG内容）
        $decodedContent = base64_decode($normalizedBase64);
        if ($decodedContent !== false) {
            // 重新遍历，尝试解码比较
            $newLines = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) {
                    continue;
                }
                
                // 提取base64部分并解码
                if (preg_match('/^data:image\/svg\+xml;base64,(.+)$/i', $line, $matches)) {
                    $storedBase64 = preg_replace('/\s/', '', $matches[1]);
                    $storedContent = base64_decode($storedBase64);
                    
                    // 比较解码后的内容
                    if ($storedContent !== false && trim($storedContent) === trim($decodedContent)) {
                        $found = true;
                        continue; // 跳过要删除的图标
                    }
                }
                
                $newLines[] = $line;
            }
        }
        
        if (!$found) {
            throw new Exception('图标不存在于数据库中');
        }
    }
    
    // 写入新的图标数据
    if (file_put_contents($iconsFile, implode(PHP_EOL, $newLines) . PHP_EOL, LOCK_EX) === false) {
        throw new Exception('写入文件失败');
    }
    
    // 清除缓存
    clearIconCache();
    
    echo json_encode([
        'success' => true,
        'message' => '图标删除成功'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
