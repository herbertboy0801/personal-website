# GitHub 更新计划

**目标：** 将 `personal-website` 目录下的所有最新更改（包括 `admin` 工具和通过该工具更新的内容）同步到 GitHub 远程仓库。

**计划步骤：**

1.  **检查状态 (Git Status):** 确认当前 Git 仓库的状态，查看有哪些文件被修改或新增了。
2.  **添加更改 (Git Add):** 将所有相关的更改（包括 `admin` 目录下的文件和你使用工具更新的数据文件，例如 `featured-works-data.js` 等）添加到 Git 的暂存区。
3.  **提交更改 (Git Commit):** 创建一个 Git 提交，记录这次更新的内容，例如 "更新精选作品和管理工具"。
4.  **推送更改 (Git Push):** 将本地的提交推送到 GitHub 上的远程仓库。

**可视化流程 (Mermaid Sequence Diagram):**

```mermaid
sequenceDiagram
    participant User as 你
    participant Roo as 我 (Architect Mode)
    participant Git as Git 操作 (需切换到 Code Mode 执行)
    participant GitHub

    User->>Roo: 请求更新 GitHub
    Roo->>User: 确认 Git 仓库状态
    User->>Roo: 确认是 Git 仓库且已配置远程
    Roo->>User: 制定更新计划
    User->>Roo: 同意计划
    Roo->>User: 建议切换到 Code Mode
    User->>Git: (切换到 Code Mode 后) 执行 git status
    Git-->>User: 显示状态 (待添加/修改的文件)
    User->>Git: 执行 git add .
    Git-->>User: 文件已暂存
    User->>Git: 执行 git commit -m "更新精选作品和管理工具"
    Git-->>User: 更改已提交
    User->>Git: 执行 git push
    Git->>GitHub: 推送提交
    GitHub-->>Git: 确认接收
    Git-->>User: 推送成功