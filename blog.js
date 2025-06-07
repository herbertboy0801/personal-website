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

                // 简单的 Markdown -> HTML 转换 (仅支持段落和加粗)
                // 注意：这非常基础，不支持所有 Markdown 功能。
                // 如果需要更复杂的 Markdown，应考虑使用库如 marked.js
                let contentHtml = post.content
                    .split('\n\n') // 按双换行分割段落
                    .map(paragraph => `<p>${paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`) // 处理加粗
                    .join('');

                // 截断内容以显示摘要 (可选，如果需要显示全文则移除)
                // const summaryLength = 150; // 摘要长度
                // if (contentHtml.length > summaryLength) {
                //     contentHtml = contentHtml.substring(0, summaryLength) + '...';
                // }

                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p class="post-meta">发布于 ${post.date}</p>
                    <div class="post-content">${contentHtml}</div>
                    ${post.tags && post.tags.length > 0 ? `<p class="post-tags">标签: ${post.tags.join(', ')}</p>` : ''}
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