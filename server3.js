// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 9999;

// const DIRECTORY = "a"

// // 정적 파일 서빙 (이미지/비디오 접근 허용)
// app.use(express.static(DIRECTORY));

// app.get('/', (req, res) => {
//   const files = fs.readdirSync(DIRECTORY);

//   const mediaFiles = files.filter(file => {
//     const ext = path.extname(file).toLowerCase();
//     return ['.jpg', '.jpeg', '.png', '.mp4', '.webm'].includes(ext);
//   });

//   const htmlMediaTags = mediaFiles.map(file => {
//     const ext = path.extname(file).toLowerCase();
//     if (['.jpg', '.jpeg', '.png'].includes(ext)) {
//       return `<img src="${file}" style="width: 100%; margin-bottom: 20px;" />`;
//     } else if (['.mp4', '.webm'].includes(ext)) {
//       return `<video controls src="${file}" style="width: 100%; margin-bottom: 20px;"></video>`;
//     }
//   });

//   const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <title>Media Viewer</title>
//     </head>
//     <body style="margin: 0; padding: 20px; font-family: sans-serif; background: #f0f0f0;">
//       ${htmlMediaTags.join('\n')}
//     </body>
//     </html>
//   `;

//   res.send(html);
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server is running at http://localhost:${PORT}`);
// });
