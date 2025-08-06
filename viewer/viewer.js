(function () {
  let currentIndex = -1;
  let mediaElements = [];
  let overlay, mediaContainer, prevBtn, nextBtn, thumbStrip;

  function createViewer() {
    overlay = document.createElement('div');
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 9999; display: flex;
      align-items: center; justify-content: center; flex-direction: column;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeViewer();
    });

    mediaContainer = document.createElement('div');
    mediaContainer.style = `
      display: flex; justify-content: center; align-items: center;
      flex-direction: column; width: 100%; height: 100%; padding-bottom: 80px;
    `;

    prevBtn = document.createElement('button');
    nextBtn = document.createElement('button');
    prevBtn.textContent = '<';
    nextBtn.textContent = '>';
    [prevBtn, nextBtn].forEach(btn => {
      btn.style = `
        position: absolute; top: 50%; font-size: 30px; background: #fff;
        border: none; cursor: pointer; padding: 10px;
      `;
    });
    prevBtn.style.left = '20px';
    nextBtn.style.right = '20px';

    prevBtn.onclick = () => navigate(-1);
    nextBtn.onclick = () => navigate(1);

    thumbStrip = document.createElement('div');
    thumbStrip.style = `
      position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
      display: flex; justify-content: flex-start; overflow-x: auto; gap: 5px;
      padding: 10px; background: #222; z-index: 10000;
    `;
    thumbStrip.addEventListener('scroll', handleLazyLoad);

    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(mediaContainer);
    overlay.appendChild(thumbStrip);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', (e) => {
      if (overlay.style.display === 'none') return;
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') closeViewer();
    });

    overlay.style.display = 'none';
  }

  function openViewer(index) {
    if (!overlay) createViewer();

    const clickedEl = document.querySelectorAll('.media-thumb')[index];
    const dirKey = clickedEl.getAttribute('data-path');
    const allList = window.__ALL_MEDIA_LIST__ || [];
    const pathKey = window.__MEDIA_PATH_KEY__;

    mediaElements = allList.map((src) => {
      const ext = src.toLowerCase().split('.').pop();
      const tag = ['mp4', 'webm'].includes(ext) ? 'video' : 'img';
      const el = document.createElement(tag);
      el.src = src;
      el.classList.add('media-thumb');
      el.setAttribute('data-path', pathKey);
      return el;
    });

    currentIndex = mediaElements.findIndex(el => el.src === clickedEl.src);
    renderThumbStrip();
    showMedia(currentIndex);
    overlay.style.display = 'flex';
  }

  function closeViewer() {
    overlay.style.display = 'none';
    mediaContainer.innerHTML = '';
    thumbStrip.innerHTML = '';
  }

  function navigate(offset) {
    const len = mediaElements.length;
    currentIndex = (currentIndex + offset + len) % len;
    showMedia(currentIndex);
  }

  function showMedia(index) {
    const src = mediaElements[index].src;
    const type = mediaElements[index].tagName.toLowerCase();

    mediaContainer.innerHTML = '';
    let main;

    if (type === 'video') {
      main = document.createElement('video');
      main.src = src;
      main.controls = true;
      main.autoplay = true;
      main.playsInline = true;
      main.style = 'max-height: 90vh; max-width: 100%;';
      main.addEventListener('loadedmetadata', () => {
        main.currentTime = 0;
        main.play().catch(() => {});
      });
    } else {
      main = document.createElement('img');
      main.src = src;
      main.style = 'max-height: 90vh; max-width: 100%; object-fit: contain;';
    }

    mediaContainer.appendChild(main);

    const thumbs = thumbStrip.querySelectorAll('.thumb-item');
    thumbs.forEach((thumb, i) => {
      thumb.style.opacity = (i === index) ? '1' : '0.5';
    });
  }

  function renderThumbStrip() {
    thumbStrip.innerHTML = '';
    for (let i = 0; i < mediaElements.length; i++) {
      const placeholder = document.createElement('div');
      placeholder.classList.add('thumb-placeholder');
      placeholder.dataset.index = i;
      placeholder.style = 'width: 80px; height: 60px; background: #444; opacity: 0.2; flex-shrink: 0;';
      thumbStrip.appendChild(placeholder);
    }
    lazyLoadThumbnailsAround(currentIndex);
  }

  function lazyLoadThumbnailsAround(index, range = 50) {
    const start = Math.max(0, index - range);
    const end = Math.min(mediaElements.length, index + range + 1);

    for (let i = start; i < end; i++) {
      loadThumbnail(i);
    }
  }

  function handleLazyLoad() {
    const placeholders = [...thumbStrip.querySelectorAll('.thumb-placeholder')];
    placeholders.forEach(p => {
      const rect = p.getBoundingClientRect();
      if (rect.left < window.innerWidth && rect.right > 0) {
        loadThumbnail(+p.dataset.index);
      }
    });
  }

  function loadThumbnail(index) {
    const container = thumbStrip.querySelector(`.thumb-placeholder[data-index="${index}"]`);
    if (!container || container.firstChild) return;

    const el = mediaElements[index];
    const tag = el.tagName.toLowerCase();
    const thumb = document.createElement(tag);
    thumb.src = el.src;
    thumb.classList.add('thumb-item');
    thumb.style = 'height: 60px; cursor: pointer; opacity:' + (index === currentIndex ? '1' : '0.5');
    thumb.onclick = () => showMedia(index);

    if (tag === 'video') {
      thumb.muted = true;
      thumb.playsInline = true;
      thumb.preload = 'metadata';
      thumb.addEventListener('loadeddata', () => {
        thumb.currentTime = 0;
        thumb.pause();
      });
    }

    container.innerHTML = '';
    container.appendChild(thumb);
  }

  window.openViewer = openViewer;
})();
