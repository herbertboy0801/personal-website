document.addEventListener('DOMContentLoaded', () => {
    const blogListContainer = document.getElementById('blog-list-container');

    // 检查 blogPosts 数据是否存在
    if (typeof window.blogPosts !== 'undefined' && Array.isArray(window.blogPosts)) {
        // 清空加载提示
        blogListContainer.innerHTML = '';

        if (window.blogPosts.length > 0) {
            // 假设数据是按 id 降序排列（最新在前），如果不是，需要先排序
            // const sortedPosts = [...window.blogPosts].sort((a, b) => b.id - a.id); // 如果需要排序

            window.blogPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('blog-post-card'); // 使用与首页摘要相同的样式

                // 使用数据文件中存在的字段
                const title = post.title || '无标题';
                const summary = post.summary || '无摘要';
                const link = post.link;
                const source = post.source || '未知来源';

                // 直接使用 summary 作为内容，不需要 Markdown 转换
                const contentHtml = `<p>${summary}</p>`; // 将摘要包裹在 p 标签中

                postElement.innerHTML = `
                    <h3>${title}</h3>
                    <p class="post-meta">来源: ${source}</p> <!-- 显示来源，替代日期 -->
                    <div class="post-content">${contentHtml}</div>
                    ${link ? `<p><a href="${link}" target="_blank" rel="noopener noreferrer">阅读原文 &rarr;</a></p>` : ''} <!-- 添加原文链接 -->
                `;
                blogListContainer.appendChild(postElement);
            });
        } else {
            blogListContainer.innerHTML = '<p>暂无博客文章。</p>';
        }
    } else {
        console.error('错误：博客文章数据 (window.blogPosts) 未找到或格式不正确。');
        blogListContainer.innerHTML = '<p>加载博客文章时出错。请稍后再试。</p>';
    }
});