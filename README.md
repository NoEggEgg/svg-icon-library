# SVG图标库系统

一个现代化的SVG图标显示和管理系统，采用液态玻璃设计风格，提供方便的SVG图标查看和代码复制功能。

预览地址：[SVG图标库](https://wuqishi.com/svg/ "SVG图标库")

## 项目简介

SVG图标库是一个专为前端开发者设计的工具，旨在简化SVG图标的管理和使用流程。通过直观的界面和便捷的功能，开发者可以快速查找、预览和复制SVG图标代码，提高开发效率。

## 功能特点

- ✅ 显示SVG图标并支持点击复制base64编码
- ✅ 支持提交新的SVG图标
- ✅ 响应式设计，适配不同设备
- ✅ 现代化的液态玻璃UI效果
- ✅ 支持批量上传SVG图标
- ✅ 自动检测重复图标
- ✅ 支持多种输入格式（SVG代码、纯Base64编码、带data URL前缀的Base64编码）
- ✅ 完善的表单验证和错误处理
- ✅ CSRF防护确保安全

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **后端**：PHP 8.0+
- **存储**：文本文件（icons.txt）
- **设计风格**：液态玻璃效果
- **字体**：Google Fonts (Inter, Poppins)

## 项目结构

```
SVG/
├── assets/
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       └── script.js       # JavaScript文件
├── includes/
│   ├── config.php          # 配置文件
│   ├── security.php        # 安全相关功能
│   └── svg_manager.php     # SVG图标管理功能
├── icons.txt              # 存储SVG图标
├── index.php              # 主页面
└── README.md              # 项目说明文档
```

## 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/your-username/svg-icon-library.git
   cd svg-icon-library
   ```

2. **配置服务器**

   - 确保服务器支持PHP 8.0+
   - 将项目文件放置在Web服务器根目录
   - 确保 `icons.txt`文件具有写入权限

3. **访问系统**
   在浏览器中访问：`http://localhost/svg-icon-library/`

## 使用方法

### 查看和复制图标

1. 浏览图标网格中的SVG图标
2. 点击图标打开预览模态框
3. 在预览模态框中点击"复制Base64编码"或"复制SVG代码"
4. 编码将被复制到剪贴板

### 添加新图标

1. 点击右下角的"+"按钮打开提交表单
2. 在文本框中粘贴SVG代码或Base64编码
   - 支持直接输入SVG代码
   - 支持纯Base64编码
   - 支持带data URL前缀的Base64编码
3. 点击"提交"按钮
4. 系统会自动验证SVG内容并检查是否重复
5. 成功添加后会显示通知消息

### 批量添加图标

1. 在提交表单中粘贴多个Base64编码（每个编码占一行）
2. 系统会自动处理每个图标并分别验证
3. 提交后会显示成功、重复和失败的图标数量

## 安全特性

- **CSRF防护**：使用令牌验证表单提交
- **SVG验证**：检查SVG内容的安全性
- **输入验证**：验证用户输入的有效性
- **文件操作安全**：使用文件锁定确保数据一致性

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 性能优化

- **缓存机制**：减少重复读取文件
- **延迟加载**：只在需要时处理SVG数据
- **事件委托**：优化事件处理性能
- **DOM操作优化**：减少重排和重绘

## 自定义配置

在 `includes/config.php`文件中可以修改以下配置：

- `ICON_FILE`：SVG图标存储文件路径

## 贡献指南

1. Fork本仓库
2. 创建功能分支
3. 提交更改
4. 推送至分支
5. 开启Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 版权信息

© 2026 All rights reserved. 版权所有 [蛋蛋之家](https://wuqishi.com/)