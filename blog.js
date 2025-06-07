document.addEventListener('DOMContentLoaded', () => {
    const blogTableBody = document.getElementById('blog-table-body'); // 获取表格主体

    // 检查 blogPosts 数据是否存在
    if (typeof window.blogPosts !== 'undefined' && Array.isArray(window.blogPosts)) {
        // 清空加载提示行
        blogTableBody.innerHTML = '';

        if (window.blogPosts.length > 0) {
            // 假设数据是按 id 降序排列（最新在前），如果不是，需要先排序
            // const sortedPosts = [...window.blogPosts].sort((a, b) => b.id - a.id); // 如果需要排序

            window.blogPosts.forEach(post => {
                const row = document.createElement('tr'); // 创建表格行

                // 使用数据文件中存在的字段
                const title = post.title || '无标题';
                const summary = post.summary || '无摘要';
                const link = post.link;
                const source = post.source || '未知来源';

                // 创建单元格并填充内容
                const sourceCell = document.createElement('td');
                sourceCell.textContent = source;

                const titleCell = document.createElement('td');
                titleCell.textContent = title;

                const summaryCell = document.createElement('td');
                summaryCell.textContent = summary; // 直接显示文本摘要

                const linkCell = document.createElement('td');
                if (link) {
                    const linkElement = document.createElement('a');
                    linkElement.href = link;
                    linkElement.textContent = '阅读原文'; // 或显示链接本身
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkCell.appendChild(linkElement);
                } else {
                    linkCell.textContent = '-'; // 如果没有链接
                }

                // 将单元格添加到行中
                row.appendChild(sourceCell);
                row.appendChild(titleCell);
                row.appendChild(summaryCell);
                row.appendChild(linkCell);

                // 将行添加到表格主体
                blogTableBody.appendChild(row);
            });
        } else {
             // 如果没有文章，显示提示信息行
            blogTableBody.innerHTML = '<tr><td colspan="4">暂无博客文章。</td></tr>';
        }
    } else {
        console.error('错误：博客文章数据 (window.blogPosts) 未找到或格式不正确。');
         // 如果加载出错，显示错误信息行
        blogTableBody.innerHTML = '<tr><td colspan="4">加载博客文章时出错。请稍后再试。</td></tr>';
    }
});