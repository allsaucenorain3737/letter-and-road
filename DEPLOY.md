# Deployment

This project is intentionally deployable to both GitHub Pages and Cloudflare Pages. Keep both deployments available:

- **GitHub Pages:** <https://tgkoetje.github.io/letter-and-road/>
- **Cloudflare Pages:** the project’s `https://<project>.pages.dev/` URL at the domain root, with a future custom domain added later.

## BASE_PATH

`vite.config.ts` uses:

```ts
base: process.env.BASE_PATH || '/',
```

The existing GitHub Pages workflow (`.github/workflows/deploy.yml`) keeps the repository-subpath build correct by setting:

```yaml
BASE_PATH: /letter-and-road/
```

For Cloudflare Pages, use `BASE_PATH=/` (or leave it unset, since `/` is the Vite default). In short:

| Host | Build setting | Site path |
| --- | --- | --- |
| GitHub Pages | `BASE_PATH=/letter-and-road/` | `/letter-and-road/` |
| Cloudflare Pages | `BASE_PATH=/` or unset | `/` |

Do not remove the GitHub Pages override when changing Cloudflare settings; the two builds need different base paths.

## Cloudflare Pages setup

Create or select the Pages project and configure:

- **Plan:** Free only; do not change billing or enable paid features.
- **Framework preset:** None / Vite.
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 20
- **Production branch:** `main`
- **Environment variable:** `BASE_PATH=/` (or omit it and use the Vite default).

Connect the repository so pushes to `main` build the production deployment. Verify the root URL on the generated `*.pages.dev` hostname after the first successful build.

## GitHub Pages setup

Keep the existing `.github/workflows/deploy.yml` workflow. It builds on pushes to `main`, uses the GitHub Pages artifact/deployment actions, and passes `BASE_PATH=/letter-and-road/` only to the GitHub Pages build. Do not change that value to `/`; doing so would break asset paths under the GitHub Pages subpath.

## Future Namecheap custom domain

No domain purchase or DNS change is part of this setup. When a custom domain is available, first add it in **Cloudflare Dashboard → Workers & Pages → the project → Custom domains**. Do not rely on creating a DNS record alone; Cloudflare must associate and provision the hostname first.

There are two normal Namecheap approaches:

1. **Subdomain, keeping DNS at Namecheap.** In Namecheap **Advanced DNS**, add the CNAME that Cloudflare provides. Typically, for `www.example.com` or another subdomain, the host is `www` (or the chosen label) and the target is the project hostname, such as `<project>.pages.dev`. Use the exact target shown by Cloudflare. Remove or replace any conflicting record for that same host, and preserve unrelated records such as mail records.
2. **Apex/root domain, using Cloudflare DNS.** Add the domain as a Cloudflare zone, choose the Free plan, and copy the two Cloudflare-assigned nameservers. In Namecheap **Domain List → Manage → Nameservers**, choose **Custom DNS** and enter those nameservers. After propagation, manage DNS records in Cloudflare and finish the Pages custom-domain setup there. Before switching nameservers, copy/recreate all required existing records (especially MX/TXT records for email and verification); the DNS authority moves from Namecheap to Cloudflare.

DNS and certificate activation can take time to propagate. Use Cloudflare’s displayed CNAME/verification target rather than guessing, and test both the custom hostname and the existing `*.pages.dev` hostname. If desired later, configure a Cloudflare redirect from `*.pages.dev` to the custom domain; that is separate from the initial deployment.

References:

- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Namecheap: DNS with a Cloudflare account](https://www.namecheap.com/support/knowledgebase/article.aspx/9607/2210/how-to-set-up-dns-records-for-your-domain-in-a-cloudflare-account/)

## Review and release rules

Deployment configuration does not bypass project review. Content changes should continue through the project’s normal content PR and review process, and merges to `main` remain subject to those rules (including independent human review for public content). This document does not authorize direct merges, publishing unreviewed content, or changes to billing.

## Live Cloudflare Pages project (created 2026-09-27)

- **Project name:** `letter-and-road`
- **Production URL:** https://letter-and-road.pages.dev
- **GitHub:** `tgkoetje/letter-and-road` (branch `main`)
- **Build:** `npm run build` → `/dist`
- **Env:** `BASE_PATH=/`
- **Note:** Dashboard had no Node version field; first successful deploy used Cloudflare’s default Node 22.16.0. Prefer pinning `NODE_VERSION=20` in environment variables if you need Node 20 specifically.


## Headers (Cloudflare Pages)

`public/_headers` is copied into `dist/` and applied by Cloudflare Pages:

- **HSTS** `max-age=31536000; includeSubDomains; preload`
- **CSP** allowing self assets, OpenFreeMap tiles/fonts, Google Fonts, GA gtag (when consented), and same-origin MapLibre worker (`blob:` workers)

GitHub Pages does not read `_headers`; production hardening targets Cloudflare / letterandroad.com.

## Google Analytics

- Set `VITE_GA_MEASUREMENT_ID=G-…` on the Cloudflare Pages production build.
- Leave unset or empty on preview builds to disable measurement.
- Consent Mode v2 defaults `analytics_storage` to denied until the user Accepts.
