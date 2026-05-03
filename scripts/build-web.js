const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist-web');

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyFile(path.join(root, 'you-and-me.html'), path.join(outDir, 'you-and-me.html'));
copyFile(path.join(root, 'index.html'), path.join(outDir, 'index.html'));
copyFile(path.join(root, 'config.example.js'), path.join(outDir, 'config.js'));
copyDir(path.join(root, '爱心代码合集'), path.join(outDir, 'heart-garden'));

fs.writeFileSync(
  path.join(outDir, '_redirects'),
  ['/you-and-me /you-and-me.html 200', '/you-and-me/ /you-and-me.html 200', ''].join('\n'),
);

console.log(`Built front-end static files into ${outDir}`);
