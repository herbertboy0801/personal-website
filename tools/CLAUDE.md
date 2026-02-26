[根目录](../CLAUDE.md) > **tools**

# Tools 模块 -- 独立工具与游戏集合

## 模块职责

收录 22+ 个独立的前端工具和小游戏页面。每个工具是自包含的 HTML 页面（部分带配套 CSS/JS），不依赖主站后端 API，可独立访问。

## 入口与启动

每个工具通过 URL 直接访问：`/tools/{tool-name}.html` 或 `/tools/{tool-dir}/index.html`。

Vercel 为 `/tools/*` 设置了 1 天缓存（`Cache-Control: public, max-age=86400`）。

## 工具清单

### 单文件工具（直接 HTML）

| 文件 | 工具名称 |
|---|---|
| `html_previewer.html` | HTML 预览器 |
| `qrcode_generator.html` | 二维码生成器 |
| `word_count_tool.html` | 字数统计工具 |
| `bmi_calculator.html` | BMI 计算器 |
| `smart_memo.html` | 智能备忘录 |
| `currency_converter.html` | 汇率转换器 |
| `image_editor.html` | 图片编辑器 |
| `background-remover.html` | 背景去除工具 |
| `random_decision_tool.html` | 随机决策工具 |
| `wenbenjiami.html` | 文本加密工具 |

### 多文件工具/游戏

| 目录 | 工具名称 | 文件构成 |
|---|---|---|
| `memory-game/` | 记忆翻牌游戏 | HTML |
| `photo-gallery/` | 照片墙 | HTML + 背景音乐 |
| `watermark-tool/` | 水印工具 | HTML + 开发文档 |
| `wordle-game/` | Wordle 猜词游戏 | HTML + CSS + JS |
| `unit-converter/` | 单位转换器 | HTML |
| `holiday-countdown/` | 节日倒计时 | HTML |
| `enhanced-tetris/` | 增强版俄罗斯方块 | HTML |
| `snake-game/` | 贪吃蛇游戏 | HTML + CSS + JS + Netlify 后端 |
| `my-raiden-game/` | 雷电射击游戏 | HTML + CSS + 9 个 JS 模块 |
| `drawing-app/` | 画板应用 | HTML + CSS + JS |
| `falling-objects-game/` | 接物游戏 | HTML + CSS + JS |
| `finance-tool/` | 理财工具 | HTML (含图片编辑器副本) |
| `Transparency adjustment/` | 透明度调节 | HTML + CSS + JS |

## 关键依赖与配置

- 无后端依赖（纯前端）
- 部分工具可能内联引用 CDN 库（如 QRCode.js、DOMPurify 等）
- `snake-game/` 例外：包含独立的 Netlify Functions 后端（排行榜功能），有自己的 `package.json` 和 `node_modules`

## 数据模型

无数据库交互。工具数据存储在浏览器 localStorage 或仅在页面会话内存在。

## 测试与质量

无自动化测试。各工具为独立页面，相互不影响。

## 常见问题 (FAQ)

**Q: 新增工具后如何在网站显示？**
A: 工具页面本身直接部署可访问。要在工具库列表页显示，需通过管理后台 `/admin` 创建工具条目（写入 Turso `tools` 表），设置 `url` 指向工具页面路径。

**Q: snake-game 的 Netlify 后端是什么？**
A: 这是贪吃蛇游戏的独立部署版本，排行榜和玩家计数功能通过 Netlify Functions + Netlify Blobs 实现，与主站 Vercel 架构无关。

## 相关文件清单

共 ~32 个源文件（不含 snake-game/node_modules）。完整清单见上方工具清单表格。

## 变更记录 (Changelog)

### 2026-02-26 - 初始文档
- 由 init-architect 自动生成
