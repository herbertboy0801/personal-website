document.addEventListener('DOMContentLoaded', () => {
  // 选择所有带有 'lightbox-trigger' 类的图片
  const images = document.querySelectorAll('img.lightbox-trigger');
  if (!images.length) return; // 如果没有需要放大的图片则退出

  // 创建 Lightbox 的 DOM 结构（只创建一次）
  let lightbox = document.getElementById('lightbox');
  let lightboxImage = null;

  if (!lightbox) { // 检查 lightbox 是否已存在，避免重复创建
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
      lightbox.style.display = 'none'; // 初始隐藏
      document.body.appendChild(lightbox);

      lightboxImage = document.createElement('img');
      lightbox.appendChild(lightboxImage);

      // 点击 Lightbox 背景关闭
      lightbox.addEventListener('click', e => {
        // 确保点击的是背景而不是图片本身
        if (e.target !== lightboxImage) {
          lightbox.style.display = 'none'; // 隐藏 Lightbox
          lightboxImage.src = ''; // 清除 src 避免闪烁
        }
      });

      // 添加键盘 Esc 键关闭功能
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display !== 'none') {
          lightbox.style.display = 'none';
          lightboxImage.src = '';
        }
      });
  } else {
      // 如果 lightbox 已存在，获取其内部的 img 元素
      lightboxImage = lightbox.querySelector('img');
  }


  images.forEach(image => {
    image.style.cursor = 'pointer'; // 添加手型光标提示可点击
    image.addEventListener('click', e => {
      e.stopPropagation(); // 防止事件冒泡
      if (lightboxImage) { // 确保 lightboxImage 存在
          lightboxImage.src = image.src; // 设置大图的 src
          lightbox.style.display = 'flex'; // 显示 Lightbox
      }
    });
  });

});