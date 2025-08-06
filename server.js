const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9999;

const BASE_DIRECTORY = path.resolve("D:"); // 절대경로로 변경
const ITEMS_PER_PAGE = 20;

// 정적 파일 서빙 (정적 파일은 BASE_DIRECTORY 기준으로 접근)
app.use(express.static(BASE_DIRECTORY));

app.get('/', (req, res) => {
  const relativeDir = req.query.dir || '';
  const absoluteDir = path.join(BASE_DIRECTORY, relativeDir);

  if (!absoluteDir.startsWith(BASE_DIRECTORY)) {
    return res.status(403).send('Access Denied');
  }

  let files;
  try {
    files = fs.readdirSync(absoluteDir);
  } catch (err) {
    return res.status(404).send('Directory not found');
  }

  // 서브디렉토리 링크
  const subdirs = files.filter(f => {
    const fullPath = path.join(absoluteDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  const folderLinks = subdirs.map(sub => {
    const subPath = path.join(relativeDir, sub).replace(/\\/g, '/');
    return `<div><a href="/?dir=${encodeURIComponent(subPath)}" style="font-weight: bold; display: block; margin: 10px 0;">📁 ${sub}</a></div>`;
  });

  // 미디어 파일 필터링
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

  // 페이지 버튼
  const paginationButtons = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    const activeStyle = (pageNum === currentPage) ? 'font-weight: bold; background: #ccc;' : '';
    return `<a href="/?dir=${encodeURIComponent(relativeDir)}&page=${pageNum}" style="margin: 0 5px; padding: 5px 10px; text-decoration: none; border: 1px solid #aaa; ${activeStyle}">${pageNum}</a>`;
  });

  // 상위 폴더 이동
  const parentDir = relativeDir ? path.dirname(relativeDir).replace(/\\/g, '/') : null;
  const parentLink = parentDir && parentDir !== '.' ? `<a href="/?dir=${encodeURIComponent(parentDir)}">⬅️ 상위 폴더로</a>` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Media Viewer</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: sans-serif; background: #f0f0f0;">
      <h2>📂 /${relativeDir}</h2>
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
