# Julia T. — website

A static one-page site (GitHub Pages). The content comes from a Notion database,
so Julia can edit the text without touching any code.

**Live:** https://rubenkraan-droid.github.io/julia-portuguese/

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

## Adding an ebook PDF

The ebook download link is the `ebook1_url` field in Notion. Notion's own file
attachments use temporary links that expire, so host the PDF elsewhere:

1. Upload the PDF to **Google Drive** or **Dropbox**.
2. Set sharing to *"anyone with the link"* and copy the share link.
3. Paste it into the `ebook1_url` field (Value column) in Notion.

Leave it blank or `#` and the button shows "PDF coming soon" instead.

## Adding a photo

Upload a `julia.jpg` to this repo and replace the
`<div class="about-photo">…</div>` block in `index.html` with
`<img src="julia.jpg" alt="Photo of Julia T.">`.
