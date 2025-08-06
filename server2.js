// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 9999

// const DIRECTORY = "a";

// // 정적 파일 제공 (현재 디렉토리)
// app.use(express.static(DIRECTORY));

// // 메인 페이지 라우팅
// app.get('/', (req, res) => {
//   const files = fs.readdirSync(DIRECTORY);

//   const imageExtensions = ['.jpg', '.jpeg', '.png'];
//   const videoExtensions = ['.mp4', '.webm'];

//   let html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8">
//       <title>미디어 뷰어</title>
//       <style>
//         body {
//           margin: 0;
//           padding: 20px;
//           font-family: sans-serif;
//           background: #f4f4f4;
//         }
//         img, video {
//           display: block;
//           max-width: 100%;
//           width: 100%;
//           margin: 20px auto;
//           box-shadow: 0 0 10px rgba(0,0,0,0.2);
//         }
//       </style>
//     </head>
//     <body>
//       <h1>📷 이미지 및 🎥 비디오 뷰어</h1>
//   `;

//   for (const file of files) {
//     const ext = path.extname(file).toLowerCase();

//     if (imageExtensions.includes(ext)) {
//       html += `<img src="${file}" alt="${file}">\n`;
//     } else if (videoExtensions.includes(ext)) {
//       html += `
//         <video controls>
//           <source src="${file}" type="video/${ext.slice(1)}">
//           브라우저가 비디오를 지원하지 않습니다.
//         </video>\n`;
//     }
//   }

//   html += `
//     </body>
//     </html>
//   `;

//   res.send(html);
// });

// app.listen(PORT, () => {
//   console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
// });
