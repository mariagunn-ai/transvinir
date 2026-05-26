# Backlog

Running list of things to consider for `transvinir-vefur`. Add, remove, reorder freely — this is a thinking aid, not a commitment. Items higher up roughly reflect what's been raised so far; everything else is suggestions to react to.

## Look & feel

### 1. Three toggleable themes (decision-making tool)
Build three distinct visual treatments (color palette, typography, spacing, hero treatment) selectable from the admin dashboard and applied site-wide. **This is scaffolding, not a long-term feature** — the goal is to show stakeholders real options against real content, pick one, and then "fix" the site to that look. Implication for engineering: keep the theme switch simple and self-contained so the losing themes and the toggle itself can be cleanly removed once a decision is made. Don't over-invest in a theming framework.

## Admin tooling

### 2. Editable site settings from the admin UI
The `settings` table already holds `contact_email`, `redbubble_url`, `campaign_text`, and `hero_text`, but they can only be changed by re-running `init-db` or editing SQLite directly. A simple "Site settings" page in the admin would close this gap and reduce future "can you change X" requests to the developer.

### 3. Manage uploaded images
`public/uploads/` accumulates forever and there's no way for an admin to see what's there, reuse an image across posts, or delete unused files. Even a basic gallery view with delete would help, especially before the folder gets unwieldy.

### 4. Image alt text + cover-image captions
The `news.cover_image` column stores a URL but no alt text. For an organisation whose work is about inclusion, accessible images matter; this is a small schema/UI addition with outsized value.

### 5. Admin upload for Fléttimyndir
Admin needs to be able to upload images for **Fléttimyndir**. Open questions before building: where do these appear on the site (own page, embedded in an existing page, homepage feature?), is it a single gallery or grouped sets, do they need captions / credits / alt text, and is ordering manual or by upload date? Worth a quick conversation before picking a schema — could be as light as a new `flettimyndir` table with `(id, image, caption, sort_order)`, or could fold into a more general "media library" if #3 lands first.

## Content & UX

### 6. Pagination (or "load more") on /nylegt
The news listing currently returns every published item in one query. Fine today, painful at 50+ articles.

### 7. Contact form on /hafa-samband
Listed in the README's "later" section. Today the page is just a `mailto:` link; a proper form (with spam protection) lowers the bar for people reaching out — likely the single most important call-to-action on the site.

### 8. SEO + social sharing meta
No OpenGraph, Twitter card, sitemap, or per-page description meta tags. When someone shares a news article on Facebook or Bluesky it'll look bare. Also in the README's "later" list.

## Webshop / vefverslun

### 14. Vefverslun með rotation á forsíðuflís
Build out the shop experience. Today the second home tile (`tile--circle` in `views/home.ejs`) is a single circular CTA pointing at `settings.redbubble_url` with one slogan ("Þú átt skjól hjá mér"). Plan is to surface a real product set there and **rotate the featured product on that tile** — either per page-load or on a schedule — so the homepage shows different items over time. Open questions: full self-hosted shop or stay on Redbubble (and just curate / rotate which products we highlight)? Does the rotation drive a single product per tile load, or a small carousel within the tile? Where do orders / fulfilment live?

- **TODO: download product images** from the current sales channel (Redbubble) so we have a local set to point the rotation at, instead of hot-linking. Need to decide whether to commit them to git or treat them like admin uploads.

## Security & ops

### 9. Persistent session store
Sessions live in `memorystore` (in-memory), so every restart logs the admin out. Swap to a SQLite-backed session store (the README's directory listing even reserves `data/sessions.sqlite`). Small change, real quality-of-life win.

### 10. CSRF protection on admin forms
The admin POST routes (`/admin/news`, `/admin/pages/:slug`, `/admin/password`, …) accept any form submission with a valid session cookie. A logged-in admin browsing a malicious page could be tricked into making changes. Add `csurf` or equivalent.

### 11. Login rate limiting
Nothing throttles `POST /admin/login`. With a single admin user and a guessable password, this is the most obvious attack surface. `express-rate-limit` on that route is a few lines.

### 12. Backup strategy for the SQLite database
All content lives in one file (`data/transvinir.sqlite`). No automated backup means a single bad deploy or disk issue erases the site's history. Even a nightly copy to S3/Backblaze/Dropbox would do.

## Code health

### 13. Migration system
`db.js` currently runs `addColumn()` calls in module load to evolve the schema. It works now but won't scale to renames, data backfills, or multi-step changes. Consider a tiny migration runner (timestamped files in `migrations/`) before the next schema change.

---

Suggested but **not** in scope until someone advocates for them: multi-admin / roles, revision history per page, draft previews, scheduled publishing, comment system, newsletter signup, search.
