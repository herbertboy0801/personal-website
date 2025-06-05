// personal-website/generate-learning-diary.js
document.addEventListener('DOMContentLoaded', () => {
  const diaryListContainer = document.querySelector('#learning-diary-list'); // Target the container ID

  if (!diaryListContainer) {
    // Don't log an error if the element simply isn't on the current page
    // console.error('Learning diary list container (#learning-diary-list) not found!');
    return;
  }

  if (typeof learningDiaryData === 'undefined' || !Array.isArray(learningDiaryData)) {
      console.error('learningDiaryData is not available or not an array.');
      diaryListContainer.innerHTML = '<p>无法加载学习日记数据。</p>';
      return;
  }

  // Clear any potential placeholder content
  // diaryListContainer.innerHTML = ''; // Optional

  if (learningDiaryData.length === 0) {
      diaryListContainer.innerHTML = '<p>暂无学习日记。</p>';
      return;
  }

  learningDiaryData.forEach(entry => {
    const article = document.createElement('article');
    article.classList.add('diary-entry'); // Add a class for styling if needed

    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = entry.title;

    // Create summary paragraph
    const summary = document.createElement('p');
    summary.textContent = entry.summary;

    // Append elements to the article
    article.appendChild(heading);
    article.appendChild(summary);

    // Create and append link only if it exists
    if (entry.link && entry.link !== '#') { // Check if link is provided and not just a placeholder
        const link = document.createElement('a');
        link.href = entry.link;
        link.classList.add('details-link'); // Reuse existing class or create a new one
        link.target = '_blank'; // Open in new tab
        link.rel = 'noopener noreferrer';
        link.textContent = '相关链接 →';
        article.appendChild(link);
    }

    // Append the article to the container
    diaryListContainer.appendChild(article);
  });
});