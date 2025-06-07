// personal-website/admin/morning-journal-data.js

// 确保在 Node.js 环境和浏览器环境都能工作
if (typeof window === 'undefined') {
  // 在 Node.js 环境中运行时，模拟一个 window 对象
  // 这样我们可以在 server.js 中使用 vm.runInNewContext 来加载和解析这个文件
  // 同时保持与浏览器环境的兼容性 (浏览器直接使用全局 window)
  global.window = {};
}

// 晨间日记设置 (可以根据需要扩展)
window.morningJournalSettings = {
  // 示例：可以添加模板、提醒等设置
  // template: "今日感恩：\n今日计划：\n昨日反思：",
};

// 晨间日记条目数组
// 每个条目应包含 id, date, content
window.morningJournalEntries = [
  // 这里可以放一些初始的示例数据，或者留空由管理员添加
  // { id: 1, date: "2024-06-06", content: "今天天气很好，心情愉悦。\n计划完成项目 A。\n反思了昨天的沟通方式。" },
  // { id: 2, date: "2024-06-07", content: "学习了新的 Node.js 知识。\n计划阅读技术文章。\n感恩帮助我的同事。" }
];

// Node.js 环境导出 (用于后端 server.js 读取数据)
// 检查是否在 Node.js 环境中 (存在 module 和 module.exports)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    morningJournalSettings: window.morningJournalSettings,
    morningJournalEntries: window.morningJournalEntries
  };
}