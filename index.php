<?php
/**
 * SVG图标库系统
 * 创建时间: 2026-02-27
 * 描述: 一个现代化的SVG图标显示和管理系统，采用液态玻璃设计风格
 * 
 * 功能特点:
 * - 显示SVG图标并支持点击复制base64编码
 * - 可通过滑块调整图标大小
 * - 支持提交新的SVG图标
 * - 响应式设计，适配不同设备
 * - 现代化的液态玻璃UI效果
 */

// 引入配置文件
require_once 'includes/config.php';

// 引入安全相关功能
require_once 'includes/security.php';

// 引入SVG图标管理功能
require_once 'includes/svg_manager.php';

// 启动会话以支持CSRF防护
session_start();

// 处理会话消息
$message = '';
if (isset($_SESSION['message'])) {
    $message = $_SESSION['message'];
    unset($_SESSION['message']);
}

// 处理SVG提交
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['icon_code'])) {
    // 验证CSRF令牌
    if (!validateCsrfToken()) {
        $message = '表单提交验证失败，请重试！';
    } else {
        $iconCode = trim($_POST['icon_code']);
        
        if (!empty($iconCode)) {
            // 检查是否包含多个data URL
            $pattern = '/data:image\/svg\+xml;base64,/';
            preg_match_all($pattern, $iconCode, $matches);
            $count = count($matches[0]);
            
            if ($count > 1) {
                // 处理多个SVG
                $svgUrls = preg_split($pattern, $iconCode);
                array_shift($svgUrls);
                $successCount = 0;
                $duplicateCount = 0;
                $errorCount = 0;
                
                foreach ($svgUrls as $base64Code) {
                    $base64Code = trim($base64Code);
                    // 移除所有空白字符（包括换行符）
                    $base64Code = preg_replace('/\s/', '', $base64Code);
                    if (empty($base64Code)) continue;
                    
                    $svgContent = base64_decode($base64Code);
                    if (!empty($svgContent)) {
                        if (validateSvg($svgContent)) {
                            if (!isDuplicate($svgContent)) {
                                // 编码SVG为base64并创建数据URL
                                $dataUrl = 'data:image/svg+xml;base64,' . $base64Code;
                                // 追加到icons.txt文件
                                if (file_put_contents(ICON_FILE, $dataUrl . PHP_EOL, FILE_APPEND | LOCK_EX) !== false) {
                                    $successCount++;
                                } else {
                                    $errorCount++;
                                    error_log('Failed to write to icons.txt file');
                                }
                            } else {
                                $duplicateCount++;
                            }
                        } else {
                            $errorCount++;
                        }
                    } else {
                        $errorCount++;
                    }
                }
                
                // 清除缓存文件
                clearIconCache();
                
                if ($successCount > 0) {
                    $_SESSION['message'] = '成功添加 ' . $successCount . ' 个SVG图标！';
                    if ($duplicateCount > 0) {
                        $_SESSION['message'] .= ' ' . $duplicateCount . ' 个图标已存在。';
                    }
                    if ($errorCount > 0) {
                        $_SESSION['message'] .= ' ' . $errorCount . ' 个图标添加失败。';
                    }
                    // 重定向到同一个页面，防止重复提交
                    header('Location: ' . $_SERVER['PHP_SELF']);
                    exit;
                } else {
                    if ($duplicateCount > 0) {
                        $message = '所有SVG图标都已存在！';
                    } else {
                        $message = '无效的SVG内容！';
                    }
                }
            } else {
                // 处理单个SVG
                $svgContent = '';
                $isValidInput = false;
                
                // 检查是否为data URL格式
                if (preg_match('/^data:image\/svg\+xml;base64,/', $iconCode)) {
                    // 移除数据URL前缀
                    $base64Code = preg_replace('/^data:image\/svg\+xml;base64,/', '', $iconCode);
                    // 移除所有空白字符（包括换行符）
                    $base64Code = preg_replace('/\s/', '', $base64Code);
                    // 验证base64格式
                    if (preg_match('#^[a-zA-Z0-9\+/=]+$#', $base64Code)) {
                        // 解码base64
                        $svgContent = base64_decode($base64Code);
                        if (!empty($svgContent)) {
                            $isValidInput = true;
                        }
                    }
                } 
                // 检查是否为纯base64编码
                else if (strlen(preg_replace('/\s/', '', $iconCode)) % 4 == 0 && preg_match('#^[a-zA-Z0-9\+/=]+$#', preg_replace('/\s/', '', $iconCode))) {
                    // 移除所有空白字符（包括换行符）
                    $base64Code = preg_replace('/\s/', '', $iconCode);
                    // 解码base64
                    $svgContent = base64_decode($base64Code);
                    if (!empty($svgContent)) {
                        $isValidInput = true;
                    }
                } 
                // 检查是否为纯SVG代码
                else if (strpos($iconCode, '<svg') !== false && strpos($iconCode, '</svg>') !== false) {
                    // 检查是否包含Base64编码
                    if (strpos($iconCode, 'data:image/svg+xml;base64,') !== false) {
                        $isValidInput = false;
                    } else {
                        $svgContent = $iconCode;
                        $isValidInput = true;
                    }
                }
                
                if ($isValidInput && !empty($svgContent)) {
                    if (validateSvg($svgContent)) {
                        if (!isDuplicate($svgContent)) {
                            // 编码SVG为base64并创建数据URL
                            $base64Code = base64_encode($svgContent);
                            $dataUrl = 'data:image/svg+xml;base64,' . $base64Code;
                            // 追加到icons.txt文件
                            if (file_put_contents(ICON_FILE, $dataUrl . PHP_EOL, FILE_APPEND | LOCK_EX) !== false) {
                                // 清除缓存文件
                                clearIconCache();
                                $_SESSION['message'] = 'SVG图标添加成功！';
                                // 重定向到同一个页面，防止重复提交
                                header('Location: ' . $_SERVER['PHP_SELF']);
                                exit;
                            } else {
                                $message = '保存SVG图标失败，请检查文件权限！';
                                error_log('Failed to write to icons.txt file');
                            }
                        } else {
                            $message = 'SVG图标已存在！';
                        }
                    } else {
                        $message = '无效的SVG内容！';
                    }
                } else {
                    $message = '请输入有效的SVG代码或Base64编码！';
                }
            }
        } else {
            $message = '请输入SVG代码或Base64编码！';
        }
    }
}

// 读取图标数据
$icons = readSvgIcons();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="SVG图标库 - 查看和复制SVG图标">
    <meta name="author" content="SVG Icon Library">
    <title>SVG图标库 - 蛋蛋之家</title>
    <!-- 引入字体 -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap">
    <!-- 引入CSS样式 -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <!-- 头部区域 -->
        <header>
            <h1>SVG图标库</h1>
            <p>提供方便的SVG图标查看和代码复制功能</p>
            <p>可通过右下角的按钮添加新的SVG图标</p>
        </header>
        
        <!-- 图标网格 -->
        <div class="icon-grid" id="icon-grid" role="grid" aria-label="SVG图标网格">
            <?php foreach ($icons as $icon): ?>
                <div class="icon-card" data-svg="<?php echo htmlspecialchars($icon['content']); ?>" data-base64="<?php echo $icon['base64']; ?>" data-data-url="<?php echo $icon['data_url']; ?>" tabindex="0" role="gridcell" aria-label="点击复制图标">
                    <div class="icon-preview">
                        <?php echo $icon['content']; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- 返回顶部按钮 -->
    <button class="back-to-top-button" id="back-to-top" onclick="scrollToTop()" aria-label="返回顶部">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
    
    <!-- 提交按钮 -->
    <button class="submit-button" onclick="openModal()" aria-label="添加新图标">+</button>
    
    <!-- 模态框 -->
    <div class="modal" id="modal" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="modal-title">
            <h2 id="modal-title">提交新的SVG图标</h2>
            <form method="post" onsubmit="return validateForm()" aria-label="SVG图标提交表单">
                <!-- CSRF令牌 -->
                <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo generateCsrfToken(); ?>">
                <div class="input-section">
                    <label for="icon-code">SVG代码或Base64编码:</label>
                    <textarea class="svg-input" name="icon_code" id="icon-code" placeholder="在此粘贴您的SVG代码或Base64编码..." aria-label="SVG代码输入"></textarea>
                    <p class="input-hint">支持直接输入SVG代码或Base64编码（带或不带data URL前缀）</p>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()" aria-label="取消">取消</button>
                    <button type="submit" class="btn btn-primary" aria-label="提交">提交</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- 图标预览模态框 -->
    <div class="modal" id="preview-modal" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="preview-modal-title">
            <h2 id="preview-modal-title">图标预览</h2>
            <div class="icon-preview-large" id="icon-preview-content">
                <!-- 图标将在这里显示 -->
            </div>
            <div class="preview-buttons">
                <button class="btn btn-primary" onclick="copyBase64()" aria-label="复制Base64编码">复制Base64编码</button>
                <button class="btn btn-secondary" onclick="copySvg()" aria-label="复制SVG代码">复制SVG代码</button>
                <button class="btn btn-secondary" onclick="closePreviewModal()" aria-label="关闭">关闭</button>
            </div>
        </div>
    </div>
    
    <!-- 通知区域 -->
    <div class="notification" id="notification" aria-live="polite" style="display: none;"></div>
    
    <!-- 引入JavaScript -->
    <script src="assets/js/script.js"></script>
    <!-- 显示提交消息 -->
    <script>
    <?php if (isset($message) && !empty($message)): ?>
        // 确保SvgIconLibrary初始化完成后再显示通知
        function showNotificationWhenReady() {
            if (typeof SvgIconLibrary !== 'undefined' && SvgIconLibrary.DOM) {
                SvgIconLibrary.showNotification('<?php echo $message; ?>', '<?php echo strpos($message, '成功') !== false ? 'success' : 'error'; ?>');
            } else {
                // 延迟重试
                setTimeout(showNotificationWhenReady, 100);
            }
        }
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showNotificationWhenReady);
        } else {
            showNotificationWhenReady();
        }
    <?php endif; ?>
    </script>
    
    <!-- 版权信息 -->
    <footer class="footer">
        <p>© 2026 All rights reserved. 版权所有 <a href="https://wuqishi.com/" target="_blank">蛋蛋之家</a></p>
    </footer>
</body>
</html>