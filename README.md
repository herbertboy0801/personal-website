# 个人网站 - 贺伯谈 AI

这是一个展示贺伯在 AI 领域学习探索、实践经验和个人作品的静态网站。

## 特点

*   **精选作品**: 展示 AI 绘图等代表性项目。
*   **工具资源库**: 提供一系列实用的小工具，部分由 AI 辅助开发。
    *   采用新分类体系 (`AI 生成`, `开发工具`, `效率助手`, `图像影音处理`, `休闲娱乐`)，导航带图标。
    *   工具卡片使用 Material Symbols 图标，样式优化。
    *   支持分页浏览，每页最多显示 4 个工具。
    *   支持按分类筛选和关键词搜索。
*   **博客/学习日记**: 分享 AI 相关的学习笔记、思考和实践经验。
*   **日夜模式**: 支持浅色和深色主题切换，并保存用户偏好。
*   **内容管理**: 内建一个简单的管理后台（位于 `/admin` 目录），用于更新精选作品 ([`admin/featured-works-data.js`](personal-website/admin/featured-works-data.js:1))、博客文章 ([`admin/blog-posts-data.js`](personal-website/admin/blog-posts-data.js:1)) 和工具资源库 ([`admin/tool-library-data.js`](personal-website/admin/tool-library-data.js:1)) 的数据。
    *   优化了页脚“管理入口”链接，点击时会检查本地服务器是否运行。
    *   管理后台保存数据后会自动尝试将更改提交并推送到 GitHub 仓库的 `main` 分支。

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
4.  **保存与推送**: 保存更改后，后台会自动修改 [`admin/`](personal-website/admin/) 目录下的相应数据文件 (`featured-works-data.js`, `blog-posts-data.js`, `tool-library-data.js`)，并尝试将这些更改提交和推送到 GitHub 仓库的 `main` 分支。
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