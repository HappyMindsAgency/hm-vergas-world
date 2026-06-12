// One-shot migration helper: HTML page -> Astro page wrapped in BaseLayout.
// Extracts <body> inner HTML, rewrites asset/internal paths to absolute clean
// URLs, injects perf attributes, and emits a .astro file. Run once, then the
// generated .astro files are the source of truth (this script can be deleted).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const PAGES = [
  { f: "scuole.html", css: "styles.css", fonts: "none", scripts: ["/scripts/app.js"] },
  { f: "famiglie.html", css: "styles.css", fonts: "none", scripts: ["/scripts/app.js"] },
  { f: "borgo-cunziria.html", css: "styles.css", fonts: "none", scripts: ["/scripts/app.js"] },
  { f: "avventura/index.html", css: "adventure.css", fonts: "adventure", scripts: ["/scripts/adventure.js"] },
  { f: "avventura/passaporto/index.html", css: "adventure.css", fonts: "adventure", scripts: ["/scripts/adventure.js"] },
  { f: "avventura/missione/la-lupa/index.html", css: "adventure.css", fonts: "adventure", scripts: ["/scripts/quiz-data.js", "/scripts/adventure.js"] },
  { f: "insegnante/login/index.html", css: "teacher.css", fonts: "main", scripts: ["/scripts/teacher.js"] },
  { f: "insegnante/dashboard/index.html", css: "teacher.css", fonts: "main", scripts: ["/scripts/teacher.js"] },
  { f: "insegnante/impostazioni/index.html", css: "teacher.css", fonts: "main", scripts: ["/scripts/teacher.js"] },
  { f: "insegnante/classe/index.html", css: "teacher.css", fonts: "main", scripts: [] },
  { f: "insegnante/materiali/index.html", css: "teacher.css", fonts: "main", scripts: [] },
  { f: "invito/index.html", css: "teacher.css", fonts: "main", scripts: ["/scripts/teacher.js"] },
];

/** Resolve a relative href/src (from file dir) to an absolute clean URL. */
function rewritePath(value, fileDir) {
  if (!value) return value;
  if (/^(https?:|mailto:|tel:|data:|#|\/)/i.test(value)) return value;

  // split hash/query
  const m = value.match(/^([^#?]*)([#?].*)?$/);
  let p = m[1];
  const suffix = m[2] || "";

  const abs = path.posix.normalize(path.posix.join(fileDir, p)); // e.g. immagini/x.jpg

  if (abs.startsWith("immagini/")) return "/" + abs + suffix;

  if (abs.endsWith(".html")) {
    let route = abs.replace(/index\.html$/, "").replace(/\.html$/, "");
    route = "/" + route.replace(/\/$/, "");
    if (route === "/") return "/" + suffix.replace(/^\//, "");
    return route + suffix;
  }
  // other static asset (svg outside immagini, etc.)
  return "/" + abs + suffix;
}

function rewriteAttrs(html, fileDir) {
  return html.replace(/\b(href|src)=("|')(.*?)\2/gis, (full, attr, q, val) => {
    if (val.trim() === "") return full; // leave empty src (modal placeholder)
    return `${attr}=${q}${rewritePath(val.trim(), fileDir)}${q}`;
  });
}

function injectImgPerf(html) {
  return html.replace(/<img\b[^>]*>/gis, (tag) => {
    let t = tag;
    if (!/\bloading=/i.test(t)) t = t.replace(/<img\b/i, '<img loading="lazy"');
    if (!/\bdecoding=/i.test(t)) t = t.replace(/<img\b/i, '<img decoding="async"');
    // WCAG 1.1.1: every <img> must have an alt. Missing -> decorative fallback.
    if (!/\balt=/i.test(t)) t = t.replace(/<img\b/i, '<img alt=""');
    return t;
  });
}

function ensureMainId(html) {
  let done = false;
  return html.replace(/<main\b([^>]*)>/i, (full, attrs) => {
    if (done) return full;
    done = true;
    if (/\bid=/i.test(attrs)) {
      return `<main${attrs.replace(/\bid=("|').*?\1/i, 'id="main-content"')}>`;
    }
    return `<main id="main-content"${attrs}>`;
  });
}

for (const cfg of PAGES) {
  const srcAbs = path.join(ROOT, cfg.f);
  const raw = readFileSync(srcAbs, "utf8");
  const fileDir = path.posix.dirname(cfg.f.split(path.sep).join("/"));

  const title = (raw.match(/<title>([^<]*)<\/title>/i) || [, ""])[1].trim();
  const bodyMatch = raw.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  const bodyAttrs = bodyMatch ? bodyMatch[1] : "";
  let body = bodyMatch ? bodyMatch[2] : "";

  const page = (bodyAttrs.match(/data-page=("|')(.*?)\1/i) || [, , null])[2];
  const bodyClass = (bodyAttrs.match(/class=("|')(.*?)\1/i) || [, , null])[2];

  // Extract inline scripts (no src); drop all <script> tags from body.
  const inlineScripts = [];
  body = body.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, code) => {
    if (/\bsrc=/i.test(attrs)) return ""; // external -> provided via config
    if (code.trim()) inlineScripts.push(code.trim());
    return "";
  });

  body = rewriteAttrs(body, fileDir);
  body = injectImgPerf(body);
  body = ensureMainId(body);
  body = body.trim();

  // Build .astro
  const dest = path.join(ROOT, "src", "pages", cfg.f.replace(/\.html$/, ".astro"));
  mkdirSync(path.dirname(dest), { recursive: true });
  const importRel = path.posix.relative(
    path.posix.dirname(path.posix.join("src/pages", cfg.f)),
    "src"
  );

  const scriptsProp =
    cfg.scripts.length === 0
      ? "[]"
      : "[" + cfg.scripts.map((s) => `{ src: ${JSON.stringify(s)} }`).join(", ") + "]";

  const props = [
    `title=${JSON.stringify(title)}`,
    `fonts=${JSON.stringify(cfg.fonts)}`,
    `scripts={${scriptsProp}}`,
    page ? `page=${JSON.stringify(page)}` : null,
    bodyClass ? `bodyClass=${JSON.stringify(bodyClass)}` : null,
  ]
    .filter(Boolean)
    .join("\n  ");

  const inlineEmit = inlineScripts
    .map((code) => `<script is:inline set:html={${JSON.stringify(code)}} />`)
    .join("\n");

  const out = `---
import BaseLayout from "${importRel}/layouts/BaseLayout.astro";
import "${importRel}/styles/${cfg.css}";

const body = ${JSON.stringify(body)};
---

<BaseLayout
  ${props}
>
  <Fragment set:html={body} />
${inlineEmit}
</BaseLayout>
`;

  writeFileSync(dest, out, "utf8");
  console.log("wrote", path.relative(ROOT, dest));
}
console.log("done");
