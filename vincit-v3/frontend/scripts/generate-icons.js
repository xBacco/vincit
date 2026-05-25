// Generates all PNG icons (PWA + Android) from vincit-icon.svg using sharp.
// Run from the frontend/ directory: node scripts/generate-icons.js
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

const BASE   = path.join(__dirname, '..');
const ICON   = fs.readFileSync(path.join(BASE, 'public/vincit-icon.svg'));
const AD     = 'android/app/src/main/res';

// Foreground layer for Android adaptive icons: V symbol on transparent bg,
// scaled smaller so it sits inside the safe-zone (inner 66% of canvas).
const FG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <polyline points="168,132 256,364 344,132" fill="none" stroke="#c8973f"
    stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="256" cy="94" r="22" fill="#c8973f"/>
</svg>`);

function dest(rel) { return path.join(BASE, rel); }

async function sq(buf, size, rel) {
  await sharp(buf).resize(size, size).png().toFile(dest(rel));
  console.log(`  ✓  ${rel}`);
}

async function circle(buf, size, rel) {
  const mask = Buffer.from(
    `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );
  await sharp(buf)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(dest(rel));
  console.log(`  ✓  ${rel}`);
}

(async () => {
  console.log('\nGenerating PWA icons…');
  await sq(ICON, 192, 'public/icons/icon-192.png');
  await sq(ICON, 512, 'public/icons/icon-512.png');
  await sq(ICON, 180, 'public/icons/icon-180.png');
  await sq(ICON, 180, 'public/icons/apple-touch-icon.png');

  console.log('\nGenerating Android launcher icons…');
  for (const [size, density] of [[48,'mdpi'],[72,'hdpi'],[96,'xhdpi'],[144,'xxhdpi'],[192,'xxxhdpi']]) {
    await sq    (ICON, size, `${AD}/mipmap-${density}/ic_launcher.png`);
    await circle(ICON, size, `${AD}/mipmap-${density}/ic_launcher_round.png`);
  }

  console.log('\nGenerating Android adaptive foreground icons…');
  for (const [size, density] of [[108,'mdpi'],[162,'hdpi'],[216,'xhdpi'],[324,'xxhdpi'],[432,'xxxhdpi']]) {
    await sq(FG, size, `${AD}/mipmap-${density}/ic_launcher_foreground.png`);
  }

  console.log('\nDone.\n');
})().catch(e => { console.error(e); process.exit(1); });
