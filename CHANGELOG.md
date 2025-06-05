# 更新日志

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