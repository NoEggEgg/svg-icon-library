<?php
/**
 * SVG图标管理功能
 * 包含图标读取、验证和存储相关操作
 */

/**
 * 从icons.txt文件中读取SVG图标
 * @return array 图标数据数组
 */
function readSvgIcons() {
    // 检查是否有内存缓存
    static $memoryCache = null;
    static $cacheTimestamp = 0;
    
    // 缓存过期时间（10分钟）
    $cacheExpiry = 600;
    
    // 检查内存缓存是否有效
    if ($memoryCache !== null && (time() - $cacheTimestamp) < $cacheExpiry) {
        return $memoryCache;
    }
    
    // 检查是否有缓存文件
    $cacheFile = ICON_FILE . '.cache';
    $icons = [];
    
    // 检查缓存文件是否存在且比源文件新，且未过期
    if (file_exists($cacheFile)) {
        $cacheTime = filemtime($cacheFile);
        $sourceTime = file_exists(ICON_FILE) ? filemtime(ICON_FILE) : 0;
        
        if ($cacheTime > $sourceTime && (time() - $cacheTime) < $cacheExpiry) {
            // 从缓存文件中读取
            $cacheContent = file_get_contents($cacheFile);
            if ($cacheContent) {
                $unserialized = unserialize($cacheContent);
                if ($unserialized !== false && is_array($unserialized)) {
                    $icons = $unserialized;
                    // 更新内存缓存
                    $memoryCache = $icons;
                    $cacheTimestamp = time();
                    return $icons;
                } else {
                    // 缓存文件损坏，删除它
                    unlink($cacheFile);
                    error_log('Cache file corrupted, deleted');
                }
            }
        }
    }
    
    // 检查源文件是否存在
    if (!file_exists(ICON_FILE)) {
        // 如果文件不存在，创建一个空文件
        if (!file_put_contents(ICON_FILE, '', LOCK_EX)) {
            error_log('Failed to create icons.txt file');
        }
        return $icons;
    }
    
    // 读取文件内容
    $content = file_get_contents(ICON_FILE);
    if (!$content) {
        return $icons;
    }
    
    // 按行分割内容
    $lines = explode(PHP_EOL, $content);
    foreach ($lines as $index => $dataUrl) {
        $dataUrl = trim($dataUrl);
        if (empty($dataUrl)) {
            continue;
        }
        
        // 从数据URL中提取base64编码
        if (preg_match('/^data:image\/svg\+xml;base64,(.+)$/', $dataUrl, $matches)) {
            $base64Code = $matches[1];
            // 解码base64获取SVG内容
            $svgContent = base64_decode($base64Code);
            if ($svgContent) {
                $icons[] = [
                    'name' => 'icon_' . $index,
                    'content' => $svgContent,
                    'base64' => $base64Code,
                    'data_url' => $dataUrl
                ];
            } else {
                // 记录解码失败的错误
                error_log('Failed to decode base64 for icon at index ' . $index);
            }
        } else {
            // 记录格式错误的错误
            error_log('Invalid data URL format at index ' . $index);
        }
    }
    
    // 反转图标数组，使最新添加的图标显示在最前面
    $icons = array_reverse($icons);
    
    // 写入缓存文件
    if (!empty($icons)) {
        if (file_put_contents($cacheFile, serialize($icons), LOCK_EX) === false) {
            error_log('Failed to write to cache file');
        } else {
            // 更新内存缓存
            $memoryCache = $icons;
            $cacheTimestamp = time();
        }
    }
    
    return $icons;
}

/**
 * 验证SVG内容
 * @param string $svgContent 要验证的SVG内容
 * @return bool 验证结果
 */
function validateSvg($svgContent) {
    // 检查内容是否为空
    if (empty($svgContent)) {
        return false;
    }
    
    // 基本SVG验证
    if (strpos($svgContent, '<svg') === false || strpos($svgContent, '</svg>') === false) {
        return false;
    }
    
    // 检查SVG大小，防止过大的文件
    if (strlen($svgContent) > 100000) { // 限制100KB
        return false;
    }
    
    // 安全验证：移除可能的恶意脚本
    $allowedTags = '<svg><path><circle><rect><ellipse><line><polyline><polygon><g><text><tspan><defs><linearGradient><radialGradient><stop><pattern><clipPath><mask><filter>';
    $svgContent = strip_tags($svgContent, $allowedTags);
    
    // 检查是否包含危险属性（确保on后面跟着字母，且前面是空白字符或标签开始）
    if (preg_match('/(^|\s|>)on\w+\s*=/i', $svgContent)) {
        return false;
    }
    
    // 检查是否包含javascript: 链接
    if (preg_match('/javascript:/i', $svgContent)) {
        return false;
    }
    
    return true;
}

/**
 * 检查SVG内容是否重复
 * @param string $svgContent 要检查的SVG内容
 * @return bool 检查结果
 */
function isDuplicate($svgContent) {
    if (!file_exists(ICON_FILE)) {
        return false;
    }
    
    $content = file_get_contents(ICON_FILE);
    if (!$content) {
        return false;
    }
    
    $lines = explode(PHP_EOL, $content);
    foreach ($lines as $dataUrl) {
        $dataUrl = trim($dataUrl);
        if (empty($dataUrl)) {
            continue;
        }
        
        // 从数据URL中提取base64编码
        if (preg_match('/^data:image\/svg\+xml;base64,(.+)$/', $dataUrl, $matches)) {
            $base64Code = $matches[1];
            $existingContent = base64_decode($base64Code);
            if (trim($existingContent) === trim($svgContent)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * 清理缓存文件
 */
function clearIconCache() {
    $cacheFile = ICON_FILE . '.cache';
    if (file_exists($cacheFile)) {
        unlink($cacheFile);
    }
}
?>