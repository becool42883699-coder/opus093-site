/**
 * Generates monochrome placeholder images for the Be Cool site.
 * These are SWAP-IN placeholders (same tone as the reference) — replace the
 * files in public/becool/img with real photos later, keeping the same names.
 *
 *   node scripts/gen-becool-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "becool", "img");
mkdirSync(OUT, { recursive: true });

/* deterministic pseudo-random so builds are stable */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** one abstract monochrome "photo" placeholder */
function photo(seed, w, h, label) {
  const r = rng(seed);
  const g0 = 236 - Math.floor(r() * 10);
  const g1 = 198 - Math.floor(r() * 40);
  const shapes = [];
  const kinds = ["circle", "hex", "band"];
  for (let i = 0; i < 5; i++) {
    const k = kinds[Math.floor(r() * kinds.length)];
    const cx = Math.floor(r() * w);
    const cy = Math.floor(r() * h);
    const size = 90 + Math.floor(r() * Math.min(w, h) * 0.5);
    const op = (0.05 + r() * 0.12).toFixed(3);
    const tone = 40 + Math.floor(r() * 120);
    if (k === "circle") {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${size}" fill="rgb(${tone},${tone},${tone})" opacity="${op}"/>`);
    } else if (k === "hex") {
      const pts = [];
      for (let a = 0; a < 6; a++) {
        const ang = (Math.PI / 3) * a - Math.PI / 6;
        pts.push(`${(cx + Math.cos(ang) * size).toFixed(0)},${(cy + Math.sin(ang) * size).toFixed(0)}`);
      }
      shapes.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="rgb(${tone},${tone},${tone})" stroke-width="2" opacity="${op}"/>`);
    } else {
      const bh = 40 + Math.floor(r() * 120);
      shapes.push(`<rect x="${-50}" y="${cy}" width="${w + 100}" height="${bh}" transform="rotate(${(-14 + r() * 28).toFixed(1)} ${w / 2} ${h / 2})" fill="rgb(${tone},${tone},${tone})" opacity="${op}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgb(${g0},${g0 - 4},${g0 - 8})"/>
      <stop offset="1" stop-color="rgb(${g1},${g1 - 6},${g1 - 2})"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${shapes.join("\n  ")}
</svg>\n`;
}

/** business-card mockup placeholder (two cards on a surface) */
function cards() {
  const w = 1600, h = 1000;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Business card mockup placeholder">
  <rect width="${w}" height="${h}" fill="#cfd0cc"/>
  <rect width="${w}" height="${h}" fill="#c6c7c2" opacity="0.5"/>
  <g transform="rotate(-9 ${w / 2} ${h / 2})">
    <rect x="470" y="300" width="380" height="620" rx="6" fill="#f6f5f1" stroke="#e3e2dd"/>
    <rect x="760" y="360" width="380" height="620" rx="6" fill="#efeee9" stroke="#e0dfd9"/>
    <polygon points="560,430 620,395 680,430 680,500 620,535 560,500" fill="none" stroke="#1a1a1a" stroke-width="9"/>
    <rect x="545" y="600" width="230" height="12" rx="6" fill="#1a1a1a"/>
    <rect x="545" y="640" width="150" height="8" rx="4" fill="#8f8f8f"/>
  </g>
</svg>\n`;
}

const files = {
  "hero.svg": photo(101, 1600, 1100, "Studio hero placeholder"),
  "concept.svg": photo(202, 1600, 900, "Concept placeholder"),
  "about-band.svg": photo(303, 1800, 620, "About band placeholder"),
  "card-mockup.svg": cards(),
  "work-1.svg": photo(11, 1000, 750, "Work placeholder 1"),
  "work-2.svg": photo(22, 1000, 750, "Work placeholder 2"),
  "work-3.svg": photo(33, 1000, 750, "Work placeholder 3"),
  "work-4.svg": photo(44, 1000, 750, "Work placeholder 4"),
  "work-5.svg": photo(55, 1000, 750, "Work placeholder 5"),
  "work-6.svg": photo(66, 1000, 750, "Work placeholder 6"),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, name), svg);
  console.log("wrote", name);
}
