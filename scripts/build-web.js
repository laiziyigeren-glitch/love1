const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist-web');

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const DEPLOYABLE_EXTENSIONS = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.mp3',
  '.wav',
  '.ogg',
  '.mid',
  '.ttf',
  '.woff',
  '.woff2',
  '.txt'
]);

const IGNORED_DIRS = new Set(['.git', '.idea', '__MACOSX']);
const IGNORED_FILES = new Set(['desktop.ini', 'thumbs.db', '.ds_store']);

function shouldCopyStaticFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (IGNORED_FILES.has(base)) return false;
  return DEPLOYABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name.toLowerCase())) continue;
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile() && shouldCopyStaticFile(sourcePath)) {
      copyFile(sourcePath, targetPath);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyFile(path.join(root, 'you-and-me.html'), path.join(outDir, 'you-and-me.html'));
copyFile(path.join(root, 'you-and-me.html'), path.join(outDir, 'you-and-me', 'index.html'));
copyFile(path.join(root, 'index.html'), path.join(outDir, 'index.html'));
copyFile(path.join(root, 'config.example.js'), path.join(outDir, 'config.js'));
copyDir(path.join(root, '爱心代码合集'), path.join(outDir, 'heart-garden'));

console.log(`Built front-end static files into ${outDir}`);
