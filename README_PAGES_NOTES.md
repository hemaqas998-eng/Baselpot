Notes for GitHub Pages & Live Preview:

- The Pages workflow gathers frontend build output and publishes dist-out to the gh-pages branch.
- If your frontend builds to another folder (./build or frontend/dist), the workflow already tries common locations.
- If you prefer stable publishing, run locally: npm install && npm run build then commit the generated package-lock.json and build output path adjustments.
- After the first successful deploy, enable Pages in Settings → Pages → Source: gh-pages branch (if not auto-enabled).
