import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function heartGardenAssets() {
  const root = path.resolve(__dirname, '爱心代码合集');
  const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.mid': 'audio/midi',
  };

  return {
    name: 'heart-garden-assets',
    configureServer(server) {
      server.middlewares.use('/heart-garden', (req, res, next) => {
        const url = req.url?.split('?')[0] || '/';
        const decoded = decodeURIComponent(url.replace(/^\/+/, ''));
        const filePath = path.resolve(root, decoded);
        if (filePath !== root && !filePath.startsWith(root + path.sep)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next();
          return;
        }
        res.setHeader('Content-Type', contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
        res.end(fs.readFileSync(filePath));
      });
    },
  };
}

export default defineConfig({
  plugins: [heartGardenAssets()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
