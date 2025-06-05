// personal-website/generate-featured-works.js
document.addEventListener('DOMContentLoaded', () => {
  const worksGridContainer = document.querySelector('#featured-works .works-grid');

  if (!worksGridContainer) {
    console.error('Featured works grid container not found!');
    return;
  }

  if (typeof featuredWorksData === 'undefined' || !Array.isArray(featuredWorksData)) {
    console.error('featuredWorksData is not available or not an array.');
    worksGridContainer.innerHTML = '<p>无法加载精选作品数据。</p>';
    return;
  }

  // Clear any potential placeholder content
  // worksGridContainer.innerHTML = ''; // Optional

  featuredWorksData.forEach(work => {
    // Create the main card div
    const workCard = document.createElement('div');
    workCard.classList.add('work-card');
    // Optionally add a type-specific class if needed for styling
    // if (work.type) {
    //   workCard.classList.add(`work-type-${work.type}`);
    // }

    // Create image element
    const img = document.createElement('img');
    img.src = work.imageSrc;
    img.alt = work.altText;
    // Add comment back if needed:
    // img.insertAdjacentHTML('afterend', ' <!-- 使用实际图片 -->');

    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = work.title;

    // Create description paragraph
    const description = document.createElement('p');
    description.textContent = work.description;

    // Create tech tag span
    const tag = document.createElement('span');
    tag.classList.add('tech-tag');
    tag.textContent = work.tag;
    // Add comment back if needed:
    // tag.insertAdjacentHTML('afterend', ' <!-- [待更新标签] -->');

    // Create details link
    const link = document.createElement('a');
    link.href = work.detailsLink;
    link.classList.add('details-link');
    link.textContent = '查看详情 →';
    // Add comment back if needed:
    // link.insertAdjacentHTML('afterend', ' <!-- [待更新链接] -->');

    // Append elements to the card
    workCard.appendChild(img);
    workCard.appendChild(heading);
    workCard.appendChild(description);
    workCard.appendChild(tag);
    workCard.appendChild(link);

    // Append the card to the grid container
    worksGridContainer.appendChild(workCard);
  });

  // Optionally, add back the placeholder comment if desired
  // worksGridContainer.insertAdjacentHTML('beforeend', `
  //         <!-- 更多作品卡片占位符 -->
  //         <!--
  //         <div class="work-card">
  //           <img src="placeholder-image.jpg" alt="作品预览图">
  //           <h3>作品标题 [待更新]</h3>
  //           <p>[请在此处添加具体作品描述]</p>
  //           <span class="tech-tag">[标签]</span>
  //           <a href="#" class="details-link">查看详情 →</a>
  //         </div>
  //         -->
  // `);
});