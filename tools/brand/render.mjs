// Renders brand PNGs (OG image, logo, icons) from the SVG/HTML sources with headless Chrome.
import { chromium } from '/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import { readFileSync } from 'node:fs';
const dir = path.dirname(new URL(import.meta.url).pathname), img = path.resolve(dir, '../../src/assets/img'), stat = path.resolve(dir, '../../src/static');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
let p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + dir + '/og.html'); await p.waitForTimeout(500); await p.screenshot({ path: img + '/og-image.png' });
p = await b.newPage({ viewport: { width: 1000, height: 192 } });
await p.goto('file://' + dir + '/logo.html'); await p.waitForFunction(() => document.title === 'ready'); await p.waitForTimeout(300);
await p.locator('#w svg').screenshot({ path: img + '/cohostpro-logo.png', omitBackground: true });
for (const [size, out] of [[512, img + '/icon-512.png'], [192, img + '/icon-192.png'], [180, stat + '/apple-touch-icon.png'], [32, dir + '/fav32.png'], [16, dir + '/fav16.png']]) {
  p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${readFileSync(img + "/favicon.svg", "utf8").replace("<svg ", `<svg width="${size}" height="${size}" style="display:block" `)}</body></html>`);
  await p.waitForTimeout(150); await p.screenshot({ path: out, omitBackground: size !== 180 });
}
await b.close();
