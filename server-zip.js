const express = require('express');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 9999;

const ROOT_DIRS = {
  a: path.resolve('D:\\DEL bin'),
};

const ITEMS_PER_PAGE = 20;

Object.values(ROOT_DIRS).forEach(rootPath => {
  app.use(express.static(rootPath));
});

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
function renderMediaTags(items, getUrlFn) {
  return items.map(entry => {
    const name = typeof entry === 'string' ? entry : entry.entryName;
    const ext = path.extname(name).toLowerCase();
    const url = getUrlFn(entry);
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      return `<img src="${url}" style="width: 100%; margin-bottom: 20px;" />`;
    } else {
      return `<video controls src="${url}" style="width: 100%; margin-bottom: 20px;"></video>`;
    }
  }).join('\n');
}


app.get('/', (req, res) => {
  const links = Object.entries(ROOT_DIRS).map(([name]) => {
    return `<div><a href="/browse?root=${name}" style="font-size: 20px;">📂 ${name}</a></div>`;
  });

  res.send(`
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
      </style>
    </head>
    <body style="padding:20px;font-family:sans-serif;">
      <h1>🗂️ 루트 디렉토리 선택</h1>
      ${links.join('\n')}
    </body>
    </html>
  `);
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
  const folderLinks = subdirs.map(sub => {
    const subPath = path.join(relDir, sub).replace(/\\/g, '/');
    return `<div><a href="/browse?root=${rootKey}&dir=${encodeURIComponent(subPath)}">📁 ${sub}</a></div>`;
  });

  const zipFiles = files.filter(f => path.extname(f).toLowerCase() === '.zip');
  const zipLinks = zipFiles.map(zip => {
    const zipPath = path.join(relDir, zip).replace(/\\/g, '/');
    return `<div><a href="/zip?root=${rootKey}&file=${encodeURIComponent(zipPath)}">🗜️ ${zip}</a></div>`;
  });

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
  const paginationHTML = createSmartPagination(page, totalPages, baseUrl);

  const mediaTags = renderMediaTags(currentItems, f => path.join(relDir, f).replace(/\\/g, '/'));

  const parent = relDir ? path.dirname(relDir).replace(/\\/g, '/') : null;
  const backLink = parent && parent !== '.' ? `<a href="/browse?root=${rootKey}&dir=${encodeURIComponent(parent)}">⬅️ 상위 폴더</a>` : `<a href="/">⬅️ 루트 선택</a>`;

  res.send(`
    <html><head><style>
      .page-btn {
        display: inline-block;
        padding: 5px 10px;
        margin: 0 4px;
        border: 1px solid #aaa;
        text-decoration: none;
        color: black;
      }
    </style></head>
    <body style="padding:20px;font-family:sans-serif;">
      $1${backLink} | <a href="javascript:history.back()">🔙 이전으로</a>
      <hr/>
      ${folderLinks.join('\n')}
      ${zipLinks.join('\n')}
      ${paginationHTML}
      ${mediaTags}
      ${paginationHTML}
    </body></html>
  `);
});

app.get('/zip', (req, res) => {
  const rootKey = req.query.root;
  const zipRelPath = req.query.file;
  const page = parseInt(req.query.page) || 1;

  const rootPath = ROOT_DIRS[rootKey];
  if (!rootPath) return res.status(404).send('루트 디렉토리 오류');

  const zipAbs = path.join(rootPath, zipRelPath);
  if (!zipAbs.startsWith(rootPath)) return res.status(403).send('접근 거부');
  if (!fs.existsSync(zipAbs)) return res.status(404).send('ZIP 파일 없음');

  const zip = new AdmZip(zipAbs);
  const entries = zip.getEntries();

  const mediaEntries = entries.filter(e =>
    !e.isDirectory && /\.(jpg|jpeg|png|mp4|webm)$/i.test(e.entryName)
  );

  const totalPages = Math.ceil(mediaEntries.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentPageItems = mediaEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const baseUrl = `/zip?root=${rootKey}&file=${encodeURIComponent(zipRelPath)}`;
  const paginationHTML = createSmartPagination(page, totalPages, baseUrl);

  const mediaTags = renderMediaTags(currentPageItems, entry =>
    `/zip/view?root=${rootKey}&file=${encodeURIComponent(zipRelPath)}&entry=${encodeURIComponent(entry.entryName)}`
  );

  res.send(`
    <html><head><style>
      .page-btn {
        display: inline-block;
        padding: 5px 10px;
        margin: 0 4px;
        border: 1px solid #aaa;
        text-decoration: none;
        color: black;
      }
    </style></head>
    <body style="padding:20px;font-family:sans-serif;">
      $1<a href="/browse?root=${rootKey}&dir=${encodeURIComponent(path.dirname(zipRelPath))}">⬅️ 상위 폴더</a> | 
      ${paginationHTML}
      ${mediaTags}
      ${paginationHTML}
    </body>
    </html>
  `);
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
