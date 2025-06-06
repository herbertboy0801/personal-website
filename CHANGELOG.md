# 更新日志

## [0.3.2] - 2025-06-06

### 变更 (Changed)
- **管理后台**: 移除了管理后台 ([`admin/public/script.js`](personal-website/admin/public/script.js:1)) 的密码验证功能。
- **管理后台**: 将原有的“关闭后台服务”按钮 ([`admin/public/index.html`](personal-website/admin/public/index.html:1), [`admin/public/script.js`](personal-website/admin/public/script.js:1)) 替换为“更新备份文件”按钮。
- **管理后台**: 在后端服务器 ([`admin/server.js`](personal-website/admin/server.js:1)) 添加了 `/api/update-backups` 端点，用于将当前数据文件内容复制到对应的 `.bak` 文件。
- **管理后台**: 移除了后端服务器 ([`admin/server.js`](personal-website/admin/server.js:1)) 的 `/api/shutdown` 端点。

### 其他 (Other)
- 明确了项目的 Git 更新流程：日常内容更新通过后台自动同步，代码/结构更新需手动执行 Git 命令。

---

## [0.3.1] - 2025-06-06

### 修复 (Fixed)
- **管理后台编辑**: 修复了在管理后台编辑工具条目时，由于动态生成 ID 导致保存失败 (404 Not Found) 的问题。将 [`admin/tool-library-data.js`](personal-website/admin/tool-library-data.js:1) 中的 ID 改为静态。
- **管理后台布局**: 修复了在管理后台点击“编辑”按钮时，按钮会因表单显示而移动的问题。调整了 [`admin/public/script.js`](personal-website/admin/public/script.js:1) 和 [`admin/public/style.css`](personal-website/admin/public/style.css:1) 中的列表项布局。

### 变更 (Changed)
- **主页关于我**: 调整了主页 ([`index.html`](personal-website/index.html:1)) “关于我”部分的文本格式为左对齐，并移除了末尾的微信号信息。

### 其他 (Other)
- **数据备份**: 为管理后台的数据文件 ([`blog-posts-data.js`](personal-website/admin/blog-posts-data.js:1), [`featured-works-data.js`](personal-website/admin/featured-works-data.js:1), [`tool-library-data.js`](personal-website/admin/tool-library-data.js:1)) 创建了 `.bak` 备份文件。

---

## [0.3.0] - 2025-06-06

### 新增 (Added)
- **日夜模式切换**: 在导航栏添加切换按钮，支持浅色/深色主题切换，并使用 `localStorage` 保存用户偏好。
- **Material Symbols 图标**: 引入 Material Symbols Outlined 字体库，并应用于工具库分类导航和工具卡片。
- **管理入口优化**: 页脚“管理入口”链接增加点击时检查本地服务器状态的功能，若未运行则提示用户。

### 变更 (Changed)
- **工具库分类调整**: 更新工具分类体系为：`AI 生成`, `开发工具`, `效率助手`, `图像影音处理`, `休闲娱乐`。分类导航增加对应图标。
- **工具库卡片样式**: 优化工具卡片视觉样式，增大并突出图标，调整布局和颜色，使其更美观清晰。
- **JS 文件合并**: 将所有根目录下的 `.js` 数据和逻辑文件合并到单一的 [`main.js`](personal-website/main.js:1) 文件中，简化了 HTML 引入。
- **数据结构更新**: 更新了 [`main.js`](personal-website/main.js:1) 中 `toolLibraryData` 的 `icon` (使用 Material Symbols 名称) 和 `category` 字段。

### 修复 (Fixed)
- 修正了合并 JS 文件过程中可能引入的语法错误。

---

## [0.2.0] - 2025-06-06

### 新增 (Added)
- 创建工具库数据文件 `tool-library-data.js` (后被合并到 `main.js`)，用于集中管理工具信息。
- 创建前端脚本 `generate-tool-library.js` (后被合并到 `main.js`)，用于动态渲染工具库分类和列表。
- 在 Admin 后端 ([`admin/server.js`](personal-website/admin/server.js:1)) 添加了管理工具库数据的 API 端点 (`/api/tools`, `/api/tools/:id`)。
- 在 Admin 前端 ([`admin/public/index.html`](personal-website/admin/public/index.html:1), [`admin/public/script.js`](personal-website/admin/public/script.js:1)) 添加了管理工具库的用户界面和交互逻辑。
- 在工具资源库 ([`index.html`](personal-website/index.html:1), `generate-tool-library.js`, [`style.css`](personal-website/style.css:1)) 中添加了分页功能，每页最多显示 4 个工具。

### 变更 (Changed)
- 重构了主页 ([`index.html`](personal-website/index.html:1)) 的“工具资源库”部分，移除了静态 HTML 内容，改为由 JavaScript 动态生成。
- 修改了 Admin 后端 ([`admin/server.js`](personal-website/admin/server.js:1)) 的 API 逻辑，使用唯一的字符串 ID (`item.id`) 来处理所有数据类型（精选作品、博客、工具）的更新和删除，取代了之前基于数组索引的方式，提高了稳定性。
- 更新了 Admin 前端 ([`admin/public/script.js`](personal-website/admin/public/script.js:1)) 以适配基于 ID 的 CRUD 操作，并为每个管理部分（作品、博客、工具）显示独立的 Git 推送状态。


### 修复 (Fixed)
- 确保 Admin 后端在添加新项目时能正确生成唯一 ID。
- 确保 Admin 前端在编辑项目时能正确处理包含逗号的标签字符串。

---
## [0.1.1] - 2025-06-05

### 新增 (Added)
- 创建 `CHANGELOG.md` 文件，用于记录版本更新历史。
- 整合了 `personal-website-plan.md`, `admin-tool-plan.md`, `admin-tool-test-plan.md`, `github-update-plan.md` 的关键内容摘要作为历史记录。
- 添加/更新了用于管理精选作品的后台工具（位于 `admin` 目录）。

### 变更 (Changed)
- 使用管理工具更新了精选作品数据（影响 `featured-works-data.js` 文件）。

---

## 过往计划摘要 (Historical Plan Summaries)

### 来自 `personal-website-plan.md`
- 计划更新主页 [`index.html`](personal-website/index.html:0)，添加新的工具链接（文本加密、财务工具、透明度调整），修正“晨间日记”的链接和Logo，并删除冗余文件 [`tools/photo_wall.html`](personal-website/tools/photo_wall.html:0)。

### 来自 `admin-tool-plan.md`
- 计划创建一个位于 [`admin/`](personal-website/admin/) 目录下的内容管理工具（Node.js 后端 + Web 前端），用于编辑“精选作品”、“博客文章”和“学习日记”的数据文件。详细说明了文件结构、后端 API 设计、前端交互逻辑以及学习日记在主页的集成方案。

### 来自 `admin-tool-test-plan.md`
- 为精选作品管理工具制定了详细的测试计划，包括访问、认证、初始加载检查，以及通过 Web 界面测试添加、编辑和删除作品的功能。

### 来自 `github-update-plan.md`
- 最初计划使用标准的 Git 工作流程（`status`, `add`, `commit`, `push`）将包括管理工具在内的更新同步到 GitHub。（此计划后被包含版本管理的计划取代）。