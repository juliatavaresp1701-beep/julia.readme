/**
 * Blueprint — frame counter for LayTheme (01 / 08).
 *
 * Ported from blueprint/assets/site.js. LayTheme has no counter of its own,
 * so this is the one piece of custom code the design needs.
 *
 * Where to put it: a code-snippets plugin set to "footer, front end only", or
 * a child theme's footer. It only runs on single Project pages.
 *
 * IMPORTANT — set FRAME_SELECTOR below. Open one finished project page, right
 * click an image -> Inspect, and find the element that wraps each photo in the
 * Gridder output. The defaults below are guesses that cover the common cases;
 * if the counter reads "01 / 01" on a project with eight frames, the selector
 * is wrong, not the script.
 */
(function () {
  "use strict";

  var FRAME_SELECTOR = ".lay-content img, .gridder img, article img";

  /* LayTheme uses AJAX page transitions, so this has to be able to re-run
     after a navigation rather than only on first load. */
  function start() {
    var frames = Array.prototype.slice.call(
      document.querySelectorAll(FRAME_SELECTOR)
    );

    var existing = document.getElementById("blueprint-counter");

    /* Only on project pages with a real sequence. */
    if (frames.length < 2) {
      if (existing) existing.remove();
      return;
    }

    var counter = existing || document.createElement("span");
    counter.id = "blueprint-counter";
    if (!existing) document.body.appendChild(counter);

    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    var total = pad(frames.length);
    var ticking = false;

    var update = function () {
      ticking = false;
      var middle = window.innerHeight / 2;
      var current = 0;
      var best = Infinity;

      frames.forEach(function (frame, i) {
        var box = frame.getBoundingClientRect();
        var distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < best) {
          best = distance;
          current = i;
        }
      });

      counter.textContent = pad(current + 1) + " / " + total;
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);

  /* Re-run after LayTheme's AJAX navigation swaps the page content. */
  var body = document.body;
  if (window.MutationObserver && body) {
    var debounce;
    new MutationObserver(function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(start, 400);
    }).observe(body, { childList: true, subtree: true });
  }
})();
