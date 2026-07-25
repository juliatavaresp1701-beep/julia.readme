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

## Availability from Google Calendar

A GitHub Action reads your calendar every 5 minutes (the fastest GitHub
allows) and writes the free 30-minute slots into `availability.json`, which the
Schedule section displays. Scheduled runs are best-effort, so under load it can
be 10 minutes rather than 5; use **Run workflow** when you need it immediately.

Slots are published as UTC instants, and the page converts them to whichever
timezone the visitor is in, detected from their browser. A picker lets them
switch to any timezone in the world, and the choice is remembered. Your own
timezone is read from the calendar feed itself (`X-WR-TIMEZONE`), so the
bookable hours below are always interpreted in the zone you see in Google.

**Only start and end times are ever read.** Event titles, descriptions,
locations and guests are never touched, so nothing private can appear on the
site. The published file lists when you are *free* — it doesn't even record
when you are busy.

Slots are 30 minutes, but one only appears if it sits inside an unbroken free
run of at least an hour. A lone half-hour gap between two lessons is therefore
never bookable, while a free hour offers both halves and 90 minutes offers
three slots.

### Setup (once)

1. **Get the private calendar link**
   Google Calendar → hover your calendar → `⋮` → **Settings and sharing** →
   scroll to **Integrate calendar** → copy **Secret address in iCal format**
   (it ends in `.ics`).

   Keep this link private — anyone who has it can read that calendar. It goes
   into GitHub Secrets below, which is encrypted and not visible in the repo.
   If it ever leaks, click **Reset** beside it in Google Calendar.

2. **Add it as a GitHub secret**
   Repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret** → name it exactly `GOOGLE_ICS_URL`, paste the link.

3. **Run it**
   **Actions** tab → *Sync availability from Google Calendar* → **Run workflow**.

Until the secret exists the Action fails and `availability.json` stays empty —
in which case the Free times block simply doesn't appear and the Preply button
is unaffected.

### Changing your bookable hours

Edit `scripts/calendar-config.json` — no other file needs touching:

- `workingHours` — the hours you're open, per weekday. Use `[]` for a day off,
  or several ranges for a split day: `[["08:00","12:00"],["16:00","20:00"]]`.
- `minNoticeHours` — hides slots that are too soon (default 12 hours).
- `daysAhead` — how far ahead to publish (default 14 days).
- `timezone` — only a fallback; the calendar's own timezone wins.
- `slotMinutes` — how long each bookable slot is (default 30).
- `minBlockMinutes` — how much unbroken free time a slot needs around it before
  it is offered (default 60). Set it equal to `slotMinutes` to offer every free
  half hour again.

Committing a change here re-runs the sync straight away.

### Linking a slot straight to Preply

By default every slot links to your Preply profile. To make a slot open its own
booking option, set `booking_slot_url` in `content.json` to Preply's URL pattern
with `{iso}` where the time goes, for example:

```json
"booking_slot_url": "https://preply.com/en/tutor/7573352?timeslot={iso}"
```

`{iso}` is replaced with the slot's UTC instant (`2026-07-28T14:00:00.000Z`) —
the same value Preply uses in its own `data-timeslot` attribute — and `{unix}`
is available if a seconds timestamp is needed instead. Leave it empty and slots
fall back to the profile link.

### Keeping it honest

Bookings still happen on Preply, and Preply doesn't write back to Google. If
you accept a lesson on Preply, block that time in Google too — otherwise this
calendar keeps advertising a slot you've already sold. The safest habit is to
treat Google as the master and let it hold everything.

## Photos and the favicon

Two images live in this repo:

- **`julia.jpg`** — the About-section photo. To change it, upload a new file
  with that exact name (GitHub → **Add file** → **Upload files**) and it swaps
  automatically; no code editing. The frame is square, so a square or portrait
  photo works best. Bigger than 320px will look sharper.
- **`flag-round-250.png`** — the browser-tab favicon, also used as the little
  round mark next to "Julia T." in the navigation bar.
