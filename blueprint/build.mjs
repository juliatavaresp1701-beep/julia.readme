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
  title: "Blueprint",
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

const chrome = (base) => `<header class="chrome">
  <a class="chrome__title" href="${base}index.html">${esc(SITE.title)}</a>
  <button class="chrome__menu" type="button" data-overlay-open aria-controls="overlay">Index</button>
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

const tiles = manifest
  .map((project, i) => {
    const cover = project.images[0];
    return `  <a class="tile" href="projects/${project.slug}.html" data-ratio="${(
      cover.h / cover.w
    ).toFixed(4)}">
    <img src="images/full/${cover.file}" width="${cover.w}" height="${cover.h}"
         loading="${i < 4 ? "eager" : "lazy"}" decoding="async"
         alt="${esc(project.title)} — ${esc(project.subtitle)}">
    <span class="tile__cap">
      <span class="tile__title">${esc(project.title)}</span>
      <span class="tile__sub label">${esc(project.subtitle)}</span>
    </span>
  </a>`;
  })
  .join("\n");

const home = page(
  {
    title: `${SITE.title} — photography`,
    description: SITE.lede,
    main: `<main>
  <section class="intro reveal">
    <p class="intro__kicker label">${esc(SITE.kicker)}</p>
    <p class="intro__lede">${esc(SITE.lede)}</p>
  </section>

  <div class="grid" data-grid>
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
      title: `${project.title} — ${SITE.title}`,
      description: `${project.title}, ${project.subtitle} — ${project.images.length} frames.`,
      main,
      lightbox: true,
      data,
    },
    "../"
  );

  await writeFile(join(root, "projects", `${project.slug}.html`), html);
}

console.log(
  `Built index.html + ${manifest.length} project pages (${totalFrames} frames).`
);
