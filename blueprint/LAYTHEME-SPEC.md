# Blueprint — LayTheme Build Spec

This is a working spec for **Claude Code** to build a photography portfolio website
on **LayTheme** (laytheme.com), a standalone WordPress theme with its own visual
builder called **Gridder**. Content and structure are based on the `blueprint-*`
prototype delivered earlier in this project (13 projects / 38 photographs).

> **Correction from earlier in this conversation:** LayTheme is **not** an Elementor
> add-on. Elementor and LayTheme actively conflict with each other (confirmed on the
> official LayTheme support forum). LayTheme ships its own page builder — the
> **Gridder** — plus a handful of paid **Addons**. Elementgrid, Lightbox and Page
> Overlay are real LayTheme features, just not Elementor widgets. This doc uses the
> real mechanics, sourced from `laytheme.com/documentation/*` (links in Appendix C).

---

## 0. Design direction — "modern Lay Theme vibe"

LayTheme's own positioning: *"Your work is high-end. Your website should be too."*
and *"Lay Theme focuses on grids, typography and minimalism."* That's the brief —
dial back the rustic/Americana skin from the static HTML prototype and let the
**grid, type, and whitespace** carry it. Keep the photo story (desert road trips,
charrería, ranch mornings across the Americas) as content; restyle the chrome:

- **Palette** — near-black (`#0E0E0E`) and off-white (`#F7F5F1`), one restrained
  accent pulled from the photos (clay rust `#B5562F`) used only for hover/active
  states, never as a fill.
- **Type** — one confident grotesk or a grotesk + serif pairing, generous type
  scale, lots of line-height. Avoid decorative western lettering — let the images
  carry the "Americana" tone, not the typography.
- **Layout** — edge-to-edge Element Grid on the homepage, minimal top chrome
  (site title + a single burger/menu point), no persistent nav clutter.
- **Motion** — LayTheme's built-in Navigation Animations (AJAX page transitions)
  and Scroll Animations, used sparingly. No extra homemade JS animation — use the
  theme's native systems so it behaves consistently across the whole site.
- **Signature detail** — a running frame counter (`01 / 38`) in the corner, styled
  as plain, small, monospaced-feeling text. Quiet, not gimmicky.

---

## 1. What Claude Code can and can't automate here

Gridder is a **canvas-based visual editor** that runs in `wp-admin`. Layouts are
stored as JSON in post meta, but the schema is internal and versioned by the
plugin — it is not a documented, stable API. Be honest about this split:

**Automatable headlessly (WP-CLI / REST / filesystem):**
- WordPress install, config, plugin/theme installation
- LayTheme + Lightbox Addon activation and license entry (license key must be
  pasted manually once — it's tied to a purchase)
- Media library upload of all 38 optimized photos
- Creating the 13 Projects as posts, with taxonomies (tags/categories), featured
  images, and any custom fields LayTheme's Project post type exposes
- Menus, if LayTheme registers a standard WP nav menu location
- Global Lay Options that are plain WordPress options (confirm in `wp option list`
  once LayTheme is active — many Lay Options are stored as a single serialized
  option, editable via `wp option update` if you export/inspect the shape first)

**Not reliably automatable — needs a human in `wp-admin`, or a browser-automation
agent driving the actual Gridder UI:**
- Building the Element Grid layout, project page layouts, and the Page Overlay
- Customizer settings (fonts, colors, menu style, cursor)
- Wiring up the Lightbox Addon's per-image captions

For the second group, this doc gives an exact, settings-by-settings checklist
(straight from the LayTheme docs) so a human can execute it in under an hour, or
so Claude Code can drive it with a browser tool (Playwright/Puppeteer) if one is
available in your environment — the steps are written to be literal click paths
either way.

---

## 2. Phase 0 — Prerequisites

- [ ] Hosting with PHP 8.1+, MySQL/MariaDB, SSL, WP-CLI access (SSH)
- [ ] Domain pointed at hosting
- [ ] LayTheme license — buy at https://laytheme.com/buy-now.html
- [ ] Lightbox Addon license (€29) — https://laytheme.com/addons/lightbox.html
      (required — this is what gives you the click-to-zoom image viewer; without
      it, images just link out or do nothing)
- [ ] Download both zip files from your LayTheme account after purchase

---

## 3. Phase 1 — Environment setup (WP-CLI)

```bash
# from your project root on the server
wp core download --locale=en_US
wp config create --dbname=blueprint --dbuser=DB_USER --dbpass=DB_PASS --dbhost=localhost
wp core install \
  --url="https://yourdomain.com" \
  --title="Blueprint" \
  --admin_user=admin \
  --admin_password="CHANGE_ME" \
  --admin_email="you@yourdomain.com"

# remove default cruft
wp plugin deactivate hello akismet
wp theme delete twentytwentyfour twentytwentythree twentytwentytwo
```

Upload the LayTheme theme zip and the Lightbox Addon plugin zip (via SFTP, or
`wp theme install /path/to/laytheme.zip --activate` and
`wp plugin install /path/to/lightbox-addon.zip --activate` if the zips are on
the server already).

```bash
wp theme install /local/path/laytheme.zip --activate
wp plugin install /local/path/lay-lightbox-addon.zip --activate
```

Then in `wp-admin` → **Lay Options** → license section, paste the LayTheme
license key once (this step is not scriptable — it round-trips through
laykeymanager.com).

---

## 4. Phase 2 — Media

Use the already-optimized images shipped in `blueprint-site.zip` from the
prototype (`images/full/*.jpg`, longest edge 1800px, quality 82 — good balance
for a photography site; LayTheme regenerates its own responsive sizes on top of
whatever you upload, so don't upload the original 90MB camera files).

```bash
cd images/full
for f in *.jpg; do
  wp media import "$f" --title="${f%.jpg}"
done
```

In **Lay Options → Images**, set **Image Quality (.jpg)** to something in the
80–85 range and regenerate thumbnails after any bulk import:

```bash
wp media regenerate --yes
```

---

## 5. Phase 3 — Content structure (Projects)

LayTheme's portfolio unit is a **Project** (its own post type, used by Project
Thumbnail, Thumbnail Grid, Project Index, and Project Overlays). Confirm the
exact post type slug in your install — it's commonly `project` — with:

```bash
wp post-type list --format=table
```

Create the 13 projects. Example for one (repeat per row in the table below):

```bash
wp post create \
  --post_type=project \
  --post_title="Bandits" \
  --post_status=publish \
  --post_excerpt="Salta, Argentina"
```

Then, per project: open it in `wp-admin`, and inside its Gridder canvas add the
project's images in sequence (this part is manual/Gridder — see Phase 4.2).
Assign a featured image (the project's first frame) so it has something to show
in the homepage Element Grid before the full layout is built:

```bash
wp post meta update <post_id> _thumbnail_id <attachment_id>
```

### Project list (from the prototype, reuse as-is or edit)

| # | Slug | Title | Subtitle / credit | Frames |
|---|------|-------|--------------------|--------|
| 01 | bandits | Bandits | Salta, Argentina | 8 |
| 02 | charros | Charros | Jalisco, Mexico | 8 |
| 03 | back-forty | Back Forty | Private Ranch | 6 |
| 04 | off-grid | Off Grid | Lewis Ferris | 2 |
| 05 | deep-end | Deep End | Studio | 1 |
| 06 | dive-bar | Dive Bar | Agustin Farias | 1 |
| 07 | static | Static | Ivan Resnik | 2 |
| 08 | hang-in-there | Hang In There | Cecilia Di Paolo | 1 |
| 09 | soft-landing | Soft Landing | Chris Abatzis | 4 |
| 10 | tones | Tones | Chris Abatzis | 1 |
| 11 | another-planet | Another Planet | Field Study | 1 |
| 12 | silhouette | Silhouette | Grant Spanier | 1 |
| 13 | kin | Kin | Nick Fancher | 2 |

Full per-image manifest (`manifest.json`, filenames matching `images/full/`) is
included alongside this doc — use it to know which files belong to which
project and in what order.

---

## 6. Phase 4 — Gridder build checklist (manual, in `wp-admin`)

### 4.1 Homepage — Element Grid

1. Edit the front page → open the Gridder.
2. Toolbar → **+More** → **Element Grid**.
3. In the Add Element Grid window, add one **Project Thumbnail** item per
   project (13 total), in the order from the table above.
4. Layout type: **Masonry** (matches the varied portrait/landscape mix in this
   set better than a strict uniform grid).
5. Columns: **4** desktop. Gutter: **2px** (edge-to-edge, minimal look — this is
   the "modern grid" read, not wide gutters).
6. Custom aspect ratio: **off** — let natural crops vary, that's part of the
   masonry rhythm.
7. Click **Ok** to drop the Element Grid onto the canvas, then resize it to
   **Full Width Element** (drag handles to the layout edges).
8. Select the Element Grid → **Customize → Project Thumbnails**:
   - Title: on, mouseover only
   - Description/subtitle: on, "on image" position, small caps or mono-feeling
     style, bottom-left
   - Gradient overlay: subtle, bottom third only, just enough for text legibility
9. Above the grid, add a short **+Text** intro block (one or two lines, e.g. a
   kicker + one-sentence framing of the body of work) — keep it short, this is a
   grid-led homepage, not a hero-copy homepage.

### 4.2 Project pages

Each Project needs its own Gridder layout (LayTheme applies one layout you build
once per project, or you can build a **Page Template** and reuse it — see
**Documentation → Page Templates** — since all 13 projects share the same
structure):

1. Row 1: hero image, **Fixed Row**, height `100svh` (fills viewport), Image
   Size = **Fixed Height** with Object Fit **Cover**.
2. Below: remaining frames from that project, one per row, **Natural** size,
   centered, generous vertical space between rows (this *is* the lightbox
   sequence read on mobile/scroll — the Lightbox Addon adds the click-to-zoom
   layer on top of this scroll sequence on desktop).
3. Right-click each image → confirm **Lightbox Addon** is active for it (it's
   on by default once the addon is active for Projects — see 5.1). Optionally
   set an **Edit Lightbox Caption** per image (title + location, kept short).
4. Bottom of the project: **Navigation between Projects** → add a **Next
   Project Link** (Documentation → Navigation between Projects) so visitors can
   move through all 13 without returning to the grid every time.
5. Save as a **Page Template** (Documentation → Page Templates) after building
   the first project, then apply that template to the other 12 and swap in
   their images — much faster than rebuilding from scratch 13 times.

### 4.3 Page Overlay — Index / About (replaces the custom overlay in the
static prototype)

1. **Lay Options → Extra Features** → enable **Page Overlays (Desktop Burger
   Menu Feature)**.
2. Create a new Page titled "Menu" (or "Index").
3. In its Gridder, build two columns:
   - Left: a **Project Index** element (Documentation → Gridder Elements →
     Project Index) — sortable text list of all 13 projects, columns = Title,
     Category/Tag, Year. This is the direct equivalent of the numbered index
     list in the static prototype.
   - Right: an **+Text** About paragraph, contact email/social as a **Social
     Media Icons** element, and a **Marquee** (Documentation → Gridder Elements
     → Marquee) running the "Selected Press" list left-to-right — a nicer,
     more "modern portfolio" treatment than a static press list.
4. In the page sidebar → **Overlay** box → tick **Use as Overlay** → **Configure
   Page Overlay**:
   - Animation: **Fade in** (matches the restrained motion direction)
   - Backdrop: on, high opacity, near-black
   - Close icon: simple **×**, no background chip
5. Point the site's global burger/menu icon at this page (Documentation →
   Overlays → "the global burger icon, add the page to a normal menu, or link
   to it from text and buttons").

### 4.4 Also enable — Project Overlays (optional, but very "modern" feeling)

**Lay Options → Extra Features** → enable **Projects Overlays Feature**. This
makes project links open *in place* over the homepage grid instead of doing a
full page navigation — closer to the single-page feel of the static prototype.
Configure animation = **Slide up**, background = near-black, in **Lay Options →
Projects Overlays**.

### 4.5 Customizer

- **Menu Style**: `normal` (plain text points, not pill/button) — Documentation
  → Menus → Menu Styles.
- **Site Title**: small, top-left, always visible.
- **Project Thumbnails**: configured in 4.1.
- **Background**: off-white `#F7F5F1` (or near-black `#0E0E0E` if you want the
  darker version closer to the original static prototype — both are legitimate,
  pick one and hold it everywhere).
- **Cursor**: default is fine; a custom dot cursor is a nice but optional touch
  for the grid page only.
- **CSS**: leave empty until the above is in place — use Customizer settings
  before reaching for Custom CSS (Documentation → Custom CSS Styling explicitly
  recommends this order).

---

## 7. Phase 5 — Addon configuration

**Lay Options → Lightbox Addon**:
- Activation: **Projects** on, Pages/News/Categories off (keep it scoped to
  photo sequences, not the whole site)
- Captions: short caption = project title + location, small type, low opacity
- Appearance: minimal style, near-black background, high opacity (matches the
  reference site's fullscreen black lightbox, not a white gallery-lightbox look)
- Phone: keep Lightbox **disabled** on phone (the addon's default) — the
  scroll-through project page already works as the "lightbox" on mobile

---

## 8. Phase 6 — QA checklist

- [ ] Homepage Element Grid loads all 13 projects, masonry rhythm reads
      intentional, not accidental
- [ ] Hover on a grid tile reveals title + location, not before
- [ ] Clicking a tile enters that project (as an overlay if 4.4 is enabled, or
      as a full navigation otherwise) with the AJAX page transition
- [ ] Every image in a project sequence opens in the Lightbox Addon, arrow/swipe
      navigation moves through the whole project
- [ ] Next Project Link at the bottom of each project actually chains through
      all 13 in order
- [ ] Burger/menu opens the Page Overlay with the Project Index + About + press
      marquee, closes cleanly, doesn't break scroll position on the page behind it
- [ ] Phone layout: Element Grid collapses to 1–2 columns, Lightbox is off,
      project pages still scroll cleanly through all frames
- [ ] Lighthouse/PageSpeed pass — check image sizes actually match display size
      (Lay Options → Images → regenerate thumbnails if anything looks soft)

---

## Appendix A — Reused prototype assets

The `manifest.json` and `images/full/` folder from the earlier `blueprint-site.zip`
deliverable are the source of truth for filenames, project grouping, and image
order — reuse them directly rather than re-curating from the original zip.

## Appendix B — Copy blocks (placeholders — replace with real copy)

**About:**
> A documentary practice following the roads, ranches and rodeo circuits of the
> Americas — from the red canyons of Salta to the charrería arenas of Jalisco.
> Interested in the unposed hour: the walk back to the truck, the boots by the
> door, the light that shows up whether or not anyone is watching.

**Contact:** `studio@blueprint-example.com` — replace with a real address before
launch, along with the placeholder press names.

## Appendix C — Reference documentation (fetched for this spec)

- Overview / Gridder: https://laytheme.com/documentation.html
- Gridder Elements (incl. Element Grid, Project Index, Marquee):
  https://laytheme.com/documentation/gridder-elements.html
- Overlays (Page Overlays + Project Overlays):
  https://laytheme.com/documentation/overlays.html
- Lightbox Addon: https://laytheme.com/documentation/lightbox-addon.html /
  product page https://laytheme.com/addons/lightbox.html
- Page Templates: https://laytheme.com/documentation/page-templates.html
- Navigation between Projects:
  https://laytheme.com/documentation/navigation-between-projects.html
- Menus: https://laytheme.com/documentation/menus.html
- Custom CSS Styling: https://laytheme.com/documentation/custom-css-styling.html
- Elementor incompatibility (confirmed by LayTheme support):
  https://laythemeforum.com/topic/5966/does-lay-theme-work-with-wordpress-elementor
