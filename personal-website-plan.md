# Personal Website Optimization Plan (2025-06-04)

## Goal
Update the personal website's main page ([`personal-website/index.html`](personal-website/index.html:1)) to include all tools from the [`personal-website/tools/`](personal-website/tools/) directory and ensure all links are correct and functional.

## Confirmed Adjustments

1.  **Add New Tools to "实用工具" Category:**
    *   文本加密: Link to [`tools/wenbenjiami.html`](personal-website/tools/wenbenjiami.html)
    *   财务工具: Link to [`tools/finance-tool/finance-tool.html`](personal-website/tools/finance-tool/finance-tool.html)
    *   透明度调整: Link to [`tools/Transparency adjustment/Transparency adjustment.html`](personal-website/tools/Transparency%20adjustment/Transparency%20adjustment.html)
2.  **Correct "晨间日记" (Morning Journal):**
    *   Update the logo image `src` in the "重点推荐" section ([`line 125`](personal-website/index.html:125)) from [`tools/drawing-app/logo.png`](personal-website/tools/drawing-app/logo.png) to [`tools/journal/logo.png`](personal-website/tools/journal/logo.png).
    *   Update the button link `href` in the "重点推荐" section ([`line 128`](personal-website/index.html:128)) from [`tools/drawing-app/index.html`](personal-website/tools/drawing-app/index.html) to [`tools/journal/journal.html`](personal-website/tools/journal/journal.html).
    *   Update the "晨间日记" link `href` in the "实用工具" category ([`line 176`](personal-website/index.html:176)) from [`tools/drawing-app/index.html`](personal-website/tools/drawing-app/index.html) to [`tools/journal/journal.html`](personal-website/tools/journal/journal.html).
3.  **File Cleanup:**
    *   Delete the redundant file: [`personal-website/tools/photo_wall.html`](personal-website/tools/photo_wall.html).

## Execution Plan (Mermaid Diagram)

```mermaid
graph TD
    A[开始] --> B{分析 tools 目录和 index.html};
    B --> C{识别未添加工具和问题};
    C --> D{向用户确认};
    D -- 用户反馈 --> E{制定最终修改方案};
    E --> F{切换到 Code 模式};
    F --> G[1. 修改 index.html: 更新晨间日记链接和 Logo];
    G --> H[2. 修改 index.html: 添加新工具链接到实用工具分类];
    H --> I[3. 删除 tools/photo_wall.html];
    I --> J{4. 验证修改 (可选, 启动浏览器检查)};
    J --> K[完成];
```

## Detailed Steps (for Code Mode)

1.  **Modify [`personal-website/index.html`](personal-website/index.html:1):**
    *   Apply diffs to update lines 125, 128, and 176 for "晨间日记".
    *   Apply diff to insert new list items for "文本加密", "财务工具", and "透明度调整" within the "实用工具" `div.tool-list`.
2.  **Delete File:**
    *   Use a command execution tool (if available in Code mode) or request manual deletion for [`personal-website/tools/photo_wall.html`](personal-website/tools/photo_wall.html). (Note: Architect mode doesn't have file deletion tool, Code mode might).
3.  **Verification (Optional):**
    *   Use `browser_action` or `start personal-website/index.html` command to open the page.
    *   Visually inspect the changes and test the links.