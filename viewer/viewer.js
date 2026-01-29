(function () {
  let slides = [];
  let order = [];
  let index = 0;
  let timer = null;
  let delay = 3000;
  let paused = false;

  let overlay, img;
  let preloadIndex = 0;
  const PRELOAD_BATCH = 10;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

function preloadNextBatch() {
  const end = Math.min(preloadIndex + PRELOAD_BATCH, order.length);
  for (; preloadIndex < end; preloadIndex++) {
    const slide = slides[order[preloadIndex]];
    if (!slide.src) {
      const tmp = new Image();
      tmp.src = slide.dataset.src;
      slide.src = tmp.src;
    }
  }
}


  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style = `
      position: fixed;
      inset: 0;
      background: black;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    img = document.createElement('img');
    img.style = `
      width: 100vw;
      height: 100vh;
      object-fit: cover;
    `;

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    // 클릭 영역
    overlay.addEventListener('click', e => {
      const x = e.clientX;
      const w = window.innerWidth;

      if (x < w * 0.33) prev();
      else if (x > w * 0.66) next();
      else togglePause();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') stop();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === ' ') togglePause();
    });

    createControls();
  }

  function createControls() {
    const box = document.createElement('div');
    box.style = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 10000;
    `;

    [1, 2, 3].forEach(sec => {
      const btn = document.createElement('button');
      btn.textContent = sec + 's';
      btn.style = 'font-size:16px;padding:6px 10px;';
      btn.onclick = () => changeDelay(sec * 1000);
      box.appendChild(btn);
    });

    document.body.appendChild(box);
  }
function show() {
  const slide = slides[order[index]];
  if (!slide.src) {
    slide.src = slide.dataset.src;
  }
  img.src = slide.src;

  if (index + PRELOAD_BATCH > preloadIndex) {
    preloadNextBatch();
  }
}

  function next() {
    index = (index + 1) % order.length;
    show();
  }

  function prev() {
    index = (index - 1 + order.length) % order.length;
    show();
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, delay);
  }

  function togglePause() {
    paused = !paused;
    if (paused) clearInterval(timer);
    else startTimer();
  }

  function changeDelay(ms) {
    delay = ms;
    if (!paused) startTimer();
  }

  function startSlideshow() {
    slides = Array.from(document.querySelectorAll('img.media-slide'));
    if (!slides.length) return alert('이미지가 없습니다');

    order = slides.map((_, i) => i);
    shuffle(order);

    index = 0;
    preloadIndex = 0;

    createOverlay();
    preloadNextBatch();
    show();
    startTimer();
  }

  function stop() {
    clearInterval(timer);
    overlay.remove();
  }

  // 전역 노출
  window.startSlideshow = startSlideshow;
})();
