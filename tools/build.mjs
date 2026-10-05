// Static build for the Co-Host Pro website. No dependencies: node tools/build.mjs
// - Pages live in src/pages/*.html with a <!--meta {...}--> header.
// - Business details come only from site.config.json. Empty values are never shown:
//     <!--if:contact.email--> ... <!--/if-->      kept only when the field has a value
//     <!--if:a|b--> ... <!--/if-->                kept when ANY of the fields has a value
//     <!--ifnot:a|b--> ... <!--/if-->             kept only when ALL of the fields are empty
//     {{contact.email}}  {{mailto:contact.email}}  {{tel:contact.phone}}  {{wa:contact.whatsapp}}
//   Using {{field}} outside a guard while it is empty stops the build, so a placeholder can never ship.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'src'), out = process.env.SITE_OUT || path.join(root, 'dist');
const cfg = JSON.parse(readFileSync(process.env.SITE_CONFIG || path.join(root, 'site.config.json'), 'utf8'));
const get = k => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), cfg);
const has = k => { const v = get(k); return typeof v === 'string' ? v.trim() !== '' : v != null && v !== false; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const year = new Date().getFullYear();

function emptyFields(o = cfg, pre = '') {
  return Object.entries(o).flatMap(([k, v]) => k.startsWith('_') ? [] : (v && typeof v === 'object') ? emptyFields(v, pre + k + '.') : (typeof v === 'string' && !v.trim()) ? [pre + k] : []);
}
function render(html, where) {
  const re = /<!--(if|ifnot):([\w.|]+)-->((?:(?!<!--if)[\s\S])*?)<!--\/if-->/;
  let m;
  while ((m = html.match(re))) {
    const keys = m[2].split('|'); const any = keys.some(has);
    const keep = m[1] === 'if' ? any : !any;
    html = html.replace(m[0], keep ? m[3] : '');
  }
  return html.replace(/\{\{(?:(mailto|tel|wa):)?([\w.]+)\}\}/g, (_, kind, key) => {
    if (key === 'year') return String(year);
    if (!has(key)) throw new Error(`${where}: {{${key}}} is empty but not inside <!--if:${key}--> guard`);
    const v = String(get(key)).trim();
    if (kind === 'mailto') return 'mailto:' + esc(v);
    if (kind === 'tel') return 'tel:' + esc(v.replace(/[^\d+]/g, ''));
    if (kind === 'wa') return 'https://wa.me/' + esc(v.replace(/[^\d]/g, ''));
    return esc(v);
  });
}
function walk(dir) { return readdirSync(dir).flatMap(f => { const p = path.join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; }); }
function copyDir(from, to) { for (const f of walk(from)) { const t = path.join(to, path.relative(from, f)); mkdirSync(path.dirname(t), { recursive: true }); copyFileSync(f, t); } }

rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
copyDir(path.join(src, 'assets'), path.join(out, 'assets'));
for (const f of readdirSync(path.join(src, 'static'))) copyFileSync(path.join(src, 'static', f), path.join(out, f));
const ver = f => createHash('sha1').update(readFileSync(path.join(src, 'assets', f))).digest('hex').slice(0, 8);
const header = readFileSync(path.join(src, 'partials/header.html'), 'utf8');
const footer = readFileSync(path.join(src, 'partials/footer.html'), 'utf8');
const head = readFileSync(path.join(src, 'partials/head.html'), 'utf8');
const siteUrl = has('site.url') ? get('site.url').replace(/\/+$/, '') : '';
const pages = [];
for (const file of readdirSync(path.join(src, 'pages')).filter(f => f.endsWith('.html')).sort()) {
  const raw = readFileSync(path.join(src, 'pages', file), 'utf8');
  const mm = raw.match(/^<!--meta\s+([\s\S]*?)-->/); if (!mm) throw new Error(file + ': missing <!--meta--> header');
  const meta = JSON.parse(mm[1]); const body = raw.slice(mm[0].length);
  const canonical = siteUrl && !meta.noindex ? siteUrl + meta.path : '';
  const ld = meta.path === '/' ? JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'Organization', name: get('brand.name'), ...(has('company.legalName') ? { legalName: get('company.legalName') } : {}),
      ...(siteUrl ? { url: siteUrl + '/', logo: siteUrl + '/assets/img/cohostpro-logo.png' } : {}), ...(has('contact.email') ? { email: get('contact.email') } : {}),
      ...(has('contact.phone') ? { telephone: get('contact.phone') } : {}), ...(has('company.registeredAddress') ? { address: get('company.registeredAddress') } : {}),
      founder: { '@type': 'Person', name: get('brand.founderName') } },
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: get('brand.name'), applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser',
      description: meta.description, ...(siteUrl ? { url: siteUrl + '/' } : {}) }]) : '';
  let html = head
    .replace(/%TITLE%/g, esc(meta.title)).replace(/%DESC%/g, esc(meta.description))
    .replace('%CANONICAL%', canonical ? `<link rel="canonical" href="${esc(canonical)}">\n<meta property="og:url" content="${esc(canonical)}">` : '')
    .replace('%OGIMAGE%', esc((siteUrl || '') + '/assets/img/og-image.png'))
    .replace('%NOINDEX%', meta.noindex ? '<meta name="robots" content="noindex">' : '')
    .replace('%LD%', ld ? `<script type="application/ld+json">${ld.replace(/</g, '\\u003c')}</script>` : '')
    .replace(/%CSSV%/g, ver('css/site.css')).replace(/%JSV%/g, ver('js/site.js'))
    + header.replace(new RegExp(`data-nav="${meta.nav}"`), `data-nav="${meta.nav}" aria-current="page"`)
    + `<main id="main">${body}</main>` + footer + '\n</body>\n</html>\n';
  html = render(html, file);
  const left = html.match(/\{\{|<!--if|<!--\/if/); if (left) throw new Error(file + ': unprocessed template tag ' + left[0]);
  const dest = meta.path === '/404' ? path.join(out, '404.html') : path.join(out, meta.path, 'index.html');
  mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, html);
  pages.push({ ...meta, file: path.relative(out, dest) });
}
// Security headers for hosts that support them (Cloudflare Pages / Netlify: _headers; Hostinger / Apache / LiteSpeed: .htaccess).
const inline = head.match(/<script>([^<]*)<\/script>/)[1];
const csp = `default-src 'self'; script-src 'self' 'sha256-${createHash('sha256').update(inline).digest('base64')}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; object-src 'none'`;
const hdrs = { 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()' };
writeFileSync(path.join(out, '_headers'), `/*\n${Object.entries(hdrs).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n/assets/*\n  Cache-Control: public, max-age=604800\n`);
writeFileSync(path.join(out, '.htaccess'), `# For Hostinger (LiteSpeed/Apache). Turn on "Force HTTPS" in hPanel once SSL is active.\nErrorDocument 404 /404.html\nOptions -Indexes\n<IfModule mod_headers.c>\n${Object.entries(hdrs).map(([k, v]) => `  Header always set ${k} "${v}"`).join('\n')}\n  <FilesMatch "\\.(css|js|woff2|webp|png|svg|ico)$">\n    Header set Cache-Control "public, max-age=604800"\n  </FilesMatch>\n</IfModule>\n<Files "_headers">\n  Require all denied\n</Files>\n`);
writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl) writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p => !p.noindex).map(p => `  <url><loc>${siteUrl}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);

const missing = emptyFields();
const channels = ['contact.email', 'contact.phone', 'contact.whatsapp'].filter(has);
const report = [`Co-Host Pro site build ${new Date().toISOString()}`, `Pages: ${pages.length}`, ...pages.map(p => `  ${p.path.padEnd(16)} ${p.file}`),
  `Empty fields in site.config.json (hidden on the site): ${missing.length ? '' : 'none'}`, ...missing.map(k => '  - ' + k),
  channels.length ? `Contact channels shown: ${channels.join(', ')}` : 'WARNING: no contact channel is configured (contact.email / phone / whatsapp). The Contact page shows no way to reach you. Set at least contact.email before publishing.',
  siteUrl ? '' : 'NOTE: site.url is empty, so canonical links and sitemap.xml are not generated. Set it once the domain is chosen.'].join('\n');
if (!process.env.SITE_OUT) writeFileSync(path.join(root, 'build-report.txt'), report + '\n');
console.log(report);
