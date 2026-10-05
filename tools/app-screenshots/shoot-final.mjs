// Screenshots of the ISOLATED demo copy only (API :3091 / web :5191, invented data). Channel logos hidden.
import { chromium } from '/node_modules/playwright-core/index.mjs';
const B = 'http://127.0.0.1:3091/api', W = 'http://127.0.0.1:5191', OUT = '/workspace/yallapms-site-work/app';
const post = async (r, body, tok) => (await fetch(B + r, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body) })).json();
const login = await post('/auth/login', { email: 'demo@example.invalid', password: 'Demo-only-7731!' });
const H = { Authorization: `Bearer ${login.token}` };
const list = await (await fetch(B + '/reservations', { headers: H })).json();
const resv = list.find(r => r.guestName === 'Lena Demo');
const css = `svg[aria-label="Airbnb"],svg[aria-label="Booking.com"],svg[aria-label="Vrbo"],img[alt*="Airbnb" i],img[alt*="Booking" i]{display:none!important}`;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
async function ctxFor(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([v, css]) => { localStorage.setItem('ys_auth', v); localStorage.setItem('ys_onboarded', '1');
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }); }, [JSON.stringify({ user: login.user, token: login.token }), css]);
  return ctx;
}
async function shot(page, path, name, { full = false, before } = {}) {
  await page.goto(W + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1200);
  if (before) await before(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log(name);
}
const selSept = async page => {
  await page.getByRole('combobox').filter({ hasText: 'October 2026' }).first().click();
  await page.getByRole('option', { name: 'September 2026' }).click(); await page.waitForTimeout(1200);
};
let ctx = await ctxFor(1440, 900); let page = await ctx.newPage();
await shot(page, '/dashboard', 'dashboard');
await shot(page, '/multi-calendar', 'multi-calendar');
await shot(page, '/verify-bookings?month=2026-09', 'verify-bookings');
await shot(page, '/income?month=2026-09', 'income-sept');
await shot(page, '/accounting', 'owner-statements', { before: selSept });
await shot(page, '/cleaning', 'cleaning');
await ctx.close();
ctx = await ctxFor(1440, 1500); page = await ctx.newPage();
await shot(page, `/reservations/${resv.id}`, 'booking-finances');
await ctx.close();
// owner portal (read-only, demo owner A)
const owners = await (await fetch(B + '/owners', { headers: H })).json();
const reset = await post('/owner-auth/admin-reset', { ownerId: owners[0].id }, login.token);
const ver = await post('/owner-auth/verify', { ownerId: owners[0].id, code: reset.devCode });
ctx = await ctxFor(1440, 900);
await ctx.addInitScript(([t, id, n]) => { sessionStorage.setItem('ownerPortalToken', t); sessionStorage.setItem('ownerPortalId', id); sessionStorage.setItem('ownerPortalName', n); }, [ver.token, String(ver.owner.id), ver.owner.name]);
page = await ctx.newPage(); await shot(page, '/owner-portal', 'owner-portal'); await ctx.close();
// phone
ctx = await ctxFor(390, 844); page = await ctx.newPage();
await shot(page, '/dashboard', 'm-dashboard');
await shot(page, '/income?month=2026-09', 'm-income');
await shot(page, `/reservations/${resv.id}`, 'm-booking');
await ctx.close();
await browser.close();
