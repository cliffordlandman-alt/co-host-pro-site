// Re-shoots the app screenshots that show the in-app brand name, from the ISOLATED demo copy only
// (API :3091 / web :5191, DB /tmp/yp-demo/db, SYNC_SCHEDULER=off, invented data). Channel logos hidden.
// The app's built-in brand text and logo are swapped for "Co-Host Pro" and the Co-Host Pro mark in the page
// before each screenshot. Nothing in the app's source or database is changed.
import { chromium } from '/node_modules/playwright-core/index.mjs';
import { readFileSync } from 'node:fs';
const B = 'http://127.0.0.1:3091/api', W = 'http://127.0.0.1:5191', OUT = '/workspace/yallapms-site-work/app-cohostpro';
const mark = 'data:image/svg+xml;base64,' + Buffer.from(readFileSync(new URL('../../src/assets/img/favicon.svg', import.meta.url))).toString('base64');
const post = async (r, body, tok) => (await fetch(B + r, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body) })).json();
const login = await post('/auth/login', { email: 'demo@example.invalid', password: 'Demo-only-7731!' });
const H = { Authorization: `Bearer ${login.token}` };
const resv = (await (await fetch(B + '/reservations', { headers: H })).json()).find(r => r.guestName === 'Lena Demo');
const css = `svg[aria-label="Airbnb"],svg[aria-label="Booking.com"],svg[aria-label="Vrbo"],img[alt*="Airbnb" i],img[alt*="Booking" i]{display:none!important}`;
const rebrand = ([css, mark]) => {
  const fix = root => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (/YallaStay/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/YallaStay Holiday Homes/g, 'Co-Host Pro').replace(/YallaStay/g, 'Co-Host Pro');
    for (const img of document.querySelectorAll('img[alt*="YallaStay"]')) { img.src = mark; img.alt = 'Co-Host Pro'; }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    fix(document.body); new MutationObserver(() => fix(document.body)).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
};
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
async function ctxFor(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(v => { localStorage.setItem('ys_auth', v); localStorage.setItem('ys_onboarded', '1'); }, JSON.stringify({ user: login.user, token: login.token }));
  await ctx.addInitScript(rebrand, [css, mark]);
  return ctx;
}
async function shot(page, path, name, clipFn) {
  await page.goto(W + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  const left = await page.evaluate(() => document.body.innerText.includes('YallaStay'));
  const clip = clipFn ? await clipFn(page) : undefined;
  await page.screenshot({ path: `${OUT}/${name}.png`, ...(clip ? { clip } : {}) });
  console.log(name, left ? 'WARNING: YallaStay text still visible' : 'ok', clip ? JSON.stringify(clip) : '');
}
let ctx = await ctxFor(1440, 900); let page = await ctx.newPage();
await shot(page, '/dashboard', 'dashboard');
await ctx.close();
ctx = await ctxFor(1440, 1100); page = await ctx.newPage();
await shot(page, '/income?month=2026-09', 'income-sept', async p => { const r = await p.locator('h1').first().boundingBox(); return { x: 252, y: Math.max(0, r.y - 6), width: 1176, height: Math.round(1176 * 1251 / 1800) }; });
await ctx.close();
const owners = await (await fetch(B + '/owners', { headers: H })).json();
const reset = await post('/owner-auth/admin-reset', { ownerId: owners[0].id }, login.token);
const ver = await post('/owner-auth/verify', { ownerId: owners[0].id, code: reset.devCode });
ctx = await ctxFor(1200, 900);
await ctx.addInitScript(([t, id, n]) => { sessionStorage.setItem('ownerPortalToken', t); sessionStorage.setItem('ownerPortalId', id); sessionStorage.setItem('ownerPortalName', n); }, [ver.token, String(ver.owner.id), ver.owner.name]);
page = await ctx.newPage(); await shot(page, '/owner-portal', 'owner-portal'); await ctx.close();
ctx = await ctxFor(390, 844); page = await ctx.newPage();
await shot(page, '/dashboard', 'm-dashboard');
await shot(page, '/income?month=2026-09', 'm-income');
await shot(page, `/reservations/${resv.id}`, 'm-booking');
await ctx.close();
await browser.close();
