/**
 * SVG图标库JavaScript
 * 处理复制功能、模态框操作和通知
 */

// 使用模块模式组织代码
const SvgIconLibrary = {
    // DOM元素缓存
    DOM: {},
    
    // 当前选中的图标数据
    currentIconData: null,
    
    // 初始化函数
    init: function() {
        this.initDOM();
        this.initEventListeners();
        this.initBackToTop();
        this.initIconClickEvents();
    },
    
    // 初始化DOM元素
    initDOM: function() {
        this.DOM = {
            modal: document.getElementById('modal'),
            previewModal: document.getElementById('preview-modal'),
            iconPreviewContent: document.getElementById('icon-preview-content'),
            notification: document.getElementById('notification'),
            backToTopButton: document.getElementById('back-to-top'),
            iconCodeInput: document.getElementById('icon-code'),
            iconGrid: document.getElementById('icon-grid')
        };
        
        // 检查DOM元素是否存在
        for (const key in this.DOM) {
            if (this.DOM[key] === null) {
                console.warn(`DOM元素 ${key} 不存在`);
            }
        }
    },
    
    // 初始化事件监听器
    initEventListeners: function() {
        // 确保DOM元素存在
        if (!this.DOM.modal || !this.DOM.previewModal) {
            console.warn('Modal elements not found');
            // 尝试重新获取
            this.DOM.modal = document.getElementById('modal');
            this.DOM.previewModal = document.getElementById('preview-modal');
            if (!this.DOM.modal || !this.DOM.previewModal) {
                return;
            }
        }
        
        // 点击外部关闭模态框 - 使用捕获阶段
        document.addEventListener('click', (event) => {
            if (event.target === this.DOM.modal) {
                event.stopPropagation();
                this.closeModal();
            } else if (event.target === this.DOM.previewModal) {
                event.stopPropagation();
                this.closePreviewModal();
            }
        }, true);
        
        // 触摸事件，支持移动设备 - 使用捕获阶段
        document.addEventListener('touchstart', (event) => {
            if (event.target === this.DOM.modal) {
                event.preventDefault();
                event.stopPropagation();
                this.closeModal();
            } else if (event.target === this.DOM.previewModal) {
                event.preventDefault();
                event.stopPropagation();
                this.closePreviewModal();
            }
        }, true);
        
        // 键盘事件处理
        document.addEventListener('keydown', (event) => {
            // ESC键关闭模态框
            if (event.key === 'Escape') {
                if (this.DOM.modal.style.display === 'block') {
                    this.closeModal();
                } else if (this.DOM.previewModal.style.display === 'block') {
                    this.closePreviewModal();
                }
            }
        });
        
        // 为添加按钮添加可靠的事件监听器
        const submitButton = document.querySelector('.submit-button');
        if (submitButton) {
            // 移除可能存在的旧监听器
            submitButton.removeEventListener('click', this.openModal.bind(this));
            submitButton.removeEventListener('touchstart', this.openModal.bind(this));
            
            // 添加新的监听器 - 使用捕获阶段
            submitButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.openModal();
            }, true);
            
            // 触摸事件
            submitButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.openModal();
            }, true);
        }
        
        // 为返回顶部按钮添加可靠的事件监听器
        if (this.DOM.backToTopButton) {
            // 移除可能存在的旧监听器
            this.DOM.backToTopButton.removeEventListener('click', this.scrollToTop.bind(this));
            this.DOM.backToTopButton.removeEventListener('touchstart', this.scrollToTop.bind(this));
            
            // 添加新的监听器 - 使用捕获阶段
            this.DOM.backToTopButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.scrollToTop();
            }, true);
            
            // 触摸事件
            this.DOM.backToTopButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.scrollToTop();
            }, true);
        }
    },
    
    /**
     * 打开用于提交新SVG图标的模态框
     */
    openModal: function() {
        this.DOM.modal.setAttribute('aria-hidden', 'false');
        // 先添加动画类
        this.DOM.modal.classList.add('show');
        // 然后显示模态框
        this.DOM.modal.style.display = 'block';
        // 聚焦到输入框
        this.DOM.iconCodeInput.focus();
    },
    
    /**
     * 关闭模态框
     */
    closeModal: function() {
        // 确保焦点不留在隐藏的元素中
        const focusedElement = document.activeElement;
        if (this.DOM.modal.contains(focusedElement)) {
            // 将焦点移到页面主体
            document.body.focus();
        }
        
        this.DOM.modal.classList.remove('show');
        this.DOM.modal.setAttribute('aria-hidden', 'true');
        // 等待动画完成后隐藏
        setTimeout(() => {
            this.DOM.modal.style.display = 'none';
        }, 300);
    },
    
    /**
     * 提交前验证表单
     * @returns {boolean} 表单是否有效
     */
    validateForm: function() {
        const iconCode = this.DOM.iconCodeInput.value.trim();
        
        if (!iconCode) {
            this.showNotification('请输入SVG代码或Base64编码', 'error');
            return false;
        }
        
        // 检查是否包含多个data URL
        const dataUrlPattern = /data:image\/svg\+xml;base64,/g;
        const dataUrlMatches = iconCode.match(dataUrlPattern);
        
        if (dataUrlMatches && dataUrlMatches.length > 1) {
            // 处理多个data URL
            const svgUrls = iconCode.split(dataUrlPattern);
            svgUrls.shift(); // 移除第一个空元素
            
            for (const base64Code of svgUrls) {
                const trimmedCode = base64Code.trim();
                if (trimmedCode) {
                    // 验证每个base64编码
                    if (!/^[a-zA-Z0-9+/=]+$/.test(trimmedCode)) {
                        this.showNotification('无效的Base64编码格式', 'error');
                        return false;
                    }
                }
            }
        } 
        // 检查是否为单个data URL格式
        else if (iconCode.startsWith('data:image/svg+xml;base64,')) {
            // 移除数据URL前缀
            const base64Code = iconCode.replace('data:image/svg+xml;base64,', '');
            // 验证base64格式
            if (!/^[a-zA-Z0-9+/=]+$/.test(base64Code)) {
                this.showNotification('无效的Base64编码格式', 'error');
                return false;
            }
        } 
        // 检查是否为纯base64编码
        else if (/^[a-zA-Z0-9+/=]+$/.test(iconCode)) {
            // 验证base64长度
            if (iconCode.length % 4 !== 0) {
                this.showNotification('无效的Base64编码长度', 'error');
                return false;
            }
        } 
        // 检查是否为纯SVG代码
        else if (iconCode.includes('<svg')) {
            if (!iconCode.includes('</svg>')) {
                this.showNotification('无效的SVG代码，缺少结束标签', 'error');
                return false;
            }
            // 检查是否包含非SVG内容
            if (iconCode.includes('data:image/svg+xml;base64,')) {
                this.showNotification('请不要混合输入SVG代码和Base64编码', 'error');
                return false;
            }
        } 
        // 其他情况视为无效
        else {
            this.showNotification('请输入有效的SVG代码或Base64编码', 'error');
            return false;
        }
        
        return true;
    },
    
    /**
     * 显示通知消息
     * @param {string} message 通知消息
     * @param {string} type 通知类型 (success 或 error)
     */
    showNotification: function(message, type) {
        // 确保DOM元素存在
        if (!this.DOM.notification) {
            console.warn('Notification element not found, attempting to reinitialize');
            // 尝试重新获取DOM元素
            this.DOM.notification = document.getElementById('notification');
            if (!this.DOM.notification) {
                console.error('Notification element still not found, cannot show notification');
                return;
            }
        }
        
        this.DOM.notification.textContent = message;
        this.DOM.notification.className = `notification show ${type}`;
        this.DOM.notification.style.display = 'block';
        
        // 3秒后隐藏通知
        setTimeout(() => {
            if (this.DOM.notification) {
                this.DOM.notification.classList.remove('show');
                setTimeout(() => {
                    if (this.DOM.notification) {
                        this.DOM.notification.style.display = 'none';
                    }
                }, 300);
            }
        }, 3000);
    },
    
    /**
     * 打开图标预览模态框
     * @param {HTMLElement} card 图标卡片元素
     */
    openPreviewModal: function(card) {
        // 获取图标数据
        const svgContent = card.getAttribute('data-svg');
        const dataUrl = card.getAttribute('data-data-url');
        
        // 存储当前图标数据
        this.currentIconData = {
            svg: svgContent,
            base64: dataUrl
        };
        
        // 显示图标
        this.DOM.iconPreviewContent.innerHTML = svgContent;
        
        // 打开模态框
        this.DOM.previewModal.setAttribute('aria-hidden', 'false');
        // 先添加动画类
        this.DOM.previewModal.classList.add('show');
        // 然后显示模态框
        this.DOM.previewModal.style.display = 'block';
    },
    
    /**
     * 关闭图标预览模态框
     */
    closePreviewModal: function() {
        // 确保焦点不留在隐藏的元素中
        const focusedElement = document.activeElement;
        if (this.DOM.previewModal.contains(focusedElement)) {
            // 将焦点移到页面主体
            document.body.focus();
        }
        
        this.DOM.previewModal.classList.remove('show');
        this.DOM.previewModal.setAttribute('aria-hidden', 'true');
        // 等待动画完成后隐藏
        setTimeout(() => {
            this.DOM.previewModal.style.display = 'none';
            // 清除当前图标数据
            this.currentIconData = null;
        }, 300);
    },
    
    /**
     * 复制Base64编码到剪贴板
     */
    copyBase64: function() {
        if (this.currentIconData) {
            navigator.clipboard.writeText(this.currentIconData.base64).then(() => {
                this.showNotification('Base64编码已复制到剪贴板！', 'success');
            }).catch(err => {
                console.error('复制失败:', err);
                this.showNotification('复制失败', 'error');
            });
        }
    },
    
    /**
     * 复制SVG代码到剪贴板
     */
    copySvg: function() {
        if (this.currentIconData) {
            navigator.clipboard.writeText(this.currentIconData.svg).then(() => {
                this.showNotification('SVG代码已复制到剪贴板！', 'success');
            }).catch(err => {
                console.error('复制失败:', err);
                this.showNotification('复制失败', 'error');
            });
        }
    },
    
    /**
     * 初始化图标点击事件
     */
    initIconClickEvents: function() {
        // 确保DOM元素存在
        if (!this.DOM.iconGrid) {
            console.warn('Icon grid not found');
            // 尝试重新获取
            this.DOM.iconGrid = document.getElementById('icon-grid');
            if (!this.DOM.iconGrid) {
                return;
            }
        }
        
        // 使用事件委托处理点击事件 - 使用捕获阶段
        this.DOM.iconGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.icon-card');
            if (card) {
                event.stopPropagation();
                this.openPreviewModal(card);
            }
        }, true);
        
        // 触摸事件，支持移动设备 - 使用捕获阶段
        this.DOM.iconGrid.addEventListener('touchstart', (event) => {
            const card = event.target.closest('.icon-card');
            if (card) {
                event.preventDefault();
                event.stopPropagation();
                this.openPreviewModal(card);
            }
        }, true);
        
        // 键盘事件（Enter或Space键）
        this.DOM.iconGrid.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('icon-card')) {
                event.preventDefault();
                event.stopPropagation();
                this.openPreviewModal(event.target);
            }
        });
    },
    
    /**
     * 初始化返回顶部按钮
     */
    initBackToTop: function() {
        // 滚动事件监听器
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                this.DOM.backToTopButton.classList.add('show');
            } else {
                this.DOM.backToTopButton.classList.remove('show');
            }
        });
        
        // 窗口大小变化时重新检查
        window.addEventListener('resize', () => {
            if (window.pageYOffset > 300) {
                this.DOM.backToTopButton.classList.add('show');
            } else {
                this.DOM.backToTopButton.classList.remove('show');
            }
        });
    },
    
    /**
     * 平滑滚动到页面顶部
     */
    scrollToTop: function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// 初始化 - 使用更可靠的方式，避免Cloudflare干扰
(function() {
    // 等待DOM加载完成
    function initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                SvgIconLibrary.init();
            });
        } else {
            SvgIconLibrary.init();
        }
    }
    
    // 立即执行初始化
    initWhenReady();
    
    // 额外的保险措施：延迟初始化，确保所有资源都已加载
    setTimeout(function() {
        if (!window.SvgIconLibrary || !window.SvgIconLibrary.DOM || Object.keys(window.SvgIconLibrary.DOM).length === 0) {
            console.log('Secondary initialization attempt');
            SvgIconLibrary.init();
        }
    }, 1000);
})();

// 全局函数，供HTML调用 - 使用更直接的方式
window.openModal = function() {
    SvgIconLibrary.openModal();
};

window.closeModal = function() {
    SvgIconLibrary.closeModal();
};

window.validateForm = function() {
    return SvgIconLibrary.validateForm();
};

window.openPreviewModal = function(card) {
    SvgIconLibrary.openPreviewModal(card);
};

window.closePreviewModal = function() {
    SvgIconLibrary.closePreviewModal();
};

window.copyBase64 = function() {
    SvgIconLibrary.copyBase64();
};

window.copySvg = function() {
    SvgIconLibrary.copySvg();
};

window.scrollToTop = function() {
    SvgIconLibrary.scrollToTop();
};

