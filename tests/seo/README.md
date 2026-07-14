# SEO Smoke Checks

Run these after a production or preview deployment to verify that crawler-facing
HTML still exposes the expected metadata and discovery URLs.

```bash
npm run test:seo
```

The script defaults to `https://www.swu.nz`. To check another deployed origin:

```bash
SEO_BASE_URL=https://preview.example.pages.dev npm run test:seo
```

These checks intentionally hit a deployed site, so they are not part of the
normal build command.
