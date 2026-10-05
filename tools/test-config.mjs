// Checks the "hide empty fields" rule both ways: with the real (mostly empty) config nothing leaks,
// and with a fully filled TEST config every field appears. The test config is never used for the real build.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const walk = d => readdirSync(d).flatMap(f => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const htmlOf = dir => walk(dir).filter(f => f.endsWith('.html')).map(f => [path.relative(dir, f), readFileSync(f, 'utf8')]);
const build = (cfgPath, out) => execFileSync(process.execPath, [path.join(root, 'tools/build.mjs')], { env: { ...process.env, SITE_CONFIG: cfgPath, SITE_OUT: out }, stdio: 'pipe' });
const tmp = mkdtempSync(path.join(tmpdir(), 'chp-site-'));
// 1. real config
const real = JSON.parse(readFileSync(path.join(root, 'site.config.json'), 'utf8'));
build(path.join(root, 'site.config.json'), path.join(tmp, 'real'));
for (const [f, h] of htmlOf(path.join(tmp, 'real'))) {
  assert.ok(!/undefined|null|\{\{|<!--if|TODO|TBD|placeholder|lorem/i.test(h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')), `${f}: leaked template text`);
  if (!real.company.tradeLicenceNumber) assert.ok(!/Trade licence/.test(h), `${f}: empty trade licence label shown`);
  if (!real.company.legalName) assert.ok(!/Legal entity|operated by/.test(h), `${f}: empty legal name label shown`);
  if (!real.contact.email) assert.ok(!/mailto:/.test(h), `${f}: mailto shown without an email`);
  if (!real.contact.phone) assert.ok(!/tel:/.test(h), `${f}: tel shown without a phone`);
  assert.ok(!/<form/i.test(h), `${f}: has a form`);
  if (real.site.url && !f.startsWith('404')) assert.ok(h.includes(`<link rel="canonical" href="${real.site.url}/`), `${f}: canonical should use ${real.site.url}`);
}
// 2. filled TEST config (fake values for every business field, used only here)
const filled = JSON.parse(JSON.stringify(real));
const fill = (o, pre = '') => { for (const k of Object.keys(o)) { if (k.startsWith('_')) continue; if (o[k] && typeof o[k] === 'object') fill(o[k], pre + k + '.'); else if (typeof o[k] === 'string' && pre !== 'brand.' && k !== 'policiesLastUpdated') o[k] = k.toLowerCase().includes('email') ? `test-${k.toLowerCase()}@example.invalid` : k === 'url' ? 'https://example.invalid' : k === 'linkedin' ? 'https://example.invalid/li' : /phone|whatsapp/i.test(k) ? '+971 50 000 0000' : `TEST-${pre}${k}`; } };
fill(filled);
const cfgPath = path.join(tmp, 'filled.json'); writeFileSync(cfgPath, JSON.stringify(filled));
build(cfgPath, path.join(tmp, 'filled'));
const all = htmlOf(path.join(tmp, 'filled')).map(x => x[1]).join('\n');
for (const v of ['TEST-company.legalName', 'TEST-company.tradeLicenceNumber', 'TEST-company.registeredAddress', 'TEST-company.vatTrn', 'TEST-privacy.popiaInformationOfficer', 'TEST-legal.governingLaw', 'TEST-hosting.dataRegion', 'mailto:test-email@example.invalid', 'mailto:test-privacyemail@example.invalid', 'mailto:test-securityemail@example.invalid', 'tel:+971500000000', 'https://wa.me/971500000000', 'https://example.invalid/features/'])
  assert.ok(all.includes(v), 'filled config should show ' + v);
assert.ok(readFileSync(path.join(tmp, 'filled/sitemap.xml'), 'utf8').includes('https://example.invalid/privacy/'));
console.log('PASS: empty fields hidden (no labels, no mailto/tel, no forms, no template text); filled fields all shown; sitemap with site.url');
