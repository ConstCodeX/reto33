import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });

// App icon: gradient squircle with a clean concentric-ring motif (the "◎").
function svg({ bleed }) {
  // bleed=true => full-bleed art for maskable (motif inside safe zone).
  const ringR = bleed ? 150 : 165;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5e5ce6"/>
        <stop offset="1" stop-color="#bf5af2"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${bleed ? 0 : 112}" fill="url(#g)"/>
    <circle cx="256" cy="256" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="34" opacity="0.95"/>
    <circle cx="256" cy="256" r="${ringR * 0.33}" fill="#ffffff"/>
  </svg>`;
}

async function png(name, size, bleed) {
  await sharp(Buffer.from(svg({ bleed })))
    .resize(size, size)
    .png()
    .toFile(`public/${name}`);
  console.log("✓", name);
}

await png("icon-512.png", 512, false);
await png("icon-192.png", 192, false);
await png("apple-touch-icon.png", 180, false);
await png("icon-maskable-512.png", 512, true);
