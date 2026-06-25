/*
 * Slider "7 storie ti aspettano" della home (Figma 75:937).
 * ponytail: scroll-snap nativo + pochi handler, niente libreria carousel.
 * Una slide visibile per volta; frecce e puntini 1..7 sincronizzati.
 */
(function () {
  const root = document.querySelector("[data-stories]");
  if (!root) return;

  const track = root.querySelector("[data-stories-track]");
  const slides = Array.from(root.querySelectorAll("[data-stories-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-stories-dot]"));
  const prev = root.querySelector("[data-stories-prev]");
  const next = root.querySelector("[data-stories-next]");
  if (!track || slides.length === 0) return;

  let current = 0;

  function go(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides[current].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    dots.forEach((d, i) => d.setAttribute("aria-current", i === current ? "true" : "false"));
  }

  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
  if (prev) prev.addEventListener("click", () => go(current - 1));
  if (next) next.addEventListener("click", () => go(current + 1));

  // Tiene i puntini allineati se l'utente scorre a mano.
  let raf = 0;
  track.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const mid = s.offsetLeft + s.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      current = best;
      dots.forEach((d, i) => d.setAttribute("aria-current", i === current ? "true" : "false"));
    });
  });
})();
