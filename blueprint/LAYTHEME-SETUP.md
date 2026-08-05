# Setting up LayTheme — click by click

For moving the Blueprint portfolio onto a LayTheme WordPress site.

**Read this first:** there is no import. The static site in this folder cannot
be uploaded into LayTheme — the Gridder stores layouts as its own internal
data, and nothing reads HTML back in. What you actually do is upload the same
38 photos, create the same 13 projects, and dial in the same settings. The
static site is your reference for what it should end up looking like:

https://juliatavaresp1701-beep.github.io/julia.readme/blueprint/

Keep it open in a second tab while you build. Every value below is taken from
it, so you are copying decisions, not making them.

---

## Step 0 — Know which site you are on

If your admin URL looks like `something.laytheme.com/wp-admin/`, you are on a
**LayTheme trial sandbox**. Two things follow from that:

- There is no SSH, so `wp/import-projects.sh` will **not** run. Use the manual
  route below. (That script is for a real host with WP-CLI.)
- Trial sandboxes are temporary. Treat the work there as a rehearsal, not the
  final site. When you move to real hosting you will rebuild — much faster the
  second time, and you can export/import content with WordPress's own
  Tools → Export / Import.

If your admin URL is your own domain, you are on the real thing and can use
either route.

> **Admin in Portuguese?** WordPress's own menus translate (Media = *Mídia*,
> Pages = *Páginas*, Appearance = *Aparência*, Settings = *Configurações*),
> but LayTheme's own panels usually stay in English. If Chrome is
> auto-translating, consider turning that off for this site — translated
> button labels make the theme's documentation hard to follow.

---

## Step 1 — Install and activate the theme

1. **Appearance → Themes → Add New → Upload Theme** *(Aparência → Temas →
   Adicionar novo → Enviar tema)*
2. Choose the LayTheme `.zip` you downloaded from your account. Upload it
   **as the zip** — do not unzip it first.
3. **Install**, then **Activate**.

On a trial sandbox LayTheme is usually already installed and active. Check
Appearance → Themes; if Lay Theme is the active theme, skip to step 3.

## Step 2 — Enter the license key

Go to **Lay Options → License** and paste the key from your LayTheme account.
This step round-trips through their key server and cannot be scripted. Without
it you may not get theme updates.

## Step 3 — The Lightbox Addon (separate purchase)

The click-to-zoom viewer is **not** part of the theme — it is a €29 addon
(https://laytheme.com/addons/lightbox.html). If you bought it:

**Plugins → Add New → Upload Plugin** *(Plugins → Adicionar novo → Enviar
plugin)* → the addon zip → Install → Activate.

If you did not buy it, everything else still works; project pages just scroll
through their photos without the fullscreen viewer. Decide before step 9.

---

## Step 4 — Upload the 38 photos

You need the images on your computer: they are in `images-full/` inside the
package zip, or in `blueprint/images/full/` in this repository.

1. **Media → Add New** *(Mídia → Adicionar novo)*
2. Drag in all 38 `.jpg` files at once and let it finish.
3. **Lay Options → Images** → set **Image Quality (.jpg)** to **82**.

Do not upload the original camera files — these are already sized for web
(longest edge ≤1800px), and LayTheme generates its own responsive versions on
top of whatever you give it.

## Step 5 — Create the 13 Projects

LayTheme's portfolio unit is a **Project** (its own post type in the sidebar).
For each row below: **Projects → Add New**, set the title, put the subtitle in
the **Excerpt** field, set the **Featured Image** to that project's **first**
frame, then **Publish**.

| # | Title | Subtitle / credit | Featured image | Frames |
|---|---|---|---|---|
| 01 | Bandits | Salta, Argentina | `bandits-1.jpg` | 8 |
| 02 | Charros | Jalisco, Mexico | `charros-1.jpg` | 8 |
| 03 | Back Forty | Private Ranch | `back-forty-1.jpg` | 6 |
| 04 | Off Grid | Lewis Ferris | `off-grid-1.jpg` | 2 |
| 05 | Deep End | Studio | `deep-end-1.jpg` | 1 |
| 06 | Dive Bar | Agustin Farias | `dive-bar-1.jpg` | 1 |
| 07 | Static | Ivan Resnik | `static-1.jpg` | 2 |
| 08 | Hang In There | Cecilia Di Paolo | `hang-in-there-1.jpg` | 1 |
| 09 | Soft Landing | Chris Abatzis | `soft-landing-1.jpg` | 4 |
| 10 | Tones | Chris Abatzis | `tones-1.jpg` | 1 |
| 11 | Another Planet | Field Study | `another-planet-1.jpg` | 1 |
| 12 | Silhouette | Grant Spanier | `silhouette-1.jpg` | 1 |
| 13 | Kin | Nick Fancher | `kin-1.jpg` | 2 |

Publish all 13 before building any layout — the homepage grid needs them to
exist before it can list them.

Which photo belongs to which project, and in what order, is in
`manifest.json`. Filenames are already numbered in sequence
(`bandits-1` … `bandits-8`), so ordering is just counting.

## Step 6 — Global look (Customizer)

**Appearance → Customize.** Set these and nothing else for now:

| Setting | Value |
|---|---|
| Background | `#F7F5F1` (off-white) |
| Text colour | `#0E0E0E` (near-black) |
| Link / hover colour | `#B5562F` (clay rust) — hover and active states only |
| Menu Style | `normal` (plain text, not buttons) |
| Site Title | small, top-left, always visible |
| Custom CSS | leave empty for now |

Pick one confident grotesk for headings and body — avoid decorative western
lettering, the photographs carry that tone already. Leave Custom CSS alone
until everything else is in place; LayTheme's own documentation asks you to
exhaust the settings first, and it is good advice.

## Step 7 — Homepage grid

1. **Pages → Add New**, title it `Home`, publish.
2. **Settings → Reading** *(Configurações → Leitura)* → "Your homepage
   displays" → **A static page** → select `Home`.
3. Edit `Home` → open the **Gridder**.
4. Toolbar → **+More → Element Grid**.
5. Add one **Project Thumbnail** per project — all 13, in the table's order.
6. Settings for the grid:
   - Layout type: **Masonry**
   - Columns: **4**
   - Gutter: **2px**
   - Custom aspect ratio: **off**
7. **Ok**, then drag the grid's handles out to **Full Width Element**.
8. Select the grid → **Customize → Project Thumbnails**:
   - Title: **on, mouseover only**
   - Description/subtitle: **on**, position **on image**, bottom-left
   - Gradient overlay: subtle, bottom third only
9. Above the grid add a **+Text** block with two lines — a small kicker and one
   sentence. Keep it short; the grid leads this page, not the copy.

## Step 8 — Project pages (build one, reuse it 12 times)

Open project 01 → Gridder:

1. **Row 1** — the hero: first image, **Fixed Row**, height `100svh`,
   Image Size = **Fixed Height**, Object Fit = **Cover**.
2. **Below** — the remaining frames, one per row, **Natural** size, centered,
   with generous vertical space between them.
3. **Bottom** — add a **Next Project Link** so visitors move straight to the
   next project instead of going back to the grid.
4. Save it as a **Page Template**.
5. For projects 02–13: apply that template, then swap in their images.

Step 4 is the one that matters. Building thirteen layouts by hand takes an
afternoon; applying a template and swapping images takes a few minutes each.
Projects 05, 06, 08, 10, 11 and 12 have a single frame — for those, the hero
row *is* the whole project.

## Step 9 — Lightbox settings

**Lay Options → Lightbox Addon** (only if you installed it in step 3):

- Activation: **Projects on**, Pages / News / Categories **off**
- Appearance: minimal, **near-black background, high opacity**
- Caption: project title + location, small, low opacity
- Phone: **disabled** (its default — the scrolling project page already does
  this job on a phone)

## Step 10 — The Index / About overlay

1. **Lay Options → Extra Features** → enable **Page Overlays (Desktop Burger
   Menu Feature)**.
2. **Pages → Add New**, title it `Index`.
3. In its Gridder, two columns:
   - **Left:** a **Project Index** element — the text list of all 13, columns
     Title / Location / Frames.
   - **Right:** a **+Text** about paragraph, a **Social Media Icons** element,
     and a **Marquee** running the press names.
4. In the page sidebar → **Overlay** box → tick **Use as Overlay** →
   **Configure Page Overlay**: animation **Fade in**, backdrop **on, near-black,
   high opacity**, close icon a plain **×**.
5. Point the site's burger/menu icon at this page.

The about copy and press names are in `build.mjs` at the top, and on the live
static site under the Index button.

## Step 11 — Optional extras

- **Project Overlays** (Lay Options → Extra Features) makes projects open over
  the homepage grid instead of navigating away. Animation **Slide up**,
  background near-black.
- **The frame counter** (`02 / 08`) is the one thing LayTheme has no setting
  for. `wp/frame-counter.css` goes in Lay Options → Custom CSS;
  `wp/frame-counter.js` needs a code-snippets plugin or a child theme. Read the
  comment at the top of the JS — you have to point it at the right element.
  Leave this until last; it is a detail, not a feature.

---

## Step 12 — Check it before calling it done

- [ ] Homepage grid shows all 13, masonry rhythm looks intentional
- [ ] Hovering a tile reveals title + location — and not before
- [ ] Clicking a tile opens that project, with the page transition
- [ ] Every photo opens in the lightbox; arrows move through the whole project
- [ ] Next Project Link chains through all 13 and comes back around
- [ ] Burger opens the Index overlay; closing it keeps your scroll position
- [ ] On a phone: grid drops to 1–2 columns, lightbox off, projects scroll clean
- [ ] Replace `studio@blueprint-example.com`, the two social links, and the
      press names — those are placeholders, and the press titles are invented

## If a label does not match

LayTheme renames things between versions, and this guide was written from the
build spec rather than from your exact install. If a panel is not where it says,
check **Lay Options** first, then the theme's own documentation at
https://laytheme.com/documentation.html — the section names there match the
step titles above.

## The faster route, if you get real hosting

With SSH and WP-CLI, steps 4 and 5 collapse into one command:

```bash
POST_TYPE=project ./wp/import-projects.sh /path/to/blueprint/images/full
```

That imports all 38 photos and creates all 13 projects with their featured
images set. Steps 6–11 still have to be done by hand — that part is Gridder
work, and there is no way around it.
