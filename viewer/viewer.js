(function () {
  let currentIndex = -1;
  let mediaElements = [];
  let overlay, mediaContainer, prevBtn, nextBtn, thumbStrip;

  function createViewer() {
    overlay = document.createElement('div');
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; flex-direction: column;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeViewer();
    });

    mediaContainer = document.createElement('div');
    mediaContainer.style = 'max-height: 90vh; display:flex; justify-content:center; align-items:center;';

    prevBtn = document.createElement('button');
    nextBtn = document.createElement('button');
    prevBtn.textContent = '<';
    nextBtn.textContent = '>';
    [prevBtn, nextBtn].forEach(btn => {
      btn.style = 'position: absolute; top: 50%; font-size: 30px; background: #fff; border: none; cursor: pointer; padding: 10px;';
    });
    prevBtn.style.left = '20px';
    nextBtn.style.right = '20px';

    prevBtn.onclick = () => navigate(-1);
    nextBtn.onclick = () => navigate(1);

    thumbStrip = document.createElement('div');
    thumbStrip.style = 'display: flex; overflow-x: auto; gap: 5px; padding: 10px; background: #222; margin-top: 10px;';

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
    mediaElements = [...document.querySelectorAll('.media-thumb')];
    currentIndex = index;

    // 썸네일이 없으면 처음만 한 번 생성
    if (thumbStrip.children.length === 0) {
      mediaElements.forEach((thumbEl, i) => {
        const thumbType = thumbEl.tagName.toLowerCase();
        const thumb = document.createElement(thumbType);
        thumb.src = thumbEl.getAttribute('src');
        thumb.dataset.index = i;
        thumb.classList.add('thumb-item');
        thumb.style = 'height: 60px; cursor: pointer; opacity: 0.5;';
        thumb.onclick = () => showMedia(i);

        if (thumbType === 'video') {
          thumb.muted = true;
          thumb.playsInline = true;
          thumb.preload = 'metadata';
          thumb.addEventListener('loadeddata', () => {
            thumb.currentTime = 0;
            thumb.pause();
          });
        }

        thumbStrip.appendChild(thumb);
      });
    }

    showMedia(currentIndex);
    overlay.style.display = 'flex';
  }

  function closeViewer() {
    overlay.style.display = 'none';
    mediaContainer.innerHTML = '';
  }

  function navigate(offset) {
    const len = mediaElements.length;
    currentIndex = (currentIndex + offset + len) % len;
    showMedia(currentIndex);
  }

  function showMedia(index) {
    const src = mediaElements[index].getAttribute('src');
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

    // 선택 표시 갱신
    const thumbs = thumbStrip.querySelectorAll('.thumb-item');
    thumbs.forEach((thumb, i) => {
      thumb.style.opacity = (i === index) ? '1' : '0.5';
    });
  }

  window.openViewer = openViewer;
})();
