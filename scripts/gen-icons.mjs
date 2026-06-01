// Generates PWA PNG icons from inline SVG (no system fonts needed).
// Usage: node scripts/gen-icons.mjs
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

// Bar-chart mark on the brand indigo. `inset` controls the safe-zone padding
// used for the maskable variant.
function svg(inset = 0) {
  const s = 512;
  const scale = (512 - inset * 2) / 512;
  const tx = inset;
  const bars = `
    <rect x="140" y="300" width="56" height="100" rx="14"/>
    <rect x="228" y="244" width="56" height="156" rx="14"/>
    <rect x="316" y="170" width="56" height="230" rx="14"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" rx="${inset ? 0 : 112}" fill="#4f46e5"/>
    <g fill="#ffffff" transform="translate(${tx},${tx}) scale(${scale})">${bars}</g>
  </svg>`;
}

async function render(svgStr, size, name) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));
  console.log("✓", name);
}

await render(svg(0), 192, "icon-192.png");
await render(svg(0), 512, "icon-512.png");
await render(svg(0), 180, "apple-icon.png");
await render(svg(64), 512, "icon-maskable-512.png");
console.log("Done.");
