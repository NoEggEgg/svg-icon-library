/**
 * SVG图标库JavaScript - 简化版
 * 专注于debug模式的可靠实现
 */

(function() {
    'use strict';
    
    // 命名空间
    const SVG = {
        // Debug模式状态
        debugMode: false,
        
        // DOM元素缓存
        DOM: {},
        
        // 初始化
        init: function() {
            console.log('SVG库开始初始化');
            
            // 初始化DOM
            this.DOM = {
                debugToggle: document.getElementById('debug-toggle'),
                themeToggle: document.getElementById('theme-toggle'),
                iconGrid: document.getElementById('icon-grid'),
                modal: document.getElementById('modal'),
                previewModal: document.getElementById('preview-modal'),
                notification: document.getElementById('notification'),
                submitButton: document.querySelector('.submit-button'),
                backToTop: document.getElementById('back-to-top')
            };
            
            console.log('DOM元素:', this.DOM);
            
            // 从URL参数读取debug模式（优先级最高）
            const urlParams = new URLSearchParams(window.location.search);
            this.debugMode = urlParams.has('debug');
            console.log('Debug模式状态:', this.debugMode);
            
            // 从localStorage读取主题
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.setTheme(savedTheme);
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    this.setTheme('dark');
                }
            }
            
            // 初始化UI
            this.initDebugUI();
            
            // 更新删除按钮（必须在initDebugUI之后）
            this.updateDeleteButtons();
            
            // 绑定事件
            this.bindEvents();
            
            console.log('SVG库初始化完成');
        },
        
        // 初始化Debug UI
        initDebugUI: function() {
            // 更新debug按钮状态
            if (this.DOM.debugToggle) {
                if (this.debugMode) {
                    this.DOM.debugToggle.classList.add('active');
                    this.DOM.debugToggle.title = 'Debug模式已启用 - 点击禁用';
                } else {
                    this.DOM.debugToggle.classList.remove('active');
                    this.DOM.debugToggle.title = 'Debug模式已禁用 - 点击启用';
                }
            }
            
            // 为图标卡片添加/移除debug模式class
            const cards = document.querySelectorAll('.icon-card');
            cards.forEach(card => {
                if (this.debugMode) {
                    card.classList.add('debug-mode');
                } else {
                    card.classList.remove('debug-mode');
                }
            });
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            
            // Debug模式按钮
            if (this.DOM.debugToggle) {
                this.DOM.debugToggle.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Debug按钮被点击 - 退出debug模式');
                    // 移除URL中的debug参数
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.delete('debug');
                    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                    window.location.href = newUrl;
                };
                console.log('Debug按钮事件已绑定');
            }
            
            // 主题切换按钮
            if (this.DOM.themeToggle) {
                this.DOM.themeToggle.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('主题按钮被点击');
                    self.toggleTheme();
                };
            }
            
            // 添加按钮
            if (this.DOM.submitButton) {
                this.DOM.submitButton.onclick = function(e) {
                    e.preventDefault();
                    self.openModal();
                };
            }
            
            // 返回顶部按钮
            if (this.DOM.backToTop) {
                this.DOM.backToTop.onclick = function(e) {
                    e.preventDefault();
                    self.scrollToTop();
                };
            }
            
            // ESC键关闭模态框
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (self.DOM.modal && self.DOM.modal.style.display === 'block') {
                        self.closeModal();
                    }
                    if (self.DOM.previewModal && self.DOM.previewModal.style.display === 'block') {
                        self.closePreviewModal();
                    }
                }
            });
            
            // 图标卡片点击事件（使用事件委托）
            if (this.DOM.iconGrid) {
                this.DOM.iconGrid.onclick = function(e) {
                    // 首先检查是否点击了删除按钮
                    const deleteBtn = e.target.closest('.delete-btn');
                    if (deleteBtn) {
                        // 找到删除按钮所属的卡片
                        const card = deleteBtn.closest('.icon-card');
                        if (card) {
                            e.preventDefault();
                            e.stopPropagation();
                            self.confirmDelete(card);
                            return;
                        }
                    }
                    
                    // 检查是否点击了图标卡片
                    const card = e.target.closest('.icon-card');
                    if (card) {
                        e.preventDefault();
                        self.openPreview(card);
                    }
                };
            }
        },
        
        // 更新删除按钮
        updateDeleteButtons: function() {
            const cards = document.querySelectorAll('.icon-card');
            const self = this;
            
            cards.forEach(card => {
                const existingBtn = card.querySelector('.delete-btn');
                if (existingBtn) {
                    existingBtn.remove();
                }
                
                if (this.debugMode) {
                    const btn = document.createElement('button');
                    btn.className = 'delete-btn';
                    btn.innerHTML = '×';
                    btn.title = '删除此图标';
                    btn.setAttribute('aria-label', '删除此图标');
                    
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.confirmDelete(card);
                    });
                    
                    card.appendChild(btn);
                }
            });
            
            console.log('删除按钮已更新');
        },
        
        // 确认删除 - 使用自定义弹窗
        confirmDelete: function(card) {
            const self = this;
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = 
                '<div class="confirm-icon">⚠️</div>' +
                '<div class="confirm-title">确认删除</div>' +
                '<div class="confirm-message">确定要删除这个图标吗？此操作不可撤销。</div>' +
                '<div class="confirm-buttons">' +
                    '<button class="btn btn-secondary" id="confirm-cancel">取消</button>' +
                    '<button class="btn btn-danger" id="confirm-ok">确认删除</button>' +
                '</div>';
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.classList.add('show');
                dialog.classList.add('show');
            });
            
            const close = function() {
                overlay.classList.remove('show');
                dialog.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            };
            
            document.getElementById('confirm-cancel').onclick = close;
            document.getElementById('confirm-ok').onclick = function() {
                close();
                self.deleteIcon(card);
            };
            
            overlay.onclick = function(e) {
                if (e.target === overlay) close();
            };
        },
        
        // 删除图标
        deleteIcon: function(card) {
            const base64 = card.getAttribute('data-base64');
            const csrfToken = document.getElementById('global-csrf-token').value;
            
            if (!base64 || base64.length === 0) {
                this.showNotification('删除失败: 缺少图标数据', 'error');
                return;
            }
            
            if (!csrfToken || csrfToken.length === 0) {
                this.showNotification('删除失败: 请刷新页面重试', 'error');
                return;
            }
            
            // 添加删除动画
            card.classList.add('deleting');
            
            const csrfTokenName = document.getElementById('csrf-token-name').value || 'csrf_token';
            
            fetch('api/delete_icon.php?debug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'same-origin',
                body: csrfTokenName + '=' + encodeURIComponent(csrfToken) + '&icon_base64=' + encodeURIComponent(base64)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP错误: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    this.showNotification('图标删除成功', 'success');
                    // 等待动画完成后移除
                    setTimeout(() => card.remove(), 300);
                } else {
                    card.classList.remove('deleting');
                    this.showNotification('删除失败: ' + data.message, 'error');
                }
            })
            .catch(error => {
                card.classList.remove('deleting');
                console.error('删除图标时出错:', error);
                this.showNotification('删除图标时出错: ' + error.message, 'error');
            });
        },
        
        // 切换主题
        toggleTheme: function() {
            const root = document.documentElement;
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            this.setTheme(newTheme);
        },
        
        // 设置主题
        setTheme: function(theme) {
            const root = document.documentElement;
            const sunIcon = document.querySelector('.sun-icon');
            const moonIcon = document.querySelector('.moon-icon');
            
            if (theme === 'dark') {
                root.setAttribute('data-theme', 'dark');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            } else {
                root.setAttribute('data-theme', 'light');
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
            }
            
            localStorage.setItem('theme', theme);
        },
        
        // 打开模态框
        openModal: function() {
            if (this.DOM.modal) {
                this.DOM.modal.classList.add('show');
                this.DOM.modal.style.display = 'block';
            }
        },
        
        // 关闭模态框
        closeModal: function() {
            if (this.DOM.modal) {
                this.DOM.modal.classList.remove('show');
                this.DOM.modal.style.display = 'none';
            }
        },
        
        // 打开预览
        openPreview: function(card) {
            if (!this.DOM.previewModal) return;
            
            const svg = card.getAttribute('data-svg');
            const base64 = card.getAttribute('data-data-url');
            
            // 保存当前图标数据
            this.currentIcon = { svg: svg, base64: base64 };
            
            // 显示图标
            document.getElementById('icon-preview-content').innerHTML = svg;
            
            // 打开模态框
            this.DOM.previewModal.classList.add('show');
            this.DOM.previewModal.style.display = 'block';
        },
        
        // 关闭预览
        closePreviewModal: function() {
            if (this.DOM.previewModal) {
                this.DOM.previewModal.classList.remove('show');
                this.DOM.previewModal.style.display = 'none';
                this.currentIcon = null;
            }
        },
        
        // 复制Base64
        copyBase64: function() {
            if (this.currentIcon && navigator.clipboard) {
                navigator.clipboard.writeText(this.currentIcon.base64).then(() => {
                    this.showNotification('Base64编码已复制', 'success');
                });
            }
        },
        
        // 复制SVG
        copySvg: function() {
            if (this.currentIcon && navigator.clipboard) {
                navigator.clipboard.writeText(this.currentIcon.svg).then(() => {
                    this.showNotification('SVG代码已复制', 'success');
                });
            }
        },
        
        // 滚动到顶部
        scrollToTop: function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        
        // 显示通知
        showNotification: function(message, type) {
            const notification = this.DOM.notification;
            if (!notification) return;
            
            notification.textContent = message;
            notification.className = 'notification show ' + type;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            }, 3000);
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SVG.init();
        });
    } else {
        SVG.init();
    }
    
    // 暴露到全局作用域
    window.SVG = SVG;
    
    // 暴露全局函数
    window.openModal = function() { SVG.openModal(); };
    window.closeModal = function() { SVG.closeModal(); };
    window.closePreviewModal = function() { SVG.closePreviewModal(); };
    window.copyBase64 = function() { SVG.copyBase64(); };
    window.copySvg = function() { SVG.copySvg(); };
    window.scrollToTop = function() { SVG.scrollToTop(); };
    
})();
