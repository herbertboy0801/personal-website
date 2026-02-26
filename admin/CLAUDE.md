[根目录](../CLAUDE.md) > **admin**

# Admin 模块 -- 管理后台 + 遗留数据

## 模块职责

包含两部分：
1. **`public/`** -- 管理后台 Web 面板（登录 + 内容管理 SPA）
2. **根目录 `*.js`** -- 迁移前的遗留数据文件（已通过 `scripts/migrate-to-turso.js` 导入 Turso，保留供回退参考）

## 入口与启动

管理面板通过 Vercel rewrites 访问：
- `/admin` 或 `/admin/` -> `admin/public/index.html`
- `/admin/login` -> `admin/public/login.html`
- `/admin/style.css` -> `admin/public/style.css`
- `/admin/script.js` -> `admin/public/script.js`

无独立后端，所有操作通过调用 `/api/*` 端点完成。

## 对外接口

管理面板提供以下内容管理功能（通过 `public/script.js` 中的 SPA 路由实现）：

- **博客文章管理** -- CRUD + 精选设置
- **工具库管理** -- CRUD
- **AI 绘图画廊管理** -- CRUD
- **精选作品管理** -- CRUD
- **晨间日记管理** -- CRUD + 批量导入
- **日记设置** -- 连续打卡参考日期、目标天数、奖励等
- **修改密码**

### 认证流程

1. 访问 `/admin` 自动跳转 `/admin/login`
2. 登录成功后 API 设置 httpOnly cookie
3. 管理面板通过 `GET /api/auth-status` 检查登录状态
4. 未登录自动跳回登录页

## 关键依赖与配置

- 纯 HTML/CSS/JS，无构建步骤
- 依赖项目 `/api/*` 端点
- `public/script.js` 为超大单文件（约 100KB），包含所有管理功能

## 数据模型

遗留数据文件（已迁移到 Turso，仅供参考）：

| 文件 | 内容 | 对应 DB 表 |
|---|---|---|
| `blog-posts-data.js` | 博客文章数组 | `blog_posts` |
| `tool-library-data.js` | 工具库数组 | `tools` |
| `gallery-data.js` | AI 绘图画廊数组 | `gallery` |
| `featured-works-data.js` | 精选作品数组 | `featured_works` |
| `morning-journal-data.js` | 晨间日记数组 | `morning_journal` |
| `journal-settings.js` | 日记设置对象 | `journal_settings` |
| `auth-config.js` | 管理员凭据（CommonJS 导出） | `auth_config` |

## 测试与质量

无自动化测试。管理面板为内部工具，通过手动测试验证。

## 常见问题 (FAQ)

**Q: 遗留数据文件是否还在使用？**
A: 不再被运行时使用。数据已迁移到 Turso。保留文件仅供回退或参考。`scripts/migrate-to-turso.js` 读取这些文件执行迁移。

**Q: 为什么 script.js 这么大？**
A: 管理面板是单文件 SPA 架构，所有功能（6 个资源的 CRUD UI）集中在一个文件中。

## 相关文件清单

- `admin/public/index.html` -- 管理面板主页
- `admin/public/login.html` -- 登录页
- `admin/public/script.js` -- 管理面板全部逻辑（~100KB SPA）
- `admin/public/style.css` -- 管理面板样式
- `admin/blog-posts-data.js` -- [遗留] 博客数据
- `admin/tool-library-data.js` -- [遗留] 工具数据
- `admin/gallery-data.js` -- [遗留] 画廊数据
- `admin/featured-works-data.js` -- [遗留] 精选作品数据
- `admin/morning-journal-data.js` -- [遗留] 日记数据
- `admin/journal-settings.js` -- [遗留] 日记设置
- `admin/auth-config.js` -- [遗留] 认证配置

## 变更记录 (Changelog)

### 2026-02-26 - 初始文档
- 由 init-architect 自动生成
