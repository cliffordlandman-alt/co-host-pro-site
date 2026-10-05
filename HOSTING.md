# Putting the Co-Host Pro site live on Hostinger (not done: nothing has been uploaded or published)

Written 4 October 2026. Upload file: **`co-host-pro-site-dist.zip`** (made by `npm run zip`, about 1.3 MB). It holds the contents of `dist/`, with `index.html` and `.htaccess` at the top of the zip.

## What co-host.pro looks like today (checked 4 Oct 2026, ~13:40 Dubai time)

| Record | Value now | Meaning |
|---|---|---|
| Nameservers | `atlas.dns-parking.com`, `hyperion.dns-parking.com` | DNS is managed in Hostinger hPanel |
| MX | `mx1.hostinger.com` (priority 5), `mx2.hostinger.com` (priority 10) | Email is Hostinger Email. **Leave it alone.** |
| TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | SPF for Hostinger Email. **Leave it alone.** |
| TXT | `replit-verify=cf5badc9-…` | Left over from linking the domain to Replit |
| A `@` | `34.111.179.208` (Google Frontend) | **The current site (`co-host.pro`) is served by a Replit deployment, not by Hostinger `public_html`.** |
| CNAME `www` | `www.co-host.pro.cdn.hstgr.net` | `www` already points to Hostinger (CDN). HTTP redirects to HTTPS, but HTTPS failed with a TLS error, so no certificate is active on Hostinger for `www` yet. |

What this means: replacing `public_html` alone **won't change what https://co-host.pro shows**. The apex A record must also point to Hostinger (step 5). Until then, `co-host.pro` keeps showing the old Replit page. A full backup of that page is in `/workspace/co-host-pro-backup/co-host.pro-2026-10-04/` on the box.

The old site sends `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Browsers that visited it will only load co-host.pro over HTTPS for the next two years, so SSL on Hostinger has to work (step 6). Plain HTTP won't load in those browsers.

## Before you start

- [ ] Read through the site once (`npm run serve`, then open http://127.0.0.1:8088): text, privacy policy and terms (ideally checked by a lawyer).
- [ ] Make sure the mailbox **hello@co-host.pro** exists and receives mail (hPanel → **Emails**). The site lists it as the contact, privacy and security address. If it's missing, create a mailbox or forwarder with that name. That doesn't touch MX or DNS.
- [ ] Take a screenshot or export of the current DNS zone (hPanel → **Domains → co-host.pro → DNS / Nameservers**) so you can put any record back.
- [ ] Choose a quiet time. The site may show an SSL warning for a short while after the DNS change.

## Steps

1. **Find the website in hPanel.** **Websites** → `co-host.pro` → **Dashboard**. If co-host.pro isn't listed as a website (only as a domain), add it: **Websites → Add website → Custom PHP/HTML website** → choose `co-host.pro` → start empty. Don't move or change the email service.
2. **Back up the old files first.** **Files → File Manager** → open `public_html` → turn on "show hidden files" (so `.htaccess` is included) → select everything → **Compress** → `.zip` → download the zip to your computer and keep it. (Or use **Websites → Backups → Files backup** and download it.) If `public_html` is empty or only has Hostinger's default page, still note that down.
3. **Clear `public_html`.** Delete the old files and folders, including the old `.htaccess` and Hostinger's `default.php`/`index.php`. **Keep any `.well-known` folder** (used for SSL checks). Don't touch anything outside `public_html`.
4. **Upload the new site.** In `public_html` → **Upload** → `co-host-pro-site-dist.zip` → right-click it → **Extract** into `public_html` itself (not a subfolder). `index.html`, `.htaccess`, `404.html`, `robots.txt`, `sitemap.xml`, `assets/` etc. must sit directly in `public_html`. Then delete the zip.
5. **Point `co-host.pro` (apex) at Hostinger.** **Domains → co-host.pro → DNS / Nameservers → DNS records**:
   - Change **only** the record for `@` that now says `A 34.111.179.208`. Use the value hPanel gives for this website: the IP shown under **Websites → co-host.pro → Dashboard / Website details**, or the record hPanel's "Connect domain" / DNS check recommends (with Hostinger CDN this can be an ALIAS/CNAME to `co-host.pro.cdn.hstgr.net`). Don't guess a value.
   - Leave `www` as it is (it already points to Hostinger).
   - **Don't change or delete** the MX records (`mx1`/`mx2.hostinger.com`), the SPF TXT, any DKIM records (`hostingermail-*._domainkey` CNAMEs), DMARC (`_dmarc`), or `autodiscover`/`autoconfig`. Email keeps working because none of those change.
   - Leave the `replit-verify` TXT for now. Remove it only after the Replit deployment is shut down (step 8).
6. **SSL.** **Security → SSL** → make sure a certificate is installed for `co-host.pro` **and** `www.co-host.pro`. Hostinger issues it automatically once DNS points to Hostinger, which can take from a few minutes to a few hours. Then turn on **Force HTTPS**.
7. **Check.**
   - https://co-host.pro and https://www.co-host.pro show the **Co-Host Pro** site with a valid padlock.
   - https://co-host.pro/does-not-exist shows the Co-Host Pro 404 page. https://co-host.pro/sitemap.xml lists the pages.
   - securityheaders.com shows the headers from `.htaccess`.
   - Send a test email to and from hello@co-host.pro. Check that the MX records still read `mx1`/`mx2.hostinger.com` (hPanel DNS, or `dig MX co-host.pro`).
8. **Afterwards (optional).** Once the new site has worked for a few days, remove the custom domain from the Replit deployment (or stop it), then delete the `replit-verify` TXT record.

## Rolling back

- Old Hostinger files: delete the new files in `public_html` and extract the zip from step 2.
- Old Replit page: set the `@` record back to `A 34.111.179.208`. The Replit deployment keeps running until you stop it. A full copy of that page is in the box backup above.

## Still missing (hidden on the site until filled in `site.config.json`)

Legal entity name, trade licence number and licensing authority, registered address, VAT TRN, phone, WhatsApp, POPIA Information Officer, governing law, data hosting region, LinkedIn. Add only true, verifiable details, then run `npm run zip` and upload again.
