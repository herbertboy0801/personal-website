# 精选作品管理工具测试计划

本计划旨在验证个人网站后台的精选作品管理工具是否按预期工作。

## 先决条件

1.  后台服务已在本地运行：`node personal-website/admin/server.js` (监听端口 3000)。
2.  知晓管理页面的访问密码：`123456`。

## 测试步骤

1.  **访问管理页面：** 使用浏览器访问 `http://localhost:3000`。
2.  **身份验证：** 在弹出的提示框中输入密码 `123456`。
3.  **检查初始加载：** 验证页面是否成功加载，并且“精选作品管理”区域是否正确显示了当前 `featured-works-data.js` 文件中的作品列表。
4.  **测试添加新作品：**
    *   在“添加/编辑精选作品”表单中填写所有字段（例如：类型 `test-type`，标题 `我的测试作品` 等）。
    *   点击“保存作品”按钮。
    *   **验证：** 新作品是否出现在列表中？
5.  **测试编辑现有作品：**
    *   选择列表中的一个现有作品（例如第一个），点击“编辑”按钮。
    *   **验证：** 表单是否填充了该作品的数据？
    *   修改表单中的某个字段（例如标题）。
    *   点击“保存作品”按钮。
    *   **验证：** 列表中的对应作品信息是否已更新？表单是否清空？
6.  **测试删除作品：**
    *   选择之前添加的“我的测试作品”，点击“删除”按钮。
    *   在确认对话框中点击“确定”。
    *   **验证：** 该作品是否已从列表中移除？

## 测试流程图 (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant Roo (Architect)
    participant Roo (Code/Browser)
    participant Browser
    participant AdminServer (localhost:3000)
    participant DataFile (featured-works-data.js)

    User->>Roo (Architect): 请确认精选作品管理工具是否可用
    Roo (Architect)->>Roo (Architect): 分析代码 (server.js, script.js, index.html, data.js)
    Roo (Architect)-->>User: 制定测试计划并请求确认
    User-->>Roo (Architect): 同意计划
    Roo (Architect)->>Roo (Architect): 请求切换到 Code/Browser 模式
    Roo (Architect)-->>User: (用户批准切换)
    Roo (Code/Browser)->>Browser: 导航到 http://localhost:3000
    Browser-->>Roo (Code/Browser): 显示页面 (请求密码)
    Roo (Code/Browser)->>Browser: 输入密码 '123456'
    Browser->>AdminServer: GET /api/works
    AdminServer->>DataFile: 读取 featuredWorksData
    DataFile-->>AdminServer: 返回数据
    AdminServer-->>Browser: 返回作品列表 JSON
    Browser-->>Roo (Code/Browser): 渲染并显示作品列表 (验证步骤 3)
    Roo (Code/Browser)-->>Roo (Code/Browser): (执行添加、编辑、删除测试)
    loop 测试流程
        %% 添加测试 (步骤 4) %%
        Roo (Code/Browser)->>Browser: 填写添加表单, 点击保存
        Browser->>AdminServer: POST /api/works + 新数据
        AdminServer->>DataFile: 读写数据
        DataFile-->>AdminServer: 确认
        AdminServer-->>Browser: 返回成功
        Browser->>AdminServer: GET /api/works (刷新列表)
        AdminServer->>DataFile: 读数据
        AdminServer-->>Browser: 返回列表
        Browser-->>Roo (Code/Browser): 渲染列表 (验证新项添加)

        %% 编辑测试 (步骤 5) %%
        Roo (Code/Browser)->>Browser: 点击编辑按钮
        Browser-->>Roo (Code/Browser): 填充表单 (验证填充)
        Roo (Code/Browser)->>Browser: 修改表单, 点击保存
        Browser->>AdminServer: PUT /api/works/:index + 修改后数据
        AdminServer->>DataFile: 读写数据
        DataFile-->>AdminServer: 确认
        AdminServer-->>Browser: 返回成功
        Browser->>AdminServer: GET /api/works (刷新列表)
        AdminServer->>DataFile: 读数据
        AdminServer-->>Browser: 返回列表
        Browser-->>Roo (Code/Browser): 渲染列表 (验证修改)

        %% 删除测试 (步骤 6) %%
        Roo (Code/Browser)->>Browser: 点击删除按钮
        Browser-->>Roo (Code/Browser): 弹出确认框
        Roo (Code/Browser)->>Browser: 确认删除
        Browser->>AdminServer: DELETE /api/works/:index
        AdminServer->>DataFile: 读写数据
        DataFile-->>AdminServer: 确认
        AdminServer-->>Browser: 返回成功
        Browser->>AdminServer: GET /api/works (刷新列表)
        AdminServer->>DataFile: 读数据
        AdminServer-->>Browser: 返回列表
        Browser-->>Roo (Code/Browser): 渲染列表 (验证删除)
    end
    Roo (Code/Browser)->>Roo (Architect): 报告测试结果
    Roo (Architect)-->>User: 总结测试结果