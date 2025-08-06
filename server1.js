const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9999;

// ✅ 여러 개의 루트 디렉토리 지정
const ROOT_DIRS = {
  'a': path.resolve('D:'),
  'b': path.resolve('D:'),
  'c': path.resolve('c'),
};

const ITEMS_PER_PAGE = 20;

// 📁 정적 파일 제공 (모든 루트 디렉토리에 대해)
Object.values(ROOT_DIRS).forEach(rootPath => {
  app.use(express.static(rootPath));
});

// ✅ 최초 페이지: 루트 디렉토리 선택 화면
app.get('/', (req, res) => {
  const links = Object.entries(ROOT_DIRS).map(([name, _]) => {
    return `<div><a href="/browse?root=${encodeURIComponent(name)}" style="font-size: 20px;">📂 ${name}</a></div>`;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Root Directory Selector</title></head>
    <body style="padding: 20px; font-family: sans-serif; background: #f0f0f0;">
      <h1>🗂️ 디렉토리를 선택하세요</h1>
      ${links.join('\n')}
    </body>
    </html>
  `;

  res.send(html);
});

// ✅ 디렉토리 탐색 및 미디어 렌더링
app.get('/browse', (req, res) => {
  const rootKey = req.query.root;
  const relativeDir = req.query.dir || '';

  const rootPath = ROOT_DIRS[rootKey];
  if (!rootPath) return res.status(404).send('Invalid root directory');

  const absoluteDir = path.join(rootPath, relativeDir);
  if (!absoluteDir.startsWith(rootPath)) {
    return res.status(403).send('Access Denied');
  }

  let files;
  try {
    files = fs.readdirSync(absoluteDir);
  } catch (err) {
    return res.status(404).send('Directory not found');
  }

  const subdirs = files.filter(f => fs.statSync(path.join(absoluteDir, f)).isDirectory());
  const folderLinks = subdirs.map(sub => {
    const subPath = path.join(relativeDir, sub).replace(/\\/g, '/');
    return `<div><a href="/browse?root=${rootKey}&dir=${encodeURIComponent(subPath)}" style="font-weight: bold; display: block; margin: 10px 0;">📁 ${sub}</a></div>`;
  });

  const mediaFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    const fullPath = path.join(absoluteDir, f);
    return fs.statSync(fullPath).isFile() && ['.jpg', '.jpeg', '.png', '.mp4', '.webm'].includes(ext);
  });

  const totalPages = Math.ceil(mediaFiles.length / ITEMS_PER_PAGE);
  const currentPage = parseInt(req.query.page) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = mediaFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const mediaTags = currentItems.map(file => {
    const ext = path.extname(file).toLowerCase();
    const mediaPath = path.join(relativeDir, file).replace(/\\/g, '/');
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      return `<img src="${mediaPath}" style="width: 100%; margin-bottom: 20px;" />`;
    } else {
      return `<video controls src="${mediaPath}" style="width: 100%; margin-bottom: 20px;"></video>`;
    }
  });

  const paginationButtons = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    const activeStyle = (pageNum === currentPage) ? 'font-weight: bold; background: #ccc;' : '';
    return `<a href="/browse?root=${rootKey}&dir=${encodeURIComponent(relativeDir)}&page=${pageNum}" style="margin: 0 5px; padding: 5px 10px; text-decoration: none; border: 1px solid #aaa; ${activeStyle}">${pageNum}</a>`;
  });

  const parentDir = relativeDir ? path.dirname(relativeDir).replace(/\\/g, '/') : null;
  const parentLink = parentDir && parentDir !== '.' ? `<a href="/browse?root=${rootKey}&dir=${encodeURIComponent(parentDir)}">⬅️ 상위 폴더로</a>` : `<a href="/">⬅️ 루트 선택으로</a>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Media Viewer</title></head>
    <body style="margin: 0; padding: 20px; font-family: sans-serif; background: #f0f0f0;">
      <h2>📂 /${rootKey}/${relativeDir}</h2>
      ${parentLink}
      <div style="margin: 20px 0;">
        ${folderLinks.join('\n')}
      </div>
      <div style="margin-bottom: 20px;">
        ${paginationButtons.join(' ')}
      </div>
      ${mediaTags.join('\n')}
      <div style="margin-top: 20px;">
        ${paginationButtons.join(' ')}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
