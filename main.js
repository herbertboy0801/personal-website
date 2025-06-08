// ==========================================================================
// 合并后的 JavaScript 文件 (main.js)
// 包含来自以下文件的内容:
// - blog-data.js
// - featured-works-data.js
// - learning-diary-data.js (部分逻辑保留，但数据源改为 morning-journal-data.js)
// - tool-library-data.js
// - generate-blog-list.js
// - generate-featured-works.js
// - generate-learning-diary.js (部分逻辑保留，但数据源改为 morning-journal-data.js)
// - generate-tool-library.js
// - lightbox.js
// ==========================================================================

// ==========================================================================
// == 全局数据 (由 index.html 中的 <script> 标签加载) ==
// window.blogPosts
// window.featuredWorksData
// window.toolLibraryData
// window.morningJournalData (替代旧的 learningDiaryData)
// ==========================================================================


// ==========================================================================
// == DOMContentLoaded 事件监听器 (整合逻辑) ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- 渲染精选作品 ---
    function renderFeaturedWorks() {
        console.log("--- Executing renderFeaturedWorks function ---");
        const worksGridContainer = document.querySelector('#featured-works .works-grid');
        if (!worksGridContainer) {
            console.error('Featured works grid container not found!');
            return;
        }

        worksGridContainer.innerHTML = ''; // Clear container

        const worksData = window.featuredWorksData || [];
        console.log("Checking window.featuredWorksData:", worksData);

        if (!Array.isArray(worksData) || worksData.length === 0) {
             worksGridContainer.innerHTML = '<p>暂无精选作品。</p>';
             return;
        }
        console.log(`Found ${worksData.length} featured works. Rendering...`);

        worksData.forEach(work => {
            const workCard = document.createElement('div');
            workCard.classList.add('work-card');
            const img = document.createElement('img');
                img.src = work.imageSrc;
                img.alt = work.altText || work.title || '精选作品图片'; // Add fallback alt text
                const heading = document.createElement('h3');
                heading.textContent = work.title || '无标题';
                const description = document.createElement('p');
                description.textContent = work.description || '暂无描述';
                const tag = document.createElement('span');
                tag.classList.add('tech-tag');
                tag.textContent = work.tag || '通用';
                const link = document.createElement('a');
                // Link directly to image, or use detailsLink if provided and not '#'
                link.href = (work.detailsLink && work.detailsLink !== '#') ? work.detailsLink : work.imageSrc;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('details-link');
                link.textContent = '查看详情 →';
                workCard.appendChild(img);
                workCard.appendChild(heading);
                workCard.appendChild(description);
                workCard.appendChild(tag);
                workCard.appendChild(link);
                worksGridContainer.appendChild(workCard);
            });
    }

    // --- 渲染博客摘要 (精选) ---
    function renderBlogSummary() {
        console.log("--- Executing renderBlogSummary function ---");
        const blogListContainer = document.querySelector('#blog-summary .blog-posts-grid');
        if (!blogListContainer) {
            console.error('Blog summary container not found!');
            return;
        }

        blogListContainer.innerHTML = ''; // Clear container

        const blogPosts = window.blogPosts || [];
        console.log("Checking window.blogPosts:", blogPosts);

        if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
             blogListContainer.innerHTML = '<p>暂无博客文章。</p>';
             return;
        }

        // Filter for featured posts
        const featuredPosts = blogPosts.filter(post => post.featured === true);
        console.log(`Found ${featuredPosts.length} featured blog posts. Rendering...`);

        if (featuredPosts.length === 0) {
            blogListContainer.innerHTML = '<p>暂无精选博客文章。</p>';
            return;
        }

        featuredPosts.forEach(post => {
            const article = document.createElement('article');
            article.classList.add('blog-post-summary');
            let sourceClass = '';
                if (post.source === '小红书') sourceClass = 'source-xiaohongshu';
                else if (post.source === '公众号') sourceClass = 'source-gongzhonghao';
            if (sourceClass) article.classList.add(sourceClass);

            const sourceLabel = document.createElement('span');
            sourceLabel.classList.add('source-label');
            sourceLabel.textContent = post.source || '未知来源';
            const heading = document.createElement('h3');
            heading.textContent = post.title || '无标题';
            const summary = document.createElement('p');
            summary.textContent = post.summary || '暂无摘要';
            const link = document.createElement('a');
            link.href = post.link || '#';
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
    }

    // --- 渲染晨间日记摘要 (NEW) ---
    function renderMorningJournalSummary() {
        console.log("--- Executing renderMorningJournalSummary function (v3) ---");
        const summaryContainer = document.getElementById('journal-entries');
        if (!summaryContainer) {
            console.error('Morning journal entries container (#journal-entries) not found!');
            return;
        }

        summaryContainer.innerHTML = '';

        // CORRECTED: Use window.morningJournalEntries as defined in the data file
        const journalData = window.morningJournalEntries || [];
        console.log("[MJ Summary v3] Initial window.morningJournalEntries (length):", journalData.length);

        if (!Array.isArray(journalData) || journalData.length === 0) {
            console.log("[MJ Summary v3] No morning journal entries found or data is not an array.");
            summaryContainer.innerHTML = '<p>暂无晨间日记。</p>';
            return;
        }

        const sortedEntries = [...journalData].sort((a, b) => {
            try {
                return new Date(b.date) - new Date(a.date);
            } catch (e) {
                console.error("[MJ Summary v3] Error parsing dates for sorting:", a.date, b.date, e);
                return 0;
            }
        });

        function stripHtml(html) {
           if (!html) return "";
           let tmp = document.createElement("DIV");
           tmp.innerHTML = html;
           return tmp.textContent || tmp.innerText || "";
        }

        const latestEntryWithContent = sortedEntries.find(entry => {
            if (entry.harvest) {
                const textContent = stripHtml(entry.harvest);
                return textContent.trim() !== '';
            }
            return false;
        });

        if (!latestEntryWithContent) {
            console.log("[MJ Summary v3] No morning journal entries with actual visible text content found.");
            summaryContainer.innerHTML = '<p>暂无晨间日记。</p>';
            return;
        }

        console.log(`Rendering latest morning journal entry with content from date: ${latestEntryWithContent.date}`);

        const fragment = document.createDocumentFragment();
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('journal-summary-item');

        // Format date for display
        let displayDate = '无日期';
        try {
            if (latestEntryWithContent.date) {
                displayDate = new Date(latestEntryWithContent.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        } catch (e) {
            console.error("Error formatting date:", latestEntryWithContent.date, e);
        }

        // Use 'harvest' field for the snippet
        const harvestContent = latestEntryWithContent.harvest; // Already checked it's not empty
        const contentSnippet = harvestContent.length > 100
            ? harvestContent.substring(0, 100) + '...'
            : harvestContent;
        
        entryDiv.innerHTML = `
            <h4>${displayDate}</h4>
            <p>${contentSnippet.replace(/\n/g, '<br>')}</p>
        `; // Replace newlines with <br>
        fragment.appendChild(entryDiv);
        summaryContainer.appendChild(fragment);
    }


    // --- 渲染工具资源库 ---
    function renderToolLibrary() {
        console.log("--- Executing renderToolLibrary function ---");
        const categoriesNavContainer = document.getElementById('tool-categories-nav');
        const toolListContainer = document.getElementById('tool-list-container');
        const searchInput = document.getElementById('tool-search-input');
        const paginationContainer = document.getElementById('pagination-container');

        if (!categoriesNavContainer || !toolListContainer || !searchInput || !paginationContainer) {
            console.error('Tool library elements not found. Skipping initialization.');
            // Optionally display an error message in one of the containers if they exist partially
            if (toolListContainer) toolListContainer.innerHTML = '<p>工具库组件加载失败。</p>';
            return;
        }

        const itemsPerPage = 4;
        let currentPage = 1;
        let currentCategory = '全部';
        let currentSearchTerm = '';
        let filteredToolsCache = [];
        const toolsData = window.toolLibraryData || [];
        console.log("Checking window.toolLibraryData:", toolsData);

        // --- Initial Render ---
        toolListContainer.innerHTML = '';
        categoriesNavContainer.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (!Array.isArray(toolsData)) {
             console.error('Global tools data is not an array:', toolsData);
             toolListContainer.innerHTML = '<p>工具数据格式不正确。</p>';
             return;
        }

        console.log("Rendering initial categories and tools...");
        renderCategories();
        renderToolList();
        searchInput.removeEventListener('input', handleSearchInput); // Prevent duplicate listeners
        searchInput.addEventListener('input', handleSearchInput);

        function renderCategories() {
            const categoryIcons = {
                '全部': 'apps', 'AI 生成': 'auto_awesome', '开发工具': 'code',
                '效率助手': 'checklist', '图像影音处理': 'perm_media', '休闲娱乐': 'stadia_controller'
            };
            // Derive categories from data, ensuring '全部' is first
            const availableCategories = ['全部', ...new Set(toolsData.map(tool => tool.category).filter(Boolean))].sort((a, b) => a === '全部' ? -1 : b === '全部' ? 1 : a.localeCompare(b, 'zh-CN'));

            categoriesNavContainer.innerHTML = '<h3>工具分类</h3>';
            const ul = document.createElement('ul');
            const fragment = document.createDocumentFragment();

            availableCategories.forEach(category => {
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
                
                // Calculate and add count
                const count = category === '全部'
                    ? toolsData.length
                    : toolsData.filter(tool => tool.category === category).length;
                const countSpan = document.createElement('span');
                countSpan.className = 'category-count';
                countSpan.textContent = ` (${count})`;
                countSpan.style.fontSize = '0.9em'; // Slightly smaller font for count
                countSpan.style.color = 'var(--light-slate)'; // Lighter color for count

                a.appendChild(iconSpan);
                a.appendChild(textSpan);
                a.appendChild(countSpan); // Add count to the link
                if (category === currentCategory) {
                    li.classList.add('active');
                }
                li.appendChild(a);
                fragment.appendChild(li);
            });
            ul.appendChild(fragment);
            categoriesNavContainer.appendChild(ul);
            categoriesNavContainer.removeEventListener('click', handleCategoryClick); // Prevent duplicate listeners
            categoriesNavContainer.addEventListener('click', handleCategoryClick);
        }

        function renderToolList() {
            let filteredByCategory = currentCategory === '全部'
                ? toolsData
                : toolsData.filter(tool => tool.category === currentCategory);

            const lowerSearchTerm = currentSearchTerm.toLowerCase().trim();
            filteredToolsCache = lowerSearchTerm === ''
                ? filteredByCategory
                : filteredByCategory.filter(tool =>
                    (tool.name || '').toLowerCase().includes(lowerSearchTerm) ||
                    (tool.description || '').toLowerCase().includes(lowerSearchTerm) ||
                    (tool.tags && Array.isArray(tool.tags) && tool.tags.some(tag => (tag || '').toLowerCase().includes(lowerSearchTerm)))
                  );

            const totalItems = filteredToolsCache.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) { // Adjust current page if it exceeds total pages
                currentPage = totalPages;
            } else if (totalPages === 0) {
                 currentPage = 1; // Reset to 1 if no pages
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
                    iconSpan.textContent = tool.icon || 'build'; // Default icon
                    const title = document.createElement('h3');
                    title.textContent = tool.name || '未命名工具';
                    cardHeader.appendChild(iconSpan);
                    cardHeader.appendChild(title);
                    const description = document.createElement('p');
                    description.className = 'tool-description';
                    description.textContent = tool.description || '暂无描述';
                    const tagsContainer = document.createElement('div');
                    tagsContainer.className = 'tool-tags';
                    if (tool.tags && Array.isArray(tool.tags)) {
                        tool.tags.forEach(tagText => {
                            if (tagText) { // Ensure tag is not empty
                                const tagSpan = document.createElement('span');
                                tagSpan.className = 'tag';
                                tagSpan.textContent = tagText;
                                tagsContainer.appendChild(tagSpan);
                            }
                        });
                    }
                    const link = document.createElement('a');
                    link.className = 'tool-link';
                    link.href = tool.url || '#';
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
            const link = event.target.closest('a');
            if (!link || !link.dataset.category) return;
            event.preventDefault();

            currentCategory = link.dataset.category;
            currentPage = 1; // Reset page when category changes
            currentSearchTerm = ''; // Reset search when category changes
            searchInput.value = ''; // Clear search input visually

            const items = categoriesNavContainer.querySelectorAll('.category-item');
            items.forEach(item => item.classList.remove('active'));
            link.parentElement.classList.add('active'); // Activate the parent LI

            renderToolList();
        }

        function handleSearchInput() {
            currentSearchTerm = searchInput.value;
            currentPage = 1; // Reset page when searching
            renderToolList();
        }

        function renderPaginationControls(totalItems) {
            paginationContainer.innerHTML = '';
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalPages <= 1) return;

            const fragment = document.createDocumentFragment();

            // Previous Button
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

            // Page Info
            const pageInfo = document.createElement('span');
            pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
            pageInfo.style.margin = '0 0.8rem'; // Adjusted margin
            pageInfo.style.color = 'var(--slate)';
            fragment.appendChild(pageInfo);

            // Next Button
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
    } // End renderToolLibrary function definition


    // --- Lightbox ---
    function initializeLightbox() {
        console.log("--- Executing initializeLightbox function ---");
        const images = document.querySelectorAll('img.lightbox-trigger');
        if (!images.length) {
            console.log("No lightbox trigger images found.");
            return;
        }

        let lightbox = document.getElementById('lightbox');
        let lightboxImage = null;

        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.style.display = 'none';
            document.body.appendChild(lightbox);

            lightboxImage = document.createElement('img');
            lightbox.appendChild(lightboxImage);

            lightbox.addEventListener('click', e => {
                if (e.target !== lightboxImage) {
                    lightbox.style.display = 'none';
                    lightboxImage.src = '';
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.style.display !== 'none') {
                    lightbox.style.display = 'none';
                    lightboxImage.src = '';
                }
            });
        } else {
            lightboxImage = lightbox.querySelector('img');
        }

        if (!lightboxImage) { // Ensure lightboxImage exists
             console.error("Lightbox image element could not be found or created.");
             return;
        }

        images.forEach(image => {
            image.style.cursor = 'pointer';
            image.removeEventListener('click', handleImageClick); // Prevent duplicate listeners
            image.addEventListener('click', handleImageClick);
        });

        function handleImageClick(e) {
             e.stopPropagation();
             lightboxImage.src = e.target.src;
             lightbox.style.display = 'flex';
        }
    }

    // --- 日夜模式切换 ---
    function initializeThemeToggle() {
        console.log("--- Executing initializeThemeToggle function ---");
        const themeToggleButton = document.getElementById('theme-toggle-button');
        if (!themeToggleButton) {
            console.warn('Theme toggle button not found.');
            return;
        }
        const body = document.body;
        const toggleIcon = themeToggleButton.querySelector('.material-symbols-outlined');

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-theme');
                if (toggleIcon) toggleIcon.textContent = 'dark_mode';
                themeToggleButton.setAttribute('aria-label', '切换到日间模式');
            } else {
                body.classList.remove('dark-theme');
                if (toggleIcon) toggleIcon.textContent = 'light_mode';
                themeToggleButton.setAttribute('aria-label', '切换到夜间模式');
            }
        };

        let currentTheme = localStorage.getItem('theme');
        if (!currentTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            currentTheme = prefersDark ? 'dark' : 'light';
        }
        applyTheme(currentTheme);

        themeToggleButton.removeEventListener('click', handleThemeToggle); // Prevent duplicate listeners
        themeToggleButton.addEventListener('click', handleThemeToggle);

        function handleThemeToggle() {
            let newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }

        // System theme change listener (optional)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        // Remove previous listener if exists (important for hot-reloading environments)
        // Note: Storing the listener function might be needed for robust removal
        try { mediaQuery.removeEventListener('change', handleSystemThemeChange); } catch(e) {}
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        function handleSystemThemeChange(event) {
             if (!localStorage.getItem('theme')) { // Only apply if user hasn't set preference
                 const newColorScheme = event.matches ? "dark" : "light";
                 applyTheme(newColorScheme);
             }
        }
    }


    // --- 初始化页面 ---
    function initPage() {
        console.log("--- Initializing Page ---");
        renderFeaturedWorks();
        renderBlogSummary();
        renderMorningJournalSummary(); // Call the new function
        renderToolLibrary();
        initializeLightbox();
        initializeThemeToggle();
        // Add other initialization calls if needed
    }

    // --- 执行初始化 ---
    initPage();

}); // 结束 DOMContentLoaded 事件监听器