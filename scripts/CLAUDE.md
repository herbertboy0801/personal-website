[根目录](../CLAUDE.md) > **scripts**

# Scripts 模块 -- 数据库初始化与迁移

## 模块职责

提供一次性运行的数据库管理脚本：表结构创建和从旧数据文件到 Turso 的数据迁移。

## 入口与启动

```bash
npm run setup-db     # node scripts/setup-db.js -- 创建所有表
npm run migrate      # node scripts/migrate-to-turso.js -- 从 admin/*.js 数据文件迁移
```

两个脚本都会自动读取项目根目录的 `.env.local` 文件获取数据库凭据。

## 对外接口

无运行时接口。脚本仅在部署/维护时手动执行。

## 关键依赖与配置

- `@libsql/client` -- 直接创建 Turso 客户端（不使用 lib/db.js 的单例）
- 手动解析 `.env.local` 文件（不使用 dotenv 库）
- `migrate-to-turso.js` 使用 Node.js `vm` 模块解析旧数据文件中的 JS 对象

## 数据模型

`setup-db.js` 定义了完整的数据库 Schema（7 张表）：

| 表名 | 主键 | 说明 | 索引 |
|---|---|---|---|
| `blog_posts` | `id TEXT` | 博客文章 | date, category, featured |
| `tools` | `id TEXT` | 工具库 | category |
| `gallery` | `id TEXT` | AI 绘图画廊 | featured |
| `featured_works` | `id TEXT` | 精选作品 | 无 |
| `morning_journal` | `id TEXT` | 晨间日记 | date |
| `journal_settings` | `id INTEGER CHECK(id=1)` | 日记设置（单行） | 无 |
| `auth_config` | `id INTEGER CHECK(id=1)` | 认证配置（单行） | 无 |

所有表包含 `created_at` 和 `updated_at` 时间戳字段（默认 `datetime('now')`）。

## 测试与质量

无自动化测试。脚本执行后会打印每张表的创建结果或迁移行数作为验证。`migrate-to-turso.js` 结尾有 `verify()` 函数打印各表行数。

## 常见问题 (FAQ)

**Q: 脚本可以重复执行吗？**
A: `setup-db.js` 使用 `CREATE TABLE IF NOT EXISTS`，可安全重复执行。`migrate-to-turso.js` 使用 `INSERT OR REPLACE`，重复执行会覆盖已有数据。

**Q: 如何添加新表？**
A: 在 `setup-db.js` 的 `SCHEMA` 数组中添加 `CREATE TABLE` 语句，然后运行 `npm run setup-db`。

## 相关文件清单

- `scripts/setup-db.js` -- 建表脚本（7 表 + 索引）
- `scripts/migrate-to-turso.js` -- 数据迁移脚本（读取 admin/*.js 写入 Turso）

## 变更记录 (Changelog)

### 2026-02-26 - 初始文档
- 由 init-architect 自动生成
