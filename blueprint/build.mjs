/**
 * Blueprint — static site generator.
 *
 * Reads manifest.json (the source of truth for filenames, project grouping and
 * image order) and writes index.html plus one page per project. Run after any
 * edit to the manifest or to the copy blocks below:
 *
 *   node blueprint/build.mjs
 */

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const SITE = {
  title: "Bandits",
  kicker: "Selected work — 2019–2026",
  lede:
    "A documentary practice following the roads, ranches and rodeo circuits of the Americas.",
  email: "studio@blueprint-example.com",
  about: [
    "A documentary practice following the roads, ranches and rodeo circuits of the Americas — from the red canyons of Salta to the charrería arenas of Jalisco.",
    "Interested in the unposed hour: the walk back to the truck, the boots by the door, the light that shows up whether or not anyone is watching.",
  ],
  // Placeholder press names — replace with real credits before launch.
  press: [
    "Frontier Quarterly",
    "Roadside Review",
    "Field Notes Annual",
    "The Long Way",
    "Dust & Diesel",
    "Cargo Journal",
  ],
  social: [
    { label: "Instagram", href: "#" },
    { label: "Are.na", href: "#" },
  ],
};

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pad = (n) => String(n).padStart(2, "0");

const manifest = JSON.parse(
  await readFile(join(root, "manifest.json"), "utf8")
);

const totalFrames = manifest.reduce((sum, p) => sum + p.images.length, 0);

/* ------------------------------------------------------------- fragments */

/* Four-square grid mark, inline so it costs no request. */
const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>" +
      "<rect width='32' height='32' fill='#0e0e0e'/>" +
      "<rect x='7' y='7' width='7' height='7' fill='#f7f5f1'/>" +
      "<rect x='18' y='7' width='7' height='7' fill='#f7f5f1'/>" +
      "<rect x='7' y='18' width='7' height='7' fill='#f7f5f1'/>" +
      "<rect x='18' y='18' width='7' height='7' fill='#b5562f'/></svg>"
  );

const head = (title, description, base) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light">
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="${base}assets/site.css">`;

/* Three zones: a readout that names whatever you're hovering, the site name
   centred, and the index toggle. The readout is why the tiles carry no
   captions of their own. */
const chrome = (base) => `<header class="chrome">
  <span class="chrome__now" data-now aria-live="polite"></span>
  <a class="chrome__title" href="${base}index.html">${esc(SITE.title)}</a>
  <button class="chrome__menu" type="button" data-overlay-open aria-controls="overlay">Index <span class="chrome__sign" data-menu-sign>(+)</span></button>
</header>`;

/* Page Overlay — project index, about, contact, press marquee. */
const overlay = (base) => {
  const rows = manifest
    .map((project, i) => {
      const n = pad(i + 1);
      return `      <a class="index__row" href="${base}projects/${project.slug}.html" data-row
        data-num="${i + 1}" data-title="${esc(project.title)}"
        data-meta="${esc(project.subtitle)}" data-frames="${project.images.length}">
        <span class="index__num label">${n}</span>
        <span class="index__name">${esc(project.title)}</span>
        <span class="index__meta label">${esc(project.subtitle)}</span>
        <span class="index__frames label">${pad(project.images.length)}</span>
      </a>`;
    })
    .join("\n");

  const marquee = SITE.press
    .map((name) => `<span>${esc(name)}</span>`)
    .join("");

  const social = SITE.social
    .map((item) => `<a class="label" href="${esc(item.href)}">${esc(item.label)}</a>`)
    .join("\n        ");

  return `<div class="overlay" id="overlay" data-overlay aria-hidden="true" aria-label="Index">
  <button class="overlay__close" type="button" data-overlay-close aria-label="Close index">&times;</button>

  <nav class="index" aria-label="All projects">
    <div class="index__head label">
      <button class="index__sort" type="button" data-sort="num" aria-sort="ascending">No.</button>
      <button class="index__sort" type="button" data-sort="title" aria-sort="none">Project</button>
      <button class="index__sort" type="button" data-sort="meta" aria-sort="none">Location / credit</button>
      <button class="index__sort" type="button" data-sort="frames" aria-sort="none">Frames</button>
    </div>
    <div data-index-body>
${rows}
    </div>
  </nav>

  <div class="about">
    ${SITE.about.map((line) => `<p>${esc(line)}</p>`).join("\n    ")}

    <h2 class="label">Contact</h2>
    <p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>

    <h2 class="label">Elsewhere</h2>
    <div class="social">
        ${social}
    </div>

    <h2 class="label">Selected press</h2>
    <div class="marquee">
      <div class="marquee__track">${marquee}${marquee}</div>
    </div>
  </div>
</div>`;
};

const lightbox = `<div class="lightbox" data-lightbox aria-hidden="true" aria-label="Image viewer">
  <button class="lightbox__close" type="button" data-lightbox-close aria-label="Close">&times;</button>
  <button class="lightbox__nav lightbox__prev" type="button" data-lightbox-prev aria-label="Previous frame">&larr;</button>
  <img data-lightbox-image alt="">
  <button class="lightbox__nav lightbox__next" type="button" data-lightbox-next aria-label="Next frame">&rarr;</button>
  <span class="lightbox__cap label" data-lightbox-caption></span>
  <span class="lightbox__count label" data-lightbox-count></span>
</div>`;

const page = (body, base) => `<!doctype html>
<html lang="en">
<head>
${head(body.title, body.description, base)}
</head>
<body>
${chrome(base)}
${body.main}
${overlay(base)}
${body.lightbox ? lightbox : ""}
${body.data ? `<script>window.BLUEPRINT = ${body.data};</script>` : ""}
<script src="${base}assets/site.js" defer></script>
</body>
</html>
`;

/* ------------------------------------------------------------- homepage */

/* An archive wall: every frame, not one cover per project. At eight narrow
   columns, thirteen tiles would read as an empty page — the density is the
   point. Each frame links to the project it belongs to.

   Order is not manifest order. Strict project order clusters orientations —
   Back Forty is all landscapes, so it would lay down a band of short frames
   across a whole row. Instead tall and wide are interleaved, never more than
   two of a kind consecutively, which keeps the vertical rhythm irregular.
   The PRNG is seeded, so the arrangement is identical on every build. */
const wallOrder = (() => {
  const frames = manifest.flatMap((project) =>
    project.images.map((image) => ({ project, image }))
  );
  const tall = frames.filter((f) => f.image.h >= f.image.w);
  const wide = frames.filter((f) => f.image.h < f.image.w);

  let seed = 1;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const out = [];
  let run = 0;
  let last = null;

  while (tall.length || wide.length) {
    let pick;
    if (!(tall.length && wide.length)) pick = tall.length ? "T" : "W";
    else if (run >= 2) pick = last === "T" ? "W" : "T";
    else pick = random() < tall.length / (tall.length + wide.length) ? "T" : "W";

    run = pick === last ? run + 1 : 1;
    last = pick;
    out.push((pick === "T" ? tall : wide).shift());
  }
  return out;
})();

const tiles = wallOrder
  .map(
    ({ project, image }, i) => `  <a class="tile" href="projects/${
      project.slug
    }.html"
     data-name="${esc(project.title)}" data-sub="${esc(project.subtitle)}">
    <img src="images/thumbs/${image.file}" width="${image.w}" height="${image.h}"
         loading="${i < 16 ? "eager" : "lazy"}" decoding="async"
         alt="${esc(project.title)} — ${esc(project.subtitle)}">
  </a>`
  )
  .join("\n");

const home = page(
  {
    title: `${SITE.title} — photography`,
    description: SITE.lede,
    main: `<main>
  <div class="grid">
${tiles}
  </div>

  <footer class="colophon label">
    <span>&copy; ${new Date().getFullYear()} ${esc(SITE.title)}</span>
    <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>
  </footer>
</main>

<span class="counter label">${pad(manifest.length)} projects / ${totalFrames} frames</span>`,
  },
  ""
);

await writeFile(join(root, "index.html"), home);

/* --------------------------------------------------------- project pages */

await rm(join(root, "projects"), { recursive: true, force: true });
await mkdir(join(root, "projects"), { recursive: true });

for (const [i, project] of manifest.entries()) {
  const next = manifest[(i + 1) % manifest.length];
  const [hero, ...rest] = project.images;

  const altFor = (index) =>
    `${project.title} — ${project.subtitle}, frame ${pad(index + 1)}`;

  /* Row 1: hero, fixed height 100svh, object-fit cover. */
  const heroHtml = `  <figure class="hero" data-frame>
    <img src="../images/full/${hero.file}" width="${hero.w}" height="${hero.h}"
         fetchpriority="high" decoding="async" alt="${esc(altFor(0))}">
  </figure>`;

  /* Remaining frames: one per row, natural size, centered, generous space. */
  const sequenceHtml = rest
    .map(
      (image, index) => `    <figure class="frame reveal" data-frame>
      <div class="frame__inner">
        <img src="../images/full/${image.file}" width="${image.w}" height="${image.h}"
             loading="lazy" decoding="async" alt="${esc(altFor(index + 1))}">
        <figcaption class="frame__cap label">${pad(index + 2)} — ${esc(project.title)}</figcaption>
      </div>
    </figure>`
    )
    .join("\n");

  const data = JSON.stringify({
    frames: project.images.map((image, index) => ({
      src: `../images/full/${image.file}`,
      alt: altFor(index),
      caption: `${project.title} — ${project.subtitle}`,
    })),
  });

  const main = `<main>
${heroHtml}

  <header class="project__head">
    <span class="project__num label">${pad(i + 1)} / ${pad(manifest.length)}</span>
    <h1 class="project__title">${esc(project.title)}</h1>
    <span class="project__sub label">${esc(project.subtitle)}</span>
  </header>
${sequenceHtml ? `\n  <div class="frames">\n${sequenceHtml}\n  </div>\n` : ""}
  <a class="next" href="${next.slug}.html">
    <span class="next__label label">Next project</span>
    <span class="next__title">${esc(next.title)}</span>
  </a>
</main>

<span class="counter label" data-counter>01 / ${pad(project.images.length)}</span>`;

  const html = page(
    {
      /* The site and a project can share a name — don't title it "X — X". */
      title:
        project.title === SITE.title
          ? project.title
          : `${project.title} — ${SITE.title}`,
      description: `${project.title}, ${project.subtitle} — ${project.images.length} frames.`,
      main,
      lightbox: true,
      data,
    },
    "../"
  );

  await writeFile(join(root, "projects", `${project.slug}.html`), html);
}

/* ------------------------------------------------------- contact sheet */

/* A visual index: every photograph with its filename, grouped by project and
   in placement order. Meant to be kept open in a tab while building the
   Gridder layouts, so you can tell which file is which photo. */
const sheetProjects = manifest
  .map((project, i) => {
    const cells = project.images
      .map(
        (image, index) => `      <figure class="cell">
        <img src="images/thumbs/${image.file}" width="${image.w}" height="${image.h}"
             loading="lazy" decoding="async" alt="${esc(project.title)} frame ${pad(index + 1)}">
        <figcaption>
          <span class="cell__file">${image.file}</span>
          <span class="cell__role">${
            index === 0 ? "hero + thumbnail" : `frame ${pad(index + 1)}`
          }</span>
        </figcaption>
      </figure>`
      )
      .join("\n");

    return `  <section class="proj">
    <h2>
      <span class="proj__num">${pad(i + 1)}</span>
      <span class="proj__title">${esc(project.title)}</span>
      <span class="proj__sub">${esc(project.subtitle)}</span>
      <span class="proj__count">${project.images.length} frame${
        project.images.length > 1 ? "s" : ""
      }</span>
    </h2>
    <div class="cells">
${cells}
    </div>
  </section>`;
  })
  .join("\n\n");

const contactSheet = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contact sheet — ${esc(SITE.title)}</title>
<meta name="description" content="Every photograph with its filename, grouped by project, in placement order.">
<meta name="color-scheme" content="light">
<link rel="icon" href="${favicon}">
<style>
  :root {
    --paper: #f7f5f1; --ink: #0e0e0e; --clay: #b5562f;
    --rule: rgba(14,14,14,.14); --muted: rgba(14,14,14,.5);
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem clamp(1rem,3vw,2.5rem) 6rem;
    background: var(--paper); color: var(--ink);
    font-family: "Helvetica Neue", Inter, -apple-system, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  header { max-width: 44rem; margin-bottom: 3rem; }
  h1 { font-size: clamp(1.5rem,3.5vw,2.25rem); margin: 0 0 .75rem; letter-spacing: -.02em; }
  header p { color: var(--muted); margin: 0 0 .5rem; line-height: 1.55; }
  header a { color: var(--clay); }
  .proj { margin-bottom: 3.5rem; }
  .proj h2 {
    display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: baseline;
    margin: 0 0 1rem; padding-bottom: .6rem;
    border-bottom: 1px solid var(--rule); font-size: 1rem; font-weight: 500;
  }
  .proj__num, .proj__sub, .proj__count {
    font-family: var(--mono); font-size: .6875rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted);
  }
  .proj__title { font-size: 1.375rem; letter-spacing: -.01em; }
  .proj__count { margin-left: auto; }
  .cells {
    display: grid; gap: 1.25rem;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  figure.cell { margin: 0; }
  .cell img {
    display: block; width: 100%; height: auto;
    background: rgba(14,14,14,.06);
    border: 1px solid var(--rule);
  }
  .cell figcaption { margin-top: .5rem; }
  .cell__file, .cell__role {
    display: block; font-family: var(--mono); font-size: .6875rem;
    line-height: 1.5; word-break: break-all;
  }
  .cell__file { user-select: all; }
  .cell__role { color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .cell:first-child .cell__role { color: var(--clay); }
  @media (prefers-color-scheme: dark) {
    :root { --paper: #0e0e0e; --ink: #f7f5f1; --rule: rgba(247,245,241,.18); --muted: rgba(247,245,241,.5); }
    .cell img { background: rgba(247,245,241,.06); }
  }
</style>
</head>
<body>
<header>
  <h1>Contact sheet</h1>
  <p>Every photograph with its filename, grouped by project, in the order it
     goes into the layout. The first frame of each project is both the hero
     image and the Project Thumbnail.</p>
  <p>Click a filename to select it. <a href="index.html">Back to the site</a></p>
</header>

${sheetProjects}

</body>
</html>
`;

await writeFile(join(root, "contact-sheet.html"), contactSheet);

/* ------------------------------------------- WP-CLI import (for LayTheme) */

/* Imports the same 38 photos and creates the 13 Projects in WordPress, so the
   only thing left to do by hand is the Gridder layout work. Regenerated here
   so it can never drift from the manifest. */
const shBlocks = manifest
  .map((project, i) => {
    const imports = project.images
      .map(
        (image, index) =>
          `ids+=("$(import_image "${image.file}" "${project.title} — frame ${pad(
            index + 1
          )}")")`
      )
      .join("\n  ");

    return `# ---- ${pad(i + 1)} / ${pad(manifest.length)} — ${project.title} ${
      "-".repeat(Math.max(0, 46 - project.title.length))
    }
project_${i + 1}() {
  local ids=() pid
  echo "==> ${pad(i + 1)} ${project.title} (${project.images.length} frames)"
  ${imports}

  pid=$(wp post create \\
    --post_type="$POST_TYPE" \\
    --post_title="${project.title}" \\
    --post_name="${project.slug}" \\
    --post_excerpt="${project.subtitle}" \\
    --post_status=publish \\
    --porcelain)

  # First frame becomes the featured image, so the project shows up in the
  # homepage Element Grid before its Gridder layout exists.
  wp post meta update "$pid" _thumbnail_id "\${ids[0]}"
  echo "    post $pid, attachments: \${ids[*]}"
}`;
  })
  .join("\n\n");

const importScript = `#!/usr/bin/env bash
#
# Blueprint — WordPress import for the LayTheme build.
#
# GENERATED by blueprint/build.mjs from manifest.json. Do not edit by hand;
# edit the manifest and re-run \`node blueprint/build.mjs\`.
#
# Imports ${totalFrames} photographs into the media library and creates the
# ${manifest.length} Projects, each with its first frame as the featured image.
#
# Run it from the WordPress root, on the server, with WP-CLI installed:
#
#   POST_TYPE=project ./import-projects.sh /path/to/blueprint/images/full
#
# Check the post type slug first — LayTheme's portfolio post type is commonly
# 'project', but confirm with:  wp post-type list --format=table
#
set -euo pipefail

IMAGES="\${1:-./images/full}"
POST_TYPE="\${POST_TYPE:-project}"

if ! command -v wp >/dev/null 2>&1; then
  echo "WP-CLI ('wp') not found. Install it, or use the manual route in LAYTHEME-SETUP.md." >&2
  exit 1
fi

if [ ! -d "$IMAGES" ]; then
  echo "Image folder not found: $IMAGES" >&2
  exit 1
fi

if ! wp post-type list --field=name | grep -qx "$POST_TYPE"; then
  echo "Post type '$POST_TYPE' does not exist in this install." >&2
  echo "Run 'wp post-type list --format=table' and re-run with POST_TYPE=<slug>." >&2
  exit 1
fi

# Imports one file and prints its new attachment ID.
import_image() {
  wp media import "$IMAGES/$1" --title="$2" --porcelain
}

${shBlocks}

${manifest.map((_, i) => `project_${i + 1}`).join("\n")}

echo
echo "Done: ${manifest.length} projects, ${totalFrames} attachments."
echo "Next: Lay Options -> Images -> set JPG quality 80-85, then 'wp media regenerate --yes'."
echo "Then build the Gridder layouts — see LAYTHEME-SETUP.md, step 6 onwards."
`;

await mkdir(join(root, "wp"), { recursive: true });
await writeFile(join(root, "wp", "import-projects.sh"), importScript, {
  mode: 0o755,
});

console.log(
  `Built index.html + ${manifest.length} project pages (${totalFrames} frames), plus wp/import-projects.sh.`
);
