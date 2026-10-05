How the app screenshots were made (box only, 4 Oct 2026)

1. A separate, throwaway copy of YallaPMS was started from /workspace/yallapms/src with an empty database
   (API port 3091, web port 5191, LOCAL_DATA_DIR=/tmp/yp-demo/db, SYNC_SCHEDULER=off). It never touched
   the real box database or any channel feed.
2. seed-demo.mjs filled it with invented data only: "Demo Owner A/B/C", properties named "... (demo)",
   guests named "<first name> Demo", @example.invalid emails, no calendar links.
3. shoot-final.mjs took the screenshots, hiding the Airbnb / Booking.com / Vrbo logo icons in calendar bars.
   They were then cropped and converted to WebP in src/assets/img/app/.

Co-Host Pro rebrand (4 Oct 2026)

4. The same isolated copy (same demo database, API :3091 / web :5191, SYNC_SCHEDULER=off) was started again, and
   shoot-cohostpro.mjs re-took the six screenshots that show the in-app name (dashboard, income-sept, owner-portal,
   m-dashboard, m-income, m-booking). Before each shot, the app's built-in "YallaStay" text and logo were replaced
   in the browser page with "Co-Host Pro" and the Co-Host Pro mark. The app's source code and database were not changed.
   The images were resized to the same pixel sizes as before. The other five screenshots show no brand name and were kept.
   The demo copy was stopped afterwards.
