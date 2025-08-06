// 아래 코드는 사용자의 요구사항을 모두 반영한 media server 전체 구현 코드입니다.

const express = require('express');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 9999;

const ROOT_DIRS = {};
const paths = fs.readFileSync('path.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);
paths.forEach(p => {
  ROOT_DIRS[`path_${p}`] = path.resolve(p);
});

const ITEMS_PER_PAGE = 20;

Object.values(ROOT_DIRS).forEach(rootPath => {
  app.use(express.static(rootPath));
});

// static viewer assets
app.use('/viewer', express.static(path.join(__dirname, 'viewer')));

function createSmartPagination(currentPage, totalPages, baseUrl) {
  const maxButtons = 10;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const buttons = [];

  if (currentPage > 1) {
    buttons.push(`<a href="${baseUrl}&page=1" class="page-btn">«</a>`);
    buttons.push(`<a href="${baseUrl}&page=${currentPage - 1}" class="page-btn">‹</a>`);
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      buttons.push(`<span class="page-btn" style="font-weight:bold;background:#ccc;">${i}</span>`);
    } else {
      buttons.push(`<a href="${baseUrl}&page=${i}" class="page-btn">${i}</a>`);
    }
  }

  if (currentPage < totalPages) {
    buttons.push(`<a href="${baseUrl}&page=${currentPage + 1}" class="page-btn">›</a>`);
    buttons.push(`<a href="${baseUrl}&page=${totalPages}" class="page-btn">»</a>`);
  }

  return `<div class="pagination">${buttons.join('')}</div>`;
}

function renderMediaTags(items, getUrlFn, isVerticalView) {
  return items.map((entry, index) => {
    const name = typeof entry === 'string' ? entry : entry.entryName;
    const ext = path.extname(name).toLowerCase();
    const url = getUrlFn(entry);
    const style = isVerticalView
      ? 'height: 100vh; object-fit: contain; display:block; margin:20px auto;'
      : 'width: 100%; margin-bottom: 20px;';

    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      return `<img class="media-thumb" data-index="${index}" src="${url}" style="${style}" onclick="openViewer(${index})" />`;
    } else {
      return `<video controls src="${url}" style="${style}"></video>`;
    }
  }).join('\n');
}

function wrapHtml(content, extraHead = '') {
  return `
  <html>
  <head>
    <style>
      .page-btn {
        display: inline-block;
        padding: 5px 10px;
        margin: 0 4px;
        border: 1px solid #aaa;
        text-decoration: none;
        color: black;
      }
      .toggle-btn {
        margin-bottom: 20px;
      }
    </style>
    ${extraHead}
  </head>
  <body style="padding:20px;font-family:sans-serif;">
    ${content}
  </body>
  </html>
  `;
}

function renderToggleScript(pageUrl, isVerticalView) {
  const dummyBase = 'http://localhost'; // 임시 베이스
  const url = new URL(pageUrl, dummyBase);
  url.searchParams.set('vertical', !isVerticalView);
  return `<button class="toggle-btn" onclick="location.href='${url.pathname}?${url.searchParams.toString()}'">보기 방식: ${isVerticalView ? '세로' : '가로'}</button>`;
}


app.get('/', (req, res) => {
  const links = Object.entries(ROOT_DIRS).map(([name]) => {
    return `<div><a href="/browse?root=${name}" style="font-size: 20px;">📂 ${name}</a></div>`;
  });
  res.send(wrapHtml(`<h1>🗂️ 루트 디렉토리 선택</h1>${links.join('\n')}`));
});

app.get('/browse', (req, res) => {
  const rootKey = req.query.root;
  const relDir = req.query.dir || '';
  const rootPath = ROOT_DIRS[rootKey];
  if (!rootPath) return res.status(404).send('잘못된 루트 디렉토리');

  const absDir = path.join(rootPath, relDir);
  if (!absDir.startsWith(rootPath)) return res.status(403).send('접근 거부');

  let files;
  try {
    files = fs.readdirSync(absDir);
  } catch (e) {
    return res.status(404).send('디렉토리 없음');
  }

  const subdirs = files.filter(f => fs.statSync(path.join(absDir, f)).isDirectory());
  const zipFiles = files.filter(f => path.extname(f).toLowerCase() === '.zip');
  const mediaFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    const full = path.join(absDir, f);
    return fs.statSync(full).isFile() && ['.jpg', '.jpeg', '.png', '.mp4', '.webm'].includes(ext);
  });

  const page = parseInt(req.query.page) || 1;
  const totalPages = Math.ceil(mediaFiles.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const currentItems = mediaFiles.slice(start, start + ITEMS_PER_PAGE);

  const baseUrl = `/browse?root=${rootKey}&dir=${encodeURIComponent(relDir)}`;
  const isVerticalView = req.query.vertical === 'true';

  const toggle = renderToggleScript(baseUrl + `&page=${page}`, isVerticalView);
  const paginationHTML = createSmartPagination(page, totalPages, baseUrl + `&vertical=${isVerticalView}`);
  const mediaTags = renderMediaTags(currentItems, f => path.join(relDir, f).replace(/\\/g, '/'), isVerticalView);

  const subHtml = subdirs.map(sub => `<div><a href="/browse?root=${rootKey}&dir=${encodeURIComponent(path.join(relDir, sub))}">📁 ${sub}</a></div>`).join('');
  const zipHtml = zipFiles.map(zip => `<div><a href="/zip?root=${rootKey}&file=${encodeURIComponent(path.join(relDir, zip))}">🗜️ ${zip}</a></div>`).join('');

  const parent = relDir ? path.dirname(relDir).replace(/\\/g, '/') : null;
  const backLink = relDir
    ? `<a href="/browse?root=${rootKey}&dir=${encodeURIComponent(parent)}">⬅️ 상위 폴더</a>`
    : `<a href="/">⬅️ 루트 선택</a>`;

  res.send(wrapHtml(`
    ${backLink}<br><span>📁 현재 위치: /${relDir}</span><hr/>
    ${toggle}
    ${subHtml}${zipHtml}${paginationHTML}${mediaTags}${paginationHTML}
    <script src="/viewer/viewer.js"></script>
  `));
});

app.get('/zip', (req, res) => {
  const rootKey = req.query.root;
  const zipRelPath = req.query.file;
  const page = parseInt(req.query.page) || 1;
  const isVerticalView = req.query.vertical === 'true';

  const rootPath = ROOT_DIRS[rootKey];
  const zipAbs = path.join(rootPath, zipRelPath);
  if (!rootPath || !zipAbs.startsWith(rootPath)) return res.status(403).send('접근 거부');
  if (!fs.existsSync(zipAbs)) return res.status(404).send('ZIP 파일 없음');

  const zip = new AdmZip(zipAbs);
  const entries = zip.getEntries().filter(e => !e.isDirectory && /\.(jpg|jpeg|png|mp4|webm)$/i.test(e.entryName));

  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentPageItems = entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const baseUrl = `/zip?root=${rootKey}&file=${encodeURIComponent(zipRelPath)}`;
  const toggle = renderToggleScript(baseUrl + `&page=${page}`, isVerticalView);
  const paginationHTML = createSmartPagination(page, totalPages, baseUrl + `&vertical=${isVerticalView}`);
  const mediaTags = renderMediaTags(currentPageItems, entry => `/zip/view?root=${rootKey}&file=${encodeURIComponent(zipRelPath)}&entry=${encodeURIComponent(entry.entryName)}`, isVerticalView);

  res.send(wrapHtml(`
    <a href="/browse?root=${rootKey}&dir=${encodeURIComponent(path.dirname(zipRelPath))}">⬅️ 상위 폴더</a><br><span>📁현재 ZIP: /${zipRelPath}</span><hr/>
    ${toggle}${paginationHTML}${mediaTags}${paginationHTML}
    <script src="/viewer/viewer.js"></script>
  `));
});

app.get('/zip/view', (req, res) => {
  const { root, file, entry } = req.query;
  const rootPath = ROOT_DIRS[root];
  const zipAbs = path.join(rootPath, file);

  if (!zipAbs.startsWith(rootPath)) return res.status(403).send('접근 거부');
  if (!fs.existsSync(zipAbs)) return res.status(404).send('ZIP 파일 없음');

  const zip = new AdmZip(zipAbs);
  const target = zip.getEntry(entry);
  if (!target) return res.status(404).send('내부 파일 없음');

  const ext = path.extname(entry).toLowerCase();
  if ([".jpg", ".jpeg", ".png"].includes(ext)) {
    res.contentType('image/' + ext.replace('.', ''));
    res.send(target.getData());
  } else if ([".mp4", ".webm"].includes(ext)) {
    res.contentType('video/' + ext.replace('.', ''));
    res.send(target.getData());
  } else {
    res.send('미리보기 불가한 파일');
  }
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}`);
});
