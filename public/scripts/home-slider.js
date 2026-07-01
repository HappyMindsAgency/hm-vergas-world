/*
 * Slider "7 storie ti aspettano" della home (Figma 75:937).
 * ponytail: scroll-snap nativo + pochi handler, niente libreria carousel.
 * Una slide visibile per volta; frecce (ai lati) e puntini 1..7 sincronizzati,
 * più autoplay che si mette in pausa all'interazione.
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

  const AUTOPLAY_MS = 6000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;

  // Scrolla SOLO il track in orizzontale (non usare scrollIntoView: sposterebbe
  // anche la pagina, riportando il browser in cima allo slider — bug UX segnalato).
  function go(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    const slide = slides[current];
    const left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left, behavior: "smooth" });
    dots.forEach((d, i) => d.setAttribute("aria-current", i === current ? "true" : "false"));
  }

  dots.forEach((d, i) => d.addEventListener("click", () => { go(i); restart(); }));
  if (prev) prev.addEventListener("click", () => { go(current - 1); restart(); });
  if (next) next.addEventListener("click", () => { go(current + 1); restart(); });

  // Autoplay: avanza in loop; pausa su hover/focus e alla navigazione manuale.
  let timer = 0;
  function start() {
    if (reduceMotion || timer) return;
    timer = window.setInterval(() => go((current + 1) % slides.length), AUTOPLAY_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = 0; }
  }
  function restart() { stop(); start(); }

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

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

  start();
})();
