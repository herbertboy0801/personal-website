# 个人网站 - 贺伯谈 AI

这是一个展示贺伯在 AI 领域学习探索、实践经验和个人作品的静态网站。

## 特点

*   **精选作品**: 展示 AI 绘图等代表性项目。
*   **工具资源库**: 提供一系列实用的小工具，部分由 AI 辅助开发。
    *   采用新分类体系 (`AI 生成`, `开发工具`, `效率助手`, `图像影音处理`, `休闲娱乐`)，导航带图标。
    *   工具卡片使用 Material Symbols 图标，样式优化。
    *   支持分页浏览，每页最多显示 4 个工具。
    *   支持按分类筛选和关键词搜索。
*   **HTML 预览工具增强**: ([`tools/html_previewer.html`](personal-website/tools/html_previewer.html:0)) 新增将预览内容导出为 PPTX 格式的功能，支持自定义页面尺寸 (16:9) 并尝试保留基本样式。
*   **新增图片编辑器**: ([`tools/image_editor.html`](personal-website/tools/image_editor.html:0)) 提供 PNG 图片按比例缩放和自由选区预览功能。
*   **博客/学习日记**: 分享 AI 相关的学习笔记、思考和实践经验。
    *   独立的博客列表页面 ([`blog.html`](personal-website/blog.html:1)) 用于展示所有文章，并包含返回首页的链接。
*   **晨间日记**: (原“重点推荐”部分)
    *   **管理**: 晨间日记的管理功能已整合到主管理后台 ([`admin/`](personal-website/admin/)), 提供多字段编辑、历史记录浏览（带日历）、从 LocalStorage 导入旧数据以及导出为 JSON 的功能。数据存储在 [`admin/morning-journal-data.js`](personal-website/admin/morning-journal-data.js:0)。
    *   **查看**:
        *   主页 ([`index.html`](personal-website/index.html:0)) 的摘要区域左侧显示 Logo (已移至 [`assets/morning-journal-logo.png`](personal-website/assets/morning-journal-logo.png:0))，右侧动态显示最新一条包含实际“今日收获”内容的日记，并清晰展示日期。
        *   **计划中**: 将重构 [`morning-journal-view.html`](personal-website/morning-journal-view.html:0) 页面，作为后台数据的只读视图，其外观将模仿原本地编辑器 ([`tools/drawing-app/index.html`](personal-website/tools/drawing-app/index.html:0))。其关联的 JavaScript ([`morning-journal-view.js`](personal-website/morning-journal-view.js:1)) 将被更新，以确保正确加载和显示来自后台设置文件 ([`admin/journal-settings.js`](personal-website/admin/journal-settings.js:1)) 的日更天数和目标信息。
        *   **样式调整**: 调整了 [`morning-journal-view.css`](personal-website/morning-journal-view.css:1) 以减少页面元素之间的空白，使布局更紧凑。
*   **日夜模式**: 支持浅色和深色主题切换，并保存用户偏好。
*   **内容管理**: 内建一个简单的管理后台（位于 `/admin` 目录），用于更新精选作品 ([`admin/featured-works-data.js`](personal-website/admin/featured-works-data.js:1))、博客文章 ([`admin/blog-posts-data.js`](personal-website/admin/blog-posts-data.js:1))、工具资源库 ([`admin/tool-library-data.js`](personal-website/admin/tool-library-data.js:1)) 和晨间日记 ([`admin/morning-journal-data.js`](personal-website/admin/morning-journal-data.js:0)) 的数据。
    *   优化了页脚“管理入口”链接，点击时会检查本地服务器是否运行。
    *   管理后台保存数据后会自动尝试将更改提交并推送到 GitHub 仓库的 `main` 分支。
    *   **已修复**: 工具库链接现在能正确指向各工具的 HTML 文件。
    *   **已修复**: 管理后台的晨间日记设置现在能够正确加载和显示已保存的值。

## 技术栈

*   **前端**: HTML, CSS, JavaScript (原生)
*   **后端 (管理工具)**: Node.js, Express.js
*   **数据存储**: JavaScript 文件 (`.js`)。数据文件位于 [`admin/`](personal-website/admin/) 目录下。
    *   **数据备份**: [`admin/`](personal-website/admin/) 目录下的 `.bak` 文件是对应数据文件的备份，用于防止意外覆盖。

## 运行项目

1.  **浏览网站**: 直接在浏览器中打开 [`index.html`](personal-website/index.html:1) 文件即可浏览主网站。
2.  **运行管理后台**:
    *   确保你已安装 [Node.js](https://nodejs.org/)。
    *   在项目根目录 (`personal-website`) 下打开终端。
    *   进入 `admin` 目录: `cd admin`
    *   安装依赖: `npm install`
    *   启动服务器: `node server.js`
    *   服务器将在 `http://localhost:3000` 运行。在浏览器中访问 `http://localhost:3000/admin` 即可进入管理界面。

## 数据管理

网站的动态内容（精选作品、博客文章、工具资源库）通过位于 [`admin/`](personal-website/admin/) 目录下的管理后台进行维护。

1.  **启动管理后台**: 按照上面的“运行项目”说明启动 Node.js 服务器。
2.  **访问**: 在浏览器中打开 `http://localhost:3000/admin` (或通过主页页脚的“管理入口”链接)。
3.  **操作**: 在对应的标签页中添加、编辑或删除内容。
4.  **保存与推送**: 保存更改后，后台会自动修改 [`admin/`](personal-website/admin/) 目录下的相应数据文件 (`featured-works-data.js`, `blog-posts-data.js`, `tool-library-data.js`, `morning-journal-data.js`)，并尝试将这些更改提交和推送到 GitHub 仓库的 `main` 分支。此外，管理界面还提供了晨间日记数据的导入和导出功能。
5.  **更新备份**: 点击管理界面右上角的“更新备份文件”按钮，可以将当前的数据文件内容复制到对应的 `.bak` 文件中，作为手动备份。

**工具库数据结构 ([`tool-library-data.js`](personal-website/admin/tool-library-data.js:1) 中的对象):**

*   `id` (String): 唯一标识符 (由后台自动生成，例如 `tool-0`, `tool-1`)。
*   `name` (String): 工具名称 (必填)。
*   `description` (String): 工具描述 (可选)。
*   `icon` (String): Material Symbols Outlined 图标名称字符串 (例如 `'code'`, `'monitor_weight'`) (可选, 提供默认值)。
*   `category` (String): 工具分类 (必填, 从 `'AI 生成'`, `'开发工具'`, `'效率助手'`, `'图像影音处理'`, `'休闲娱乐'` 中选择)。
*   `tags` (Array<String>): 相关标签数组 (可选)。
*   `url` (String): 指向工具 HTML 文件的相对路径 (必填)。

## 更新流程 (Git Workflow)

本项目采用两种方式将更改同步到 GitHub：

1.  **日常内容更新 (通过后台管理界面)**
    *   **场景:** 添加、编辑或删除精选作品、博客文章或工具资源库条目。
    *   **操作:** 在管理后台 (`/admin`) 进行操作。
    *   **Git 同步:** 后台服务器在保存数据后会自动执行 `git add`, `git commit`, 和 `git push`，将数据文件的更改推送到 GitHub 的 `main` 分支。**您无需手动操作 Git。**

2.  **代码/结构更新 (手动 Git 操作)**
    *   **场景:** 修改网站的 HTML 结构、CSS 样式、JavaScript 逻辑、后台服务器代码 (`server.js`) 或其他非内容数据文件（例如 `README.md`, `CHANGELOG.md` 等）。
    *   **操作:** 在本地开发环境完成代码修改后，需要手动执行 Git 命令。
    *   **步骤:**
        1.  打开终端，确保位于项目根目录 (`personal-website`)。
        2.  检查状态: `git status`
        3.  添加到暂存区: `git add .` (或指定文件)
        4.  提交更改: `git commit -m "描述性提交信息"`
        5.  推送到 GitHub: `git push origin main` (或其他主分支名称)

## 贡献

欢迎提出问题或改进建议！

## 许可证

(待定)