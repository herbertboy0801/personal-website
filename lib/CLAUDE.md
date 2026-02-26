[根目录](../CLAUDE.md) > **lib**

# Lib 模块 -- 共享工具库

## 模块职责

为 `api/` 层的所有 Serverless Functions 提供公共基础设施：数据库连接、JWT 认证、HTTP 响应工具和数据格式转换。

## 入口与启动

无独立入口，由 `api/*.js` 通过 ESM `import` 引用。

## 对外接口

### db.js -- 数据库连接

```javascript
export function getDb()  // 返回 @libsql/client 单例（懒初始化）
```

- 读取 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 环境变量
- 全局单例模式，多次调用返回同一 client

### auth.js -- JWT 认证

```javascript
export async function createToken(username)      // 签发 HS256 JWT，有效期 24h
export async function verifyToken(token)          // 验证 JWT，失败返回 null
export function setAuthCookie(res, token)          // 设置 httpOnly Secure cookie
export function clearAuthCookie(res)               // 清除认证 cookie
export function parseCookie(cookieHeader)          // 解析 Cookie 头为对象
export async function requireAuth(req, res)        // 中间件：校验 JWT 或返回 401
```

- Cookie 名称：`auth_token`
- Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Path=/`
- JWT 算法：HS256，密钥来自 `JWT_SECRET` 环境变量

### response.js -- HTTP 响应工具

```javascript
export function json(res, data, status = 200)           // 返回 JSON 成功响应
export function error(res, message, status = 500)        // 返回 JSON 错误响应
export function requireMethod(req, res, methods)         // 方法校验中间件
```

### transformers.js -- 数据格式转换

每种资源提供 `xxxFromDb(row)` 和 `xxxToDb(body)` 一对函数：

| 资源 | DB -> API | API -> DB |
|---|---|---|
| Blog | `blogFromDb(row)` | `blogToDb(body)` |
| Tool | `toolFromDb(row)` | `toolToDb(body)` |
| Gallery | `galleryFromDb(row)` | `galleryToDb(body)` |
| Works | `worksFromDb(row)` | `worksToDb(body)` |
| Journal | `journalFromDb(row)` | `journalToDb(body)` |
| JournalSettings | `journalSettingsFromDb(row)` | `journalSettingsToDb(body)` |

核心规则：DB 层 snake_case，API 层 camelCase。`featured` 字段 DB 存 0/1，API 返回 boolean。`tags` 字段 DB 存 JSON 字符串，API 返回数组。

## 关键依赖与配置

- `@libsql/client` -- Turso 数据库客户端
- `jose` -- JWT 签发与验证
- 依赖三个环境变量：`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`JWT_SECRET`

## 数据模型

transformers.js 定义了以下 camelCase API 模型：

**BlogPost**: `{ id, source, title, summary, link, featured, date, category, tags, dayNumber, readTime, difficulty }`

**Tool**: `{ id, name, description, url, icon, category, tags }`

**Gallery**: `{ id, src, title, description, style, featured }`

**Work**: `{ id, type, imageSrc, altText, title, description, tag, detailsLink }`

**Journal**: `{ id, date, harvest, plan, gratitude, investment, connect }`

**JournalSettings**: `{ referenceDate, referenceStreak, goalDays, goalReward, reminderTime }`

## 测试与质量

当前无测试。建议优先测试：
- `transformers.js`：所有 FromDb/ToDb 的边界情况（null、空数组、malformed JSON tags）
- `auth.js`：createToken/verifyToken 往返、过期令牌、parseCookie 解析
- `response.js`：各函数的 status code 和响应格式

## 常见问题 (FAQ)

**Q: 为什么用全局单例而非每次创建 DB client？**
A: Vercel Serverless Functions 可能在同一进程中处理多个请求（warm start），单例避免重复连接开销。

## 相关文件清单

- `lib/db.js` -- 数据库连接单例
- `lib/auth.js` -- JWT 认证全套（签发、验证、Cookie、中间件）
- `lib/response.js` -- HTTP 响应统一格式
- `lib/transformers.js` -- snake_case <-> camelCase 数据转换（6 种资源）

## 变更记录 (Changelog)

### 2026-02-26 - 初始文档
- 由 init-architect 自动生成
