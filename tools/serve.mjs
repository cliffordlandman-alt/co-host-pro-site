// Tiny static server for dist/ with clean URLs and the 404 page. node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const dist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
const port = Number(process.argv[2] || process.env.PORT || 8088);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' };
const hdrText = await readFile(path.join(dist, '_headers'), 'utf8').catch(() => '');
const globalHeaders = Object.fromEntries((hdrText.split(/\n(?=\S)/)[0] || '').split('\n').slice(1).map(l => l.trim().split(/:\s(.+)/)).filter(x => x[1]).map(([k, v]) => [k, v]));
createServer(async (req, res) => {
  for (const [k, v] of Object.entries(globalHeaders)) res.setHeader(k, v);
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(dist, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  try { if ((await stat(f)).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); } f = path.join(f, 'index.html'); } 
    const body = await readFile(f); res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(await readFile(path.join(dist, '404.html')).catch(() => 'Not found')); }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${dist} on http://127.0.0.1:${port}`));
