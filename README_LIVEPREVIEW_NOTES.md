Live preview using localtunnel

This workflow starts the Node server on a GitHub Actions runner and opens a localtunnel to expose port 3000 publicly.

Notes:
- The subdomain uses the GitHub run id to reduce collisions: palc88-<run_id>.loca.lt
- localtunnel is unstable for production but useful for ephemeral previews and testing.
- The workflow runs on push to feature/security-auth-price-fixes and on a schedule (every 30 minutes) to refresh the preview.
- Check the Actions log for the `Start localtunnel and print URL` step to see the public URL.
