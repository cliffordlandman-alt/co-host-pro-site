# Co-Host Pro website (draft, not published)

Static company website for Co-Host Pro (https://co-host.pro). Plain HTML, CSS and a few lines of JavaScript. No framework and no dependencies: building needs only Node.js 18 or newer.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/` and writes `build-report.txt` (pages + every empty business detail) |
| `npm run serve` | Serves `dist/` at http://127.0.0.1:8088 with the same security headers as `_headers` |
| `npm run screens` | Full-page screenshots of every page at 1440 and 390 px into `screens/cohostpro-<page>-<width>.png` (needs the server running) |
| `npm run zip` | Builds, then zips `dist/` (with `.htaccess` and `_headers`) to `co-host-pro-site-dist.zip` (needs python3) |
| `node tools/test-config.mjs` | Checks that empty fields are hidden and filled fields appear |

## Business details: `site.config.json`

All company and contact details live in **one file**, `site.config.json`. Every empty value (`""`) is **hidden** on the site: no label, no placeholder and no dead link. A `{{field}}` used outside an `<!--if:field-->` guard stops the build, so a placeholder can't ship by mistake.

Fill these in **only with true, verifiable details**, then run `npm run build`:

- `site.url`: set to `https://co-host.pro` (turns on canonical links and `sitemap.xml`)
- `company.legalName`, `company.tradeLicenceNumber`, `company.licensingAuthority`, `company.registeredAddress`, `company.vatTrn`
- `contact.email`, `contact.privacyEmail`, `contact.securityEmail`: all set to `hello@co-host.pro`. Don't add other addresses unless the mailbox exists.
- `contact.phone`, `contact.whatsapp`
- `privacy.popiaInformationOfficer` (South Africa POPIA), `legal.governingLaw` (for example "the laws of the Emirate of Dubai and the federal laws of the UAE", only if a lawyer confirms it), `hosting.dataRegion`, `social.linkedin`

Legal entity, licence, address, VAT TRN, phone and WhatsApp are still empty, so they're hidden on the site.

## Content rules

- Strictly truthful. No testimonials, customer counts, client logos, awards, certifications or integration claims.
- Co-Host Pro is **not** an Airbnb partner and is not affiliated with or endorsed by Airbnb (the footer says so on every page). No Airbnb logo anywhere. The channel connection is described as **iCal-based** (each listing's iCal calendar link, read-only).
- The Airbnb link import (reading public Airbnb listing pages) was switched off in the app on 4 Oct 2026. The site must not offer it. Only Airbnb's own CSV files (reservations export, reservation breakdowns) are mentioned as imports.
- Naming: the company and brand is **Co-Host Pro**, and the software is **the Co-Host Pro app**.
- App screenshots in `src/assets/img/app/` come from an **isolated copy** of the app (its codebase is still named YallaPMS/YallaStay internally) seeded with invented data ("Demo Owner A", "Lena Demo", "(demo)" properties, `example.invalid` emails). Channel logo icons were hidden in the screenshots. In the screenshots that show the in-app name, the app's built-in "YallaStay" name and logo were swapped for Co-Host Pro in the page before the shot (`tools/app-screenshots/shoot-cohostpro.mjs`). No real guest, owner or calendar-link data.

## Layout

```
site.config.json        business details (empty = hidden)
src/pages/*.html        page content, with a <!--meta {...}--> header
src/partials/           head, header (wordmark + nav), footer
src/assets/             css, js, fonts (Inter, OFL licence), img (logo, icons, app screenshots, OG image)
src/static/             favicon.ico, apple-touch-icon.png, site.webmanifest
tools/build.mjs         the build (also writes _headers and .htaccess security headers)
tools/brand/            wordmark / OG image sources and renderer
dist/                   build output (committed, ready to upload)
screens/                page screenshots at 1440 and 390 (cohostpro-*.png)
HOSTING.md              how to put it live on Hostinger (nothing has been published)
```
