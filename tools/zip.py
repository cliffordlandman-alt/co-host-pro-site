# Zips dist/ (including .htaccess and _headers) to co-host-pro-site-dist.zip with files at the zip root.
import os, zipfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist, out = os.path.join(root, 'dist'), os.path.join(root, 'co-host-pro-site-dist.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for d, _, files in os.walk(dist):
        for f in sorted(files):
            p = os.path.join(d, f); z.write(p, os.path.relpath(p, dist))
print(out, os.path.getsize(out), 'bytes')
