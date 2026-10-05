// Full-page screenshots of every page at 1440 and 390 px wide from the local server (npm run serve).
import { chromium } from '/node_modules/playwright-core/index.mjs';
import path from 'node:path';
const base = process.env.SITE_BASE || 'http://127.0.0.1:8088';
const out = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../screens');
const pages = [['home', '/'], ['features', '/features/'], ['hosts-and-co-hosts', '/hosts-and-co-hosts/'], ['about', '/about/'], ['pricing', '/pricing/'], ['contact', '/contact/'], ['privacy', '/privacy/'], ['terms', '/terms/'], ['security', '/security/'], ['channel-data', '/channel-data/'], ['404', '/does-not-exist']];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()); }); page.on('requestfailed', r => errs.push('failed ' + r.url()));
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('does-not-exist')) errs.push(r.status() + ' ' + r.url()); });
  for (const [name, p] of pages) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { for (const img of document.images) { img.loading = 'eager'; } await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = `${out}/cohostpro-${name}-${w}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file, overflow ? `HORIZONTAL OVERFLOW ${overflow}px` : 'ok', errs.splice(0).join(' | '));
  }
  if (w === 390) { // mobile menu check
    await page.goto(base + '/', { waitUntil: 'networkidle' }); await page.click('.nav-toggle'); await page.waitForTimeout(200);
    const open = await page.evaluate(() => document.getElementById('site-nav').classList.contains('open') && document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'true');
    await page.screenshot({ path: `${out}/cohostpro-home-390-menu-open.png` }); console.log('mobile menu opens:', open);
  }
  await ctx.close();
}
await b.close();
