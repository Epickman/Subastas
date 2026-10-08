const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '@ffmpeg', 'ffmpeg', 'dist', 'esm');
const dest = path.join(__dirname, '..', 'public', 'ffmpeg');

fs.mkdirSync(dest, { recursive: true });

for (const file of ['worker.js', 'const.js', 'errors.js']) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
