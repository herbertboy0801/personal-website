// personal-website/generate-blog-list.js
document.addEventListener('DOMContentLoaded', () => {
  const blogListContainer = document.querySelector('#blog-summary .blog-posts-grid');

  if (!blogListContainer) {
    console.error('Blog list container not found!');
    return;
  }

  // Clear any potential placeholder content if needed
  // blogListContainer.innerHTML = ''; // Optional: Uncomment if you have placeholders

  if (typeof blogPosts === 'undefined' || !Array.isArray(blogPosts)) {
      console.error('blogPosts data is not available or not an array.');
      // Display a message to the user in the container
      blogListContainer.innerHTML = '<p>无法加载博客列表数据。</p>';
      return;
  }


  blogPosts.forEach(post => {
    const article = document.createElement('article');
    article.classList.add('blog-post-summary');

    // Determine source class based on the source string
    let sourceClass = '';
    if (post.source === '小红书') {
      sourceClass = 'source-xiaohongshu';
    } else if (post.source === '公众号') {
      sourceClass = 'source-gongzhonghao';
    }
    if (sourceClass) {
        article.classList.add(sourceClass);
    }


    // Create source label span
    const sourceLabel = document.createElement('span');
    sourceLabel.classList.add('source-label');
    sourceLabel.textContent = post.source;

    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = post.title;

    // Create summary paragraph
    const summary = document.createElement('p');
    summary.textContent = post.summary;
    // Add comment back if needed:
    // summary.innerHTML += ' <!-- TODO: 更新为实际博客摘要 -->';

    // Create details link
    const link = document.createElement('a');
    link.href = post.link;
    link.classList.add('details-link');
    link.target = '_blank'; // Open in new tab
    link.rel = 'noopener noreferrer';
    link.textContent = '阅读全文 →';

    // Append elements to the article
    article.appendChild(sourceLabel);
    article.appendChild(heading);
    article.appendChild(summary);
    article.appendChild(link);

    // Append the article to the container
    blogListContainer.appendChild(article);
  });
});