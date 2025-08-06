// /viewer/viewer.js

(function () {
  let currentIndex = -1;
  let mediaElements = [];
  let overlay, img, prevBtn, nextBtn, thumbStrip;

  function createViewer() {
    overlay = document.createElement('div');
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; flex-direction: column;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeViewer();
    });

    img = document.createElement('img');
    img.style = 'max-height: 90vh; object-fit: contain;';

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
    overlay.appendChild(img);
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
    showImage(currentIndex);
    overlay.style.display = 'flex';
  }

  function closeViewer() {
    overlay.style.display = 'none';
  }

  function navigate(offset) {
    const len = mediaElements.length;
    currentIndex = (currentIndex + offset + len) % len;
    showImage(currentIndex);
  }

  function showImage(index) {
    const src = mediaElements[index].getAttribute('src');
    img.setAttribute('src', src);

    thumbStrip.innerHTML = '';
    mediaElements.forEach((el, i) => {
      const thumb = document.createElement('img');
      thumb.src = el.src;
      thumb.style = 'height: 60px; cursor: pointer; opacity:' + (i === index ? '1' : '0.5');
      thumb.onclick = () => showImage(i);
      thumbStrip.appendChild(thumb);
    });
  }

  // expose globally
  window.openViewer = openViewer;
})();
