# the.Wall — The Wall Records Website

Premium memory and wall-art e-commerce landing page built with **Astro**.

## Design

Matches the reference interface with:

- **Maroon** (`#8B1A10`) and **cream** (`#F5F1E6`) alternating sections
- **Playfair Display** serif headings + **Montserrat** sans-serif body
- Sticky navigation with dropdown menus
- Art poster carousel, memory albums shelf, gallery wall, and feature icons

Brand copy and navigation structure are sourced from *The Wall Records Website* brand PDF.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Deploy (Vercel)

**Live site:** [https://the-wall-one.vercel.app](https://the-wall-one.vercel.app)

Project: `princejain756s-projects/the-wall`

```bash
npm run build
vercel deploy --prod
```

### Custom domain: `thewall.adelev8.com`

**Important:** This domain must point to the **`the-wall`** project, not `website`. If you still see a cream strip on the right or old layout, the domain is serving a stale deploy from another project.

1. [Vercel → website → Settings → Domains](https://vercel.com/princejain756s-projects/website/settings/domains) — **remove** `thewall.adelev8.com`
2. [Vercel → the-wall → Settings → Domains](https://vercel.com/princejain756s-projects/the-wall/settings/domains) — **add** `thewall.adelev8.com`
3. In your `adelev8.com` DNS, add:

| Type  | Name    | Value                |
|-------|---------|----------------------|
| CNAME | thewall | `cname.vercel-dns.com` |

(Vercel may show a different CNAME target — use whatever the dashboard displays.)

4. Wait for DNS propagation; Vercel provisions SSL automatically.

**Verify:** Open [the-wall-one.vercel.app](https://the-wall-one.vercel.app) on your phone — that URL has the fixed layout. Once the domain is moved, `thewall.adelev8.com` will match it.

> Note: Team deployment URLs ending in `*.vercel.app` may require Vercel login if Deployment Protection is on. The `the-wall-one.vercel.app` alias is public.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Header.astro
│   ├── ArtPostersSection.astro
│   ├── MemoriesSection.astro
│   ├── MemoryWallSection.astro
│   ├── FeaturesSection.astro
│   └── Footer.astro
├── layouts/Layout.astro
├── pages/index.astro
└── styles/global.css
public/
└── images/          # Brand PDF pages + reference screenshots
```

## Next Steps

- Replace Unsplash placeholders with final product photography
- Connect Shopify or custom e-commerce backend
- Add individual category and product pages from the PDF navigation map
