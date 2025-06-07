// ==========================================================================
// 合并后的 JavaScript 文件 (main.js)
// 包含来自以下文件的内容:
// - blog-data.js
// - featured-works-data.js
// - learning-diary-data.js
// - tool-library-data.js
// - generate-blog-list.js
// - generate-featured-works.js
// - generate-learning-diary.js
// - generate-tool-library.js
// - lightbox.js
// ==========================================================================

// ==========================================================================
// == 内容来自: blog-data.js ==
// ==========================================================================
// const blogPosts = []; // Removed hardcoded data
// ==========================================================================
// == 结束: blog-data.js ==
// ==========================================================================


// ==========================================================================
// == 内容来自: featured-works-data.js ==
// ==========================================================================
// const featuredWorksData = []; // Removed hardcoded data
// ==========================================================================
// == 结束: featured-works-data.js ==
// ==========================================================================


// ==========================================================================
// == 内容来自: learning-diary-data.js ==
// ==========================================================================
const learningDiaryData = [
  {
    "title": "测试日记标题",
    "summary": "这是测试日记的内容概要。",
    "link": ""
  }
];
// ==========================================================================
// == 结束: learning-diary-data.js ==
// ==========================================================================


// ==========================================================================
// == 内容来自: tool-library-data.js ==
// ==========================================================================
// const toolLibraryData = []; // Removed hardcoded data
// ==========================================================================
// == 结束: tool-library-data.js ==
// ==========================================================================


// ==========================================================================
// == DOMContentLoaded 事件监听器 (整合逻辑) ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // 定义博客渲染函数 (移到 DOMContentLoaded 内部)
    function renderBlogPosts() {
        console.log("--- Executing renderBlogPosts function ---"); // DEBUG: Check execution
        const blogListContainer = document.querySelector('#blog-summary .blog-posts-grid');
        console.log("Blog list container found:", blogListContainer); // DEBUG: Check container element

        if (!blogListContainer) {
            console.error('Blog list container not found!');
            return;
        }

        blogListContainer.innerHTML = ''; // Clear container

        // Use global data directly
        const blogPosts = window.blogPosts || []; // Corrected variable name
        console.log("Checking window.blogPosts inside function:", window.blogPosts); // DEBUG: Check data availability
        console.log("Assigned blogPosts variable:", blogPosts); // DEBUG: Check assigned variable

        if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
             console.log("No blog posts found or data is not an array. Rendering '暂无'."); // DEBUG: Check condition
             blogListContainer.innerHTML = '<p>暂无博客文章。</p>';
             return;
        }
        console.log(`Found ${blogPosts.length} blog posts. Rendering...`); // DEBUG: Confirm rendering start

        // Use global data (blogPosts) to render
        blogPosts.forEach(post => {
            const article = document.createElement('article');
            article.classList.add('blog-post-summary');
            let sourceClass = '';
                if (post.source === '小红书') {
                    sourceClass = 'source-xiaohongshu';
                } else if (post.source === '公众号') {
                    sourceClass = 'source-gongzhonghao';
                }
                if (sourceClass) {
                    article.classList.add(sourceClass);
                }
                const sourceLabel = document.createElement('span');
                sourceLabel.classList.add('source-label');
                sourceLabel.textContent = post.source;
                const heading = document.createElement('h3');
                heading.textContent = post.title;
                const summary = document.createElement('p');
                summary.textContent = post.summary;
                const link = document.createElement('a');
                link.href = post.link;
                link.classList.add('details-link');
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '阅读全文 →';
                article.appendChild(sourceLabel);
                article.appendChild(heading);
                article.appendChild(summary);
                article.appendChild(link);
                blogListContainer.appendChild(article);
            });
    } // End renderBlogPosts function definition

    // --- 调用博客渲染函数 ---
    renderBlogPosts();

    // --- 逻辑来自: generate-featured-works.js ---
    (() => { // Removed async
        const worksGridContainer = document.querySelector('#featured-works .works-grid');
        if (!worksGridContainer) {
            console.error('Featured works grid container not found!');
            return;
        }

        worksGridContainer.innerHTML = ''; // Clear container

        // Use global data directly
        const worksData = window.featuredWorksData || [];

        if (!Array.isArray(worksData) || worksData.length === 0) {
             worksGridContainer.innerHTML = '<p>暂无精选作品。</p>';
             return;
        }

        // Use global data (worksData) to render
        worksData.forEach(work => {
            const workCard = document.createElement('div');
            workCard.classList.add('work-card');
            const img = document.createElement('img');
                // 注意：API 返回的可能是相对路径，需要确保它们相对于网站根目录是正确的
                // 如果 API 返回的是 admin 目录下的路径，可能需要调整
                img.src = work.imageSrc; // Assuming API returns correct path relative to website root
                img.alt = work.altText;
                const heading = document.createElement('h3');
                heading.textContent = work.title;
                const description = document.createElement('p');
                description.textContent = work.description;
                const tag = document.createElement('span');
                tag.classList.add('tech-tag');
                tag.textContent = work.tag;
                const link = document.createElement('a');
                link.href = work.imageSrc; // Link directly to the image source
                link.target = '_blank'; // Open in a new tab
                link.rel = 'noopener noreferrer'; // Security best practice for target="_blank"
                link.classList.add('details-link');
                link.textContent = '查看详情 →';
                workCard.appendChild(img);
                workCard.appendChild(heading);
                workCard.appendChild(description);
                workCard.appendChild(tag);
                workCard.appendChild(link);
                worksGridContainer.appendChild(workCard);
            });
        // Removed try...catch block for fetch
    })(); // End IIFE for featured works

    // --- 逻辑来自: generate-learning-diary.js ---
    (() => {
        const diaryListContainer = document.querySelector('#learning-diary-list');
        if (!diaryListContainer) {
            return; // Element might not be on the page
        }
        if (typeof learningDiaryData === 'undefined' || !Array.isArray(learningDiaryData)) {
            console.error('learningDiaryData is not available or not an array.');
            diaryListContainer.innerHTML = '<p>无法加载学习日记数据。</p>';
            return;
        }
        if (learningDiaryData.length === 0) {
            diaryListContainer.innerHTML = '<p>暂无学习日记。</p>';
            return;
        }
        learningDiaryData.forEach(entry => {
            const article = document.createElement('article');
            article.classList.add('diary-entry');
            const heading = document.createElement('h3');
            heading.textContent = entry.title;
            const summary = document.createElement('p');
            summary.textContent = entry.summary;
            article.appendChild(heading);
            article.appendChild(summary);
            if (entry.link && entry.link !== '#') {
                const link = document.createElement('a');
                link.href = entry.link;
                link.classList.add('details-link');
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '相关链接 →';
                article.appendChild(link);
            }
            diaryListContainer.appendChild(article);
        });
    })(); // IIFE to scope variables

    // --- 逻辑来自: generate-tool-library.js ---
    (() => { // Removed async
        const categoriesNavContainer = document.getElementById('tool-categories-nav');
        const toolListContainer = document.getElementById('tool-list-container');
        const searchInput = document.getElementById('tool-search-input');
        const paginationContainer = document.getElementById('pagination-container');

        console.log("Tool Library Elements:", { categoriesNavContainer, toolListContainer, searchInput, paginationContainer }); // DEBUG

        if (!categoriesNavContainer || !toolListContainer || !searchInput || !paginationContainer) {
            console.error('Tool library elements not found. Skipping initialization.'); // DEBUG
            return; // Exit if essential elements are missing
        }

        const itemsPerPage = 4;
        let currentPage = 1;
        let currentCategory = '全部';
        let currentSearchTerm = '';
        let filteredToolsCache = [];
        // Use global data directly
        const toolsData = window.toolLibraryData || [];
        console.log("Using global tools data:", toolsData); // DEBUG

        // --- Initial Render ---
        toolListContainer.innerHTML = ''; // Clear container
        categoriesNavContainer.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (!Array.isArray(toolsData)) {
             console.error('Global tools data is not an array:', toolsData);
             toolListContainer.innerHTML = '<p>工具数据格式不正确。</p>';
             return; // Stop if data is invalid
        }

        console.log("Rendering initial categories and tools..."); // DEBUG
        renderCategories(); // Render categories based on global data
        renderToolList();   // Render the first page of tools
        searchInput.addEventListener('input', handleSearchInput); // Add listener

        // Removed try...catch...finally block for fetch

        function renderCategories() {
            // Uses the 'toolsData' variable from the IIFE scope (now assigned from window.toolLibraryData)
            const categoryIcons = {
                '全部': 'apps', 'AI 生成': 'auto_awesome', '开发工具': 'code',
                '效率助手': 'checklist', '图像影音处理': 'perm_media', '休闲娱乐': 'stadia_controller'
            };
            const availableCategories = ['全部', ...new Set(toolsData.map(tool => tool.category))];
            const sortedCategories = Object.keys(categoryIcons).filter(cat => availableCategories.includes(cat));

            categoriesNavContainer.innerHTML = '<h3>工具分类</h3>';
            const ul = document.createElement('ul');
            const fragment = document.createDocumentFragment();

            sortedCategories.forEach(category => {
                const li = document.createElement('li');
                li.className = 'category-item';
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.category = category;
                const iconSpan = document.createElement('span');
                iconSpan.className = 'material-symbols-outlined category-icon';
                iconSpan.textContent = categoryIcons[category] || 'category';
                iconSpan.style.marginRight = '0.6em';
                iconSpan.style.verticalAlign = 'bottom';
                const textSpan = document.createElement('span');
                textSpan.textContent = category;
                a.appendChild(iconSpan);
                a.appendChild(textSpan);
                if (category === currentCategory) {
                    li.classList.add('active');
                }
                li.appendChild(a);
                fragment.appendChild(li);
            });
            ul.appendChild(fragment);
            categoriesNavContainer.appendChild(ul);
            categoriesNavContainer.removeEventListener('click', handleCategoryClick); // Ensure no duplicates
            categoriesNavContainer.addEventListener('click', handleCategoryClick);
        }

        function renderToolList() {
            // Uses the 'toolsData' variable from the IIFE scope
            let filteredByCategory = currentCategory === '全部'
                ? toolsData // Use scoped variable
                : toolsData.filter(tool => tool.category === currentCategory); // Use scoped variable
            const lowerSearchTerm = currentSearchTerm.toLowerCase().trim();
            filteredToolsCache = lowerSearchTerm === ''
                ? filteredByCategory
                : filteredByCategory.filter(tool =>
                    tool.name.toLowerCase().includes(lowerSearchTerm) ||
                    (tool.description && tool.description.toLowerCase().includes(lowerSearchTerm)) ||
                    (tool.tags && Array.isArray(tool.tags) && tool.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) // Added check for Array.isArray
                  );
            const totalItems = filteredToolsCache.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const itemsToDisplay = filteredToolsCache.slice(startIndex, endIndex);
            toolListContainer.innerHTML = ''; // Clear previous items
            if (itemsToDisplay.length === 0) {
                toolListContainer.innerHTML = '<p>没有找到匹配的工具。</p>';
            } else {
                const fragment = document.createDocumentFragment();
                itemsToDisplay.forEach(tool => {
                    const toolCard = document.createElement('div');
                    toolCard.className = 'tool-card';
                    const cardHeader = document.createElement('div');
                    cardHeader.className = 'card-header';
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'material-symbols-outlined tool-icon';
                    iconSpan.textContent = tool.icon || 'category';
                    const title = document.createElement('h3');
                    title.textContent = tool.name;
                    cardHeader.appendChild(iconSpan);
                    cardHeader.appendChild(title);
                    const description = document.createElement('p');
                    description.className = 'tool-description';
                    description.textContent = tool.description || '暂无描述';
                    const tagsContainer = document.createElement('div');
                    tagsContainer.className = 'tool-tags';
                    // Ensure tags is an array before trying to iterate
                    if (tool.tags && Array.isArray(tool.tags)) {
                        tool.tags.forEach(tagText => {
                            const tagSpan = document.createElement('span');
                            tagSpan.className = 'tag';
                            tagSpan.textContent = tagText;
                            tagsContainer.appendChild(tagSpan);
                        });
                    }
                    const link = document.createElement('a');
                    link.className = 'tool-link';
                    // API returns 'url' based on admin form, ensure consistency
                    link.href = tool.url || '#'; // Use '#' if url is missing
                    link.textContent = '访问工具';
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    toolCard.appendChild(cardHeader);
                    toolCard.appendChild(description);
                    if (tagsContainer.hasChildNodes()) {
                        toolCard.appendChild(tagsContainer);
                    }
                    toolCard.appendChild(link);
                    fragment.appendChild(toolCard);
                });
                toolListContainer.appendChild(fragment);
            }
            renderPaginationControls(totalItems);
        }

        function handleCategoryClick(event) {
            // This function implicitly uses the 'toolsData' from the outer scope
            // when it calls renderToolList()
            if (event.target.tagName !== 'A' && !event.target.closest('a')) return; // Handle clicks on icon/text inside link
            event.preventDefault();
            const link = event.target.closest('a'); // Get the link element
            if (!link) return;

            currentCategory = link.dataset.category;
            currentPage = 1;
            const listItem = link.parentElement;
            const items = categoriesNavContainer.querySelectorAll('.category-item');
            items.forEach(item => item.classList.remove('active'));
            listItem.classList.add('active');
            renderToolList();
        }

        function handleSearchInput() {
            // This function implicitly uses the 'toolsData' from the outer scope
            // when it calls renderToolList()
            currentSearchTerm = searchInput.value;
            currentPage = 1;
            renderToolList();
        }

        function renderPaginationControls(totalItems) {
            // This function implicitly uses the 'toolsData' from the outer scope
            // when its event listeners call renderToolList()
            paginationContainer.innerHTML = '';
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalPages <= 1) return;
            const fragment = document.createDocumentFragment();
            const prevButton = document.createElement('button');
            prevButton.textContent = '上一页';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderToolList();
                }
            });
            fragment.appendChild(prevButton);
            const pageInfo = document.createElement('span');
            pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
            pageInfo.style.margin = '0 1rem';
            pageInfo.style.color = 'var(--slate)';
            fragment.appendChild(pageInfo);
            const nextButton = document.createElement('button');
            nextButton.textContent = '下一页';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderToolList();
                }
            });
            fragment.appendChild(nextButton);
            paginationContainer.appendChild(fragment);
        }

        // Initial calls are now inside the try block after successful fetch

        // Initial calls are now directly executed after data check

    })(); // End IIFE for tool library

    // --- 逻辑来自: lightbox.js ---
    (() => {
        const images = document.querySelectorAll('img.lightbox-trigger');
        if (!images.length) return; // 如果页面没有 lightbox 图片，则提前退出此 IIFE

        let lightbox = document.getElementById('lightbox');
        let lightboxImage = null;

        // 创建 lightbox DOM (如果不存在)
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.style.display = 'none'; // 初始隐藏
            document.body.appendChild(lightbox);

            lightboxImage = document.createElement('img');
            lightbox.appendChild(lightboxImage);

            // 点击 lightbox 背景关闭
            lightbox.addEventListener('click', e => {
                if (e.target !== lightboxImage) {
                    lightbox.style.display = 'none';
                    lightboxImage.src = ''; // 清除图片源
                }
            });

            // 按 ESC 关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.style.display !== 'none') {
                    lightbox.style.display = 'none';
                    lightboxImage.src = ''; // 清除图片源
                }
            });
        } else {
            // 如果 lightbox 已存在，获取其图片元素
            lightboxImage = lightbox.querySelector('img');
        }

        // 为每个触发器图片添加点击事件
        images.forEach(image => {
            image.style.cursor = 'pointer'; // 添加手型光标
            image.addEventListener('click', e => {
                e.stopPropagation(); // 防止事件冒泡
                if (lightboxImage) {
                    lightboxImage.src = image.src; // 设置 lightbox 图片源
                    lightbox.style.display = 'flex'; // 显示 lightbox
                }
            });
        });
    })(); // 结束 lightbox IIFE

    // --- 新增：日夜模式切换逻辑 ---
    (() => {
        const themeToggleButton = document.getElementById('theme-toggle-button');
        if (!themeToggleButton) {
            console.warn('Theme toggle button not found.');
            return; // 如果按钮不存在，退出此 IIFE
        }
        const body = document.body;
        const toggleIcon = themeToggleButton.querySelector('.material-symbols-outlined');

        // Function to apply theme based on preference
        const applyTheme = (theme) => {
            console.log(`Applying theme: ${theme}`);
            if (theme === 'dark') {
                body.classList.add('dark-theme');
                console.log('Added dark-theme class to body.');
                if (toggleIcon) toggleIcon.textContent = 'dark_mode';
                themeToggleButton.setAttribute('aria-label', '切换到日间模式');
            } else {
                body.classList.remove('dark-theme');
                console.log('Removed dark-theme class from body.');
                if (toggleIcon) toggleIcon.textContent = 'light_mode';
                themeToggleButton.setAttribute('aria-label', '切换到夜间模式');
            }
            console.log('Current body classes:', body.className);
        };

        // Get saved theme or system preference
        let currentTheme = localStorage.getItem('theme');
        console.log(`Theme from localStorage: ${currentTheme}`);
        if (!currentTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            currentTheme = prefersDark ? 'dark' : 'light';
            console.log(`No saved theme, using system preference: ${currentTheme}`);
        }

        // Apply the initial theme
        applyTheme(currentTheme);

        // Add click event listener
        themeToggleButton.addEventListener('click', () => {
            console.log('Theme toggle button clicked.');
            let newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            console.log(`Switching to theme: ${newTheme}`);
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            console.log(`Saved theme to localStorage: ${newTheme}`);
        });

        // Optional: Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            console.log('System color scheme changed.');
            // Only change if no theme is explicitly saved by the user
            if (!localStorage.getItem('theme')) {
                const newColorScheme = event.matches ? "dark" : "light";
                console.log(`Applying system preferred theme: ${newColorScheme}`);
                applyTheme(newColorScheme);
            } else {
                console.log('User has saved theme preference, ignoring system change.');
            }
        });
    })(); // 结束 theme toggle IIFE

    // --- Simplified Admin Entry Link (JS removed, rely on HTML href) ---
    // (() => {
    //     const adminLink = document.getElementById('admin-entry-link');
    //     if (adminLink) {
    //         adminLink.addEventListener('click', (event) => {
    //             event.preventDefault(); // Prevent default link behavior
    //             const adminUrl = '/admin'; // Incorrect for GitHub Pages
    //             console.log('Admin link clicked, opening:', adminUrl);
    //             window.open(adminUrl, '_blank'); // Open in new tab
    //         });
    //     } else {
    //         console.warn('Admin entry link element not found.');
    //     }
    // })(); // End admin link IIFE

}); // 结束 DOMContentLoaded 事件监听器