# Product/Feature Request Log

---

## REQUEST #001
**Date:** 24/07/26, 9:54:17 PM
**Requested By:** Ashwin Krishna A
**Priority:** Medium
**Status:** Pending
**Deadline:** EOD (Next Day)

### Task Summary
Deliverable to be sent to boss by tomorrow EOD.

---

## REQUEST #002 — Best Sister Timeless Reference Check
**Date:** 12/08/26, 3:24:46 PM - 3:25:08 PM
**Requested By:** John
**Priority:** Informational
**Status:** Answered
**Reference Link:** https://oddgiraffe.com/collections/rakhi-gifts/products/best-sister-timeless

### John's Question
> "Just check this and for the template to upload what is the format that should be provided"

### What This Reference Page Is
Odd Giraffe's "Best Sister Timeless" is a **customisable rakhi gift page** where the customer uploads their own photo and the site wraps it in a designer template. They are *not* asking The Wall to build a new product — they want to know **what file format / spec the customer must provide** so the print comes out right at A4 / A5 / Square.

### ✅ Recommended Upload Format (For Our Customizer)

**Accepted file types:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic` (already enforced in the upload input on `src/pages/products/[slug].astro`)

**Recommended specifications:**

| Setting | Value |
|---|---|
| File format | PNG-24 (preferred) or high-quality JPEG |
| Color profile | sRGB |
| Min resolution @ A4 | 2480 × 3508 px (8.3" × 11.7") |
| Min resolution @ A5 | 1748 × 2480 px (5.8" × 8.3") |
| Min resolution @ Square | 2550 × 2550 px (8.5" × 8.5") |
| DPI | 300 DPI |
| Max file size | 25 MB |
| Bit depth | 8-bit/channel |
| Background | Transparent PNG if providing a designer template with a cutout |

**For designer templates specifically (template-with-photo-placeholder):**
- Provide a **PNG-24 with transparency**
- The "photo window" is the transparent area where the customer's photo will be composited
- Match the canvas to the target print size at 300 DPI (e.g. 2480×3508 for A4)
- Keep all decorative text/graphics on opaque layers — they will print on top of the photo
- sRGB color profile (most consumer cameras and design tools)

**Why these specs?**
- **300 DPI** is the print-industry standard for archival-quality inkjet output — anything lower starts to look soft
- **sRGB** matches what 99% of phone cameras produce; AdobeRGB/ProPhoto will look dull/wrong without conversion
- **PNG-24 with transparency** lets the customer's photo fill the cutout cleanly with no white halo

**Hard rules our system already enforces** (`src/pages/products/[slug].astro` lines 209-225):
- Accept attribute: `image/jpeg,image/png,image/webp,image/heic`
- Drop-zone text says: "Click to browse or drag & drop (JPG, PNG, HEIC up to 25MB)"
- Guidelines accordion (lines 265-273) already shows A4 2480×3508, A5 1748×2480, Square 2550×2550 px @ 300 DPI

**Optional improvements to consider** (not done yet, awaiting your sign-off):
- Add a "View template requirements" link that opens a dedicated page with downloadable PSD/AI/PDF templates for the A4/A5/Square canvases
- Client-side image validation: warn the user if the uploaded image is below the recommended resolution for the selected size (e.g. "Your image is 1200×1600 — for A4 print quality we recommend at least 2480×3508 px. We'll still print it, but it may look soft.")
- Add a "print-ready check" pass that flags low-DPI / wrong color-profile / non-transparent PNG templates

### What Was Already in Place vs What Is New

**Already in place** — no code changes needed:
- File type accept attribute on the upload input
- Max size hint in the dropzone copy
- Template & Upload Guidelines accordion with exact pixel dimensions and DPI

**Not yet in place** — possible follow-ups:
- Client-side resolution check
- Downloadable template files
- A standalone `/template-guide` page (Odd Giraffe has this — worth copying the structure)

---

## REQUEST #003 — Memory Poster / Phone Prints / Admin Redesign
**Date:** 24/08/26, 10:10:26 PM - 10:10:54 PM (last update 27/08/26 06:05)
**Requested By:** John
**Priority:** High
**Status:** ✅ Live

### Findings

**A. Memory Poster Feature — ✅ ALREADY EXISTS** (full customizer live in `src/pages/products/[slug].astro`, slug `memory-poster`, product_type `custom`)

**B. Phone Prints / Mini Prints — ✅ ALREADY REMOVED** (component file is orphaned, not imported anywhere; **kept on disk for future use** as you requested)

**C. Admin Panel Redesign — ✅ DONE & LIVE (deploy 27/08/26 05:53)**

### What shipped
- Monolithic `src/admin/AdminApp.tsx` (1,331 lines) split into focused modules under `src/admin/modules/`: `types`, `api`, `StatusBadge`, `Sidebar`, `Topbar`, `Dashboard`, `Products`, `Orders`, `Customers`, `Discounts`, `Content`, `Analytics` (12 files).
- New `src/admin/admin.css` (~900 lines): CSS vars for brand/status/space/radius/shadow, dark sidebar with grouped nav + active accent bar, sticky topbar, KPI grid, segmented filters, tabs, modern tables with clickable rows + thumbnails + chips + code blocks, toggle switches, drag-drop media tile, pipeline buttons, skeleton loaders, toasts, polished login screen with gradient hero.
- New `src/admin/AdminApp.tsx` (148 lines) — thin shell wiring modules, sidebar collapse persisted to `localStorage` key `tw-sidebar-collapsed`, ⌘K search, notification bell, loading + login screens.
- API contracts preserved — new admin uses the same endpoints as the old one (`/api/admin/{session,login,dashboard,products,orders,data,search,upload}`). No backend changes.

### Live verification (2026-08-27 05:54 IST)
| URL | Status |
|---|---|
| `/` | 200 |
| `/shop` | 200 |
| `/cart` | 200 |
| `/admin` | 200 (was 500 — fixed by atomic deploy) |
| `/products/best-sister-timeless` | 200 |
| `/collections/aesthetic` | 200 |
| `/policies/privacy` | 200 |

PM2 process `thewall`: online, fresh chunks loaded (pid 2260477, 0 restarts after deploy).

### Template upload format (asked: 12/08/26 — what format customers should provide)
Already documented on the Memory Poster PDP in the "Template & Upload Guidelines" accordion, and the upload API matches:

**File formats accepted:** JPEG, PNG, WebP, GIF, HEIC, HEIF
**Max file size:** 25 MB (enforced server-side in `src/pages/api/upload.ts`)
**Print specifications (300 DPI archival matte):**
- **A4:** 2480 × 3508 px
- **A5:** 1748 × 2480 px
- **Square (8.5" × 8.5"):** 2550 × 2550 px
- **Portrait A4/A5 standard:** 2480 × 3508 px (portrait) / 1748 × 2480 px
- **Color profile:** sRGB recommended
- **For designer templates with a photo cutout window:** PNG-24 with transparency

### Deployment notes
- Previous build was 500ing on `/admin` because PM2 was running stale chunks after a local `npm run build` (the exact failure mode the audit caught). Re-ran `bash scripts/deploy.sh` which atomically builds + restarts PM2 + reloads nginx. All pages now 200.
- For all future production changes, use `bash scripts/deploy.sh` — never `npm run build` alone.

### Follow-up: Broken 2nd gallery image + Upload Specs prominence (27/08/26 06:00)

**1. Broken gallery image fixed:**
- `memory-poster` had `/Granduncle.png` as 2nd gallery thumb; `best-sister-timeless` had `/Grandmother.png` + `/Granduncle.png` as 3rd/4th thumbs. All 3 files were 404 — data entry mistake, never committed.
- Fixed in 2 places:
  - `scripts/seed-db.mjs` (lines 343, 357) — replaced broken refs with real mockup assets (`/images/custom-made/{album,framed-wall-art,polaroids}.png/.jpg`) so every gallery position shows a different angle. **Must edit here, not just the DB, because `deploy.sh` re-runs `seed-db.mjs` on every deploy and would otherwise revert the DB fix.**
  - Live DB updated to match.

**2. Upload Specs made prominent (live):**
- New always-visible "Upload Specs" callout card right under the upload dropzone (maroon-bordered, 300 DPI pill, 6-cell spec grid, "View full size guide" + "Download as PDF" actions).
- New "Size Guide" modal triggered by clicking the previously-dead "A4 & A5 Dimensions" link in the Size selector. Contains: visual proportional size bars (A5/A4/Square/A3), full dimensions table, "how to prep your file" checklist, "Download as PDF" + "Open print-friendly page" actions. ESC + backdrop + X all close it.
- New print-friendly page at `/print/poster-specs` with auto-`window.print()` button — always up-to-date alternative to the PDF.
- New downloadable PDF asset at `/public/downloads/poster-specs.pdf` (42.4 KB, A4) generated by `scripts/generate-specs-pdf.mjs` (uses system `wkhtmltopdf` — no npm deps, so works under production `npm ci` which skips devDeps).
- Both the spec callout and modal are scoped to `isCustom` products only — standard posters unchanged.

**Live verification (27/08/26 06:03):**
| URL | Status |
|---|---|
| `/products/memory-poster` | 200 — 4 valid gallery thumbs, spec callout + modal present |
| `/products/best-sister-timeless` | 200 — same fix applied |
| `/print/poster-specs` | 200 |
| `/downloads/poster-specs.pdf` | 200 (42.4 KB) |
| All other pages | 200 |

---

## REQUEST #004 — Site Bug Audit & Fixes
**Date:** Today
**Requested By:** John ("If we have some errors or bugs or broken images fix those")
**Priority:** High
**Status:** ✅ COMPLETED

### Issues Found and Fixed

1. **🔴 Live site returning HTTP 500 on all major pages** (home, shop, cart, contact, search, admin, all collections).
   - **Root cause:** pm2 was running stale build chunks against a freshly-rebuilt `dist/server/` directory. A previous local `npm run build` had overwritten the chunks without restarting the process.
   - **Fix:** `pm2 restart thewall --update-env`. All 8 sampled pages now return 200.
   - **Prevention:** The `scripts/deploy.sh` script already does this correctly — always run it for production changes instead of `npm run build` alone.

2. **🟠 Build warning: `getStaticPaths() ignored` for `src/pages/policies/[slug].astro`**
   - **Fix:** Added `export const prerender = true;` so the policies pages are properly pre-rendered as static HTML at build time. Verified with a fresh build — no more warnings; 6 policy pages now generate as static HTML.

3. **🟠 3 corrupt/empty product images** in `public/images/products/` (all 74 bytes — failed uploads):
   - `GkIMPaNJv0KnlUCsrDDmD.png`
   - `x921afAoB3rbsHyRE4bkD.png`
   - `gSFAMqNb_EXGoCmu5Qg_2.png`
   - **Fix:** Deleted the files. Confirmed no products in the DB reference them. Live URLs now correctly 404. Replaced images must be re-uploaded through the admin if those product slugs need them.

4. **✅ All remaining 524 image files** in `public/images/` validated as genuine PNG/JPEG/WebP/GIF.

5. **✅ No `console.log` / `console.error` / `debugger` / `TODO` / hardcoded `localhost` URLs** in source.

### Verified Working After Fixes

| URL | Status | Notes |
|---|---|---|
| `/` | 200 | Homepage |
| `/shop` | 200 | Catalog |
| `/collections/aesthetic` | 200 | Collection page |
| `/products/best-sister-timeless` | 200 | Customizer PDP |
| `/cart` | 200 | Cart |
| `/contact` | 200 | Contact form |
| `/search` | 200 | Search |
| `/admin` | 200 | Admin (hydrates client-side) |
| `/policies/privacy` | 200 | Policy page (now pre-rendered) |
| `/policies/faq` | 200 | Policy page (now pre-rendered) |
| `/images/products/GkIMPaNJv0KnlUCsrDDmD.png` | 404 | Correctly missing |
| `/images/custom-made/framed-wall-art.jpg` | 200 | Mockup asset |
| `/hero.jpg` | 200 | Hero banner |
| `/logo.png` | 200 | Logo |

### Deployment Notes
- pm2 was restarted at the end of this audit so the live site is on the freshly-built code.
- For all future production changes, prefer `bash scripts/deploy.sh` (it builds + restarts + reloads nginx in one atomic step) over running `npm run build` alone.
