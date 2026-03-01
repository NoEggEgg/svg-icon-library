<?php
/**
 * 安全相关功能
 * 包含CSRF防护等安全机制
 */

/**
 * 生成CSRF令牌
 * @return string CSRF令牌
 */
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * 验证CSRF令牌
 * @return bool 验证结果
 */
function validateCsrfToken() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME]) || !isset($_POST[CSRF_TOKEN_NAME])) {
        return false;
    }
    return hash_equals($_SESSION[CSRF_TOKEN_NAME], $_POST[CSRF_TOKEN_NAME]);
}
?>