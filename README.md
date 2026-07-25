# Julia T. — website

A static one-page site (GitHub Pages). The content comes from a Notion database,
so Julia can edit the text without touching any code.

**Live:** https://juliatavaresp1701-beep.github.io/julia.readme/

> First time only: GitHub → **Settings** → **Pages** → *Source* =
> **Deploy from a branch**, *Branch* = `main` / `(root)` → **Save**.
> The site is live a minute or two later.

## How it works

```
Notion (database "Julia T. — Website content")
   │   A GitHub Action reads Notion every 30 minutes (or on "Run workflow")
   ▼
content.json  ──►  index.html loads this on every page view
```

- `index.html` — the site. Every editable piece has a `data-cms="..."` label.
- `content.json` — the current text (updated automatically; don't edit by hand).
- `scripts/sync-notion.js` — reads the Notion database and writes `content.json`.
- `.github/workflows/sync-notion.yml` — runs the script on a schedule + on a button.

> **Not set up in this repo yet.** The two sync files above are missing here, so
> `content.json` currently only changes when it is edited by hand. The site
> itself works fine either way. Everything below about Notion applies once the
> sync is added.

## One-time setup (required for the sync to work)

The GitHub Action needs its own Notion key — set this up once.

1. **Create a Notion integration**
   Go to https://www.notion.so/my-integrations → **New integration** →
   choose "Internal", give it a name (e.g. `website-sync`) → **Save** →
   copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`).

2. **Give the integration access to the database**
   Open the **"Julia T. — Website content"** database in Notion →
   `•••` button (top right) → **Connections** → select your integration.

3. **Add the key as a GitHub secret**
   GitHub repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret** → name `NOTION_TOKEN`, value = the secret from step 1.

4. **Test**
   GitHub → **Actions** tab → *Sync content from Notion* → **Run workflow**.
   After ~1 min `content.json` is updated and the change is live.

The database id is already set in the workflow, so you don't need to configure it.

## For Julia — editing content

1. Open the **"Julia T. — Website content"** Notion database.
2. Edit only the **Value** column. Leave **Key** untouched.
3. Done — within ~30 min it's on the site (or sooner via *Run workflow* on GitHub).

## Refreshing the site now (instead of waiting)

GitHub → **Actions** tab → *Sync content from Notion* → **Run workflow**.
After ~1 min, reload the website (hard refresh: **Cmd/Ctrl + Shift + R**).

## Adding your Preply reviews

The reviews section is built from `content.json`, not from the HTML — so you can
add 4 reviews or 40 and the page just grows. Paste them into the `reviews` list:

```json
"reviews": [
  {
    "quote": "Paste the review exactly as the student wrote it.",
    "name": "Marco",
    "country": "Italy",
    "rating": 5,
    "date": "March 2026"
  },
  { "quote": "...", "name": "...", "country": "...", "rating": 5 }
]
```

Only `quote` is required. `rating` defaults to 5 stars. `country` and `date` are
shown under the name if present, skipped if not.

While the list is empty, the section shows a "Read all reviews on Preply" link
instead — so the page never displays review text that isn't really yours.

If you'd rather edit reviews in Notion (which stores flat rows, not lists), use
`review1_quote`, `review1_name`, `review1_country`, `review1_rating`,
`review2_quote`, … and the site reads them in order until they run out.

## Adding an ebook PDF

The ebook download link is the `ebook1_url` field in Notion. Notion's own file
attachments use temporary links that expire, so host the PDF elsewhere:

1. Upload the PDF to **Google Drive** or **Dropbox**.
2. Set sharing to *"anyone with the link"* and copy the share link.
3. Paste it into the `ebook1_url` field (Value column) in Notion.

Leave it blank or `#` and the button shows "PDF coming soon" instead.

## Adding a photo

The About section tries three things in order and uses the first that loads:

1. **`julia.jpg` in this repo** — preferred, and the only one fully under your
   control.
2. The **Preply avatar** — a stand-in so the section isn't empty.
3. A plain pink placeholder, if neither loads.

So to use your own photo, just upload it — no code editing:

GitHub → **Add file** → **Upload files** → drop in your photo named exactly
`julia.jpg` → **Commit changes**. It appears within a minute or two.

The frame is portrait (4:5) and the photo is cropped to fill it, so a portrait
or square photo works best. A wide landscape photo will be cropped at the sides.
