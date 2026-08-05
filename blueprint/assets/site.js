/* Blueprint — overlay, project index, lightbox, frame counter, transitions. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) {
    return String(n).padStart(2, "0");
  };

  /* ------------------------------------------------- page overlay (index) */

  var overlay = document.querySelector("[data-overlay]");
  var scrollY = 0;

  function openOverlay() {
    if (!overlay) return;
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = -scrollY + "px";
    document.body.style.width = "100%";
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay() {
    if (!overlay || !overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  }

  document.querySelectorAll("[data-overlay-open]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openOverlay();
    });
  });

  document.querySelectorAll("[data-overlay-close]").forEach(function (el) {
    el.addEventListener("click", closeOverlay);
  });

  /* --------------------------------------------------- project index sort */

  var indexBody = document.querySelector("[data-index-body]");

  if (indexBody) {
    document.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-sort");
        var asc = button.getAttribute("aria-sort") !== "ascending";

        document.querySelectorAll("[data-sort]").forEach(function (other) {
          other.setAttribute("aria-sort", "none");
        });
        button.setAttribute("aria-sort", asc ? "ascending" : "descending");

        var rows = Array.prototype.slice.call(
          indexBody.querySelectorAll("[data-row]")
        );
        rows.sort(function (a, b) {
          var x = a.dataset[key] || "";
          var y = b.dataset[key] || "";
          var diff =
            key === "num" || key === "frames"
              ? Number(x) - Number(y)
              : x.localeCompare(y);
          return asc ? diff : -diff;
        });
        rows.forEach(function (row) {
          indexBody.appendChild(row);
        });
      });
    });
  }

  /* ---------------------------------------------------- scroll animations */

  var reveals = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------ running frame counter */

  var counter = document.querySelector("[data-counter]");
  var frames = Array.prototype.slice.call(document.querySelectorAll("[data-frame]"));

  if (counter && frames.length) {
    var total = pad(frames.length);
    var ticking = false;

    var updateCounter = function () {
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

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateCounter);
      },
      { passive: true }
    );
    window.addEventListener("resize", updateCounter);
    updateCounter();
  }

  /* ------------------------------------------------------------ lightbox */

  var lightbox = document.querySelector("[data-lightbox]");
  var sequence = window.BLUEPRINT && window.BLUEPRINT.frames;
  /* Off on phone — the scroll-through project page already reads as the
     lightbox there. Matches the Lightbox Addon's own default. */
  var lightboxEnabled = window.matchMedia("(min-width: 781px)").matches;

  if (lightbox && sequence && sequence.length) {
    var lbImage = lightbox.querySelector("[data-lightbox-image]");
    var lbCaption = lightbox.querySelector("[data-lightbox-caption]");
    var lbCount = lightbox.querySelector("[data-lightbox-count]");
    var at = 0;

    var show = function (i) {
      at = (i + sequence.length) % sequence.length;
      var frame = sequence[at];
      lbImage.src = frame.src;
      lbImage.alt = frame.alt;
      lbCaption.textContent = frame.caption;
      lbCount.textContent = pad(at + 1) + " / " + pad(sequence.length);
    };

    var openLightbox = function (i) {
      show(i);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll("[data-frame]").forEach(function (frame, i) {
      frame.addEventListener("click", function () {
        if (!window.matchMedia("(min-width: 781px)").matches) return;
        openLightbox(i);
      });
    });

    lightbox
      .querySelector("[data-lightbox-prev]")
      .addEventListener("click", function () {
        show(at - 1);
      });
    lightbox
      .querySelector("[data-lightbox-next]")
      .addEventListener("click", function () {
        show(at + 1);
      });
    lightbox
      .querySelector("[data-lightbox-close]")
      .addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    /* Swipe, for trackpads and tablets that land above the phone breakpoint. */
    var startX = null;
    lightbox.addEventListener(
      "touchstart",
      function (e) {
        startX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener(
      "touchend",
      function (e) {
        if (startX === null) return;
        var delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 45) show(delta < 0 ? at + 1 : at - 1);
        startX = null;
      },
      { passive: true }
    );

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });

    if (lightboxEnabled) {
      document.querySelectorAll("[data-frame]").forEach(function (frame) {
        frame.classList.add("frame--zoomable");
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  /* ------------------------------------- navigation animation (fade nav) */

  if (!reduceMotion) {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      if (!link) return;
      if (
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      )
        return;

      var url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () {
        window.location.href = link.href;
      }, 240);
    });

    window.addEventListener("pageshow", function () {
      document.body.classList.remove("is-leaving");
    });
  }
})();
