[根目录](../CLAUDE.md) > **api**

# API 模块 -- Vercel Serverless Functions

## 模块职责

提供网站的所有后端 API 端点，以 Vercel Serverless Functions 形式部署。每个文件是一个独立的函数入口，通过 `vercel.json` 的 rewrites 实现 RESTful 风格路由。

## 入口与启动

每个 `.js` 文件导出 `default async function handler(req, res)`，由 Vercel 运行时自动调用。不需要手动启动。本地通过 `vercel dev` 运行。

所有函数配置 `maxDuration: 10` 秒（见 `vercel.json`）。

## 对外接口

### auth.js -- 认证

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/auth-status` | GET | 公开 | 检查登录状态 |
| `/api/login` | POST | 公开 | 登录（IP 限流：5次/15分钟） |
| `/api/logout` | POST | 公开 | 登出（清除 cookie） |
| `/api/change-password` | POST | 需认证 | 修改密码 |

### blog.js -- 博客文章

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/blog` | GET | 公开 | 获取所有文章（按日期降序） |
| `/api/blog` | POST | 需认证 | 创建文章 |
| `/api/blog/:id` | PUT | 需认证 | 更新文章 |
| `/api/blog/:id` | DELETE | 需认证 | 删除文章 |
| `/api/blog/featured` | POST | 需认证 | 批量设置精选文章 |

### tools.js -- 工具库

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/tools` | GET | 公开 | 获取所有工具 |
| `/api/tools` | POST | 需认证 | 创建工具 |
| `/api/tools/:id` | PUT | 需认证 | 更新工具 |
| `/api/tools/:id` | DELETE | 需认证 | 删除工具 |

### gallery.js -- AI 绘图画廊

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/gallery` | GET | 公开 | 获取所有画廊项 |
| `/api/gallery` | POST | 需认证 | 创建画廊项 |
| `/api/gallery/:id` | PUT | 需认证 | 更新画廊项 |
| `/api/gallery/:id` | DELETE | 需认证 | 删除画廊项 |

### works.js -- 精选作品

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/works` | GET | 公开 | 获取所有作品 |
| `/api/works` | POST | 需认证 | 创建作品 |
| `/api/works/:id` | PUT | 需认证 | 更新作品 |
| `/api/works/:id` | DELETE | 需认证 | 删除作品 |

### journal.js -- 晨间日记

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/journal` | GET | 公开 | 获取所有日记（按日期降序） |
| `/api/journal` | POST | 需认证 | 创建/覆盖日记（INSERT OR REPLACE） |
| `/api/journal/:id` | PUT | 需认证 | 更新日记 |
| `/api/journal/:id` | DELETE | 需认证 | 删除日记 |
| `/api/journal/import` | POST | 需认证 | 批量导入日记 |

### journal-settings.js -- 日记设置

| 路由 | 方法 | 权限 | 说明 |
|---|---|---|---|
| `/api/journal-settings` | GET | 公开 | 获取日记设置（单行表） |
| `/api/journal-settings` | PUT | 需认证 | 更新日记设置 |

## 关键依赖与配置

- 所有函数依赖 `../lib/db.js` 获取数据库连接
- 写操作通过 `../lib/auth.js` 的 `requireAuth()` 校验 JWT
- 响应统一使用 `../lib/response.js` 的 `json()` / `error()`
- 数据转换使用 `../lib/transformers.js` 的 `xxxFromDb()` / `xxxToDb()`
- 路由映射定义在根目录 `vercel.json` 的 `rewrites` 中

## 数据模型

详见 `scripts/setup-db.js`。API 层通过 transformers 做 snake_case (DB) <-> camelCase (API) 转换。

## 测试与质量

当前无自动化测试。建议优先为每个端点编写集成测试：
- 公开 GET 端点的正常响应
- 认证保护（未登录返回 401）
- CRUD 完整流程
- 输入验证（缺少必填字段返回 400）

## 常见问题 (FAQ)

**Q: 为什么 PUT/DELETE 使用 query 参数 `?id=xxx` 而非 URL 路径？**
A: Vercel Serverless Functions 不支持动态路由路径，通过 `vercel.json` 的 rewrites 将 `/api/blog/:id` 映射为 `/api/blog?id=:id`。

**Q: 如何新增一个 API 端点？**
A: 1) 在 `api/` 新建 `.js` 文件；2) 在 `vercel.json` 添加对应的 rewrites 规则；3) 如有新表，更新 `scripts/setup-db.js` 和 `lib/transformers.js`。

## 相关文件清单

- `api/auth.js` -- 认证（登录/登出/状态检查/改密码）
- `api/blog.js` -- 博客文章 CRUD + 精选管理
- `api/tools.js` -- 工具库 CRUD
- `api/gallery.js` -- AI 绘图画廊 CRUD
- `api/works.js` -- 精选作品 CRUD
- `api/journal.js` -- 晨间日记 CRUD + 批量导入
- `api/journal-settings.js` -- 日记设置 GET/PUT

## 变更记录 (Changelog)

### 2026-02-26 - 初始文档
- 由 init-architect 自动生成
