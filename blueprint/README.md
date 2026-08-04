# Blueprint — photography portfolio (static)

A working static build of the portfolio described in `LAYTHEME-SPEC.md`:
13 projects, 38 photographs, in the "modern Lay Theme vibe" — grid, typography,
whitespace.

**Live:** https://juliatavaresp1701-beep.github.io/julia.readme/blueprint/

This lives in a subfolder and does not touch the site at the repository root.

## Build

Pages are generated from `manifest.json`, which stays the source of truth for
filenames, project grouping and image order.

```bash
node blueprint/build.mjs     # writes index.html + projects/*.html
```

No dependencies, no build step beyond that — plain HTML, one stylesheet, one
script. Edit the copy blocks (site title, intro, about, contact, press) at the
top of `build.mjs` and re-run.

```
blueprint/
├── build.mjs          generator — run after editing manifest.json or copy
├── manifest.json      13 projects / 38 frames, with dimensions
├── index.html         generated
├── projects/*.html    generated, one per project
├── assets/site.css    all styling
├── assets/site.js     grid packing, overlay, lightbox, counter, transitions
├── images/full/       38 photographs (longest edge ≤1800px)
└── LAYTHEME-SPEC.md   the original WordPress/LayTheme build spec
```

## What's built

| Spec section | Here |
|---|---|
| 4.1 Element Grid | Masonry homepage grid, 4 columns desktop, 2px gutter, edge to edge. Titles and locations on mouseover only, over a bottom-third gradient. |
| 4.2 Project pages | Hero at `100svh` with `object-fit: cover`, remaining frames one per row at natural size, generous vertical space, Next Project link chaining all 13 and wrapping. |
| 4.3 Page Overlay | Burger/menu point opens a full-screen overlay: sortable project index (No. / Project / Location / Frames), about, contact, social, and a press marquee. Fade in, near-black, plain `×`, restores scroll position on close. |
| 5 Lightbox Addon | Click-to-zoom on project frames, near-black fullscreen, arrow keys, swipe, per-image caption (title + location), frame count. Off below 781px, as the addon defaults to. |
| 0 Motion | Fade page transitions and one fade-up per frame on scroll. Both respect `prefers-reduced-motion`. |
| 0 Signature detail | Running frame counter, bottom-left, small mono. Blended so it stays legible over both paper and photographs. |

Palette and type follow section 0: near-black `#0E0E0E`, off-white `#F7F5F1`,
clay rust `#B5562F` on hover/active states only. Background is the off-white
option, held everywhere.

The masonry grid packs tiles into the shortest column via JavaScript, which
keeps the bottom edge even and preserves reading order; CSS multi-column is the
fallback when JavaScript is off.

## Placeholders to replace before any real launch

- `studio@blueprint-example.com` and the two social links (`#`) in `build.mjs`
- the press names in `build.mjs` — currently invented titles, not real credits
- the about copy, which is Appendix B of the spec verbatim

## Relationship to the LayTheme spec

`LAYTHEME-SPEC.md` targets WordPress + LayTheme + the paid Lightbox Addon, and
most of its Gridder work is manual in `wp-admin` by design. Nothing in this
folder is a substitute for that build — it's the same content and the same
design direction, standing on its own as a static site, and usable as the
visual reference when the Gridder layouts do get built.
