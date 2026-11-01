import sharp from 'sharp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const svg = await readFile(path.join(root, 'assets/sanabil-icon.svg'));
await sharp(svg).resize(512, 512).png().toFile(path.join(root, 'icon-512.png'));
await sharp(svg).resize(192, 192).png().toFile(path.join(root, 'icon-192.png'));

const res = path.join(root, 'assets/android-res');
const ensure = async (p) => mkdir(path.join(res, p), { recursive: true });
for (const [density, size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]) {
  const dir = 'mipmap-' + density;
  await ensure(dir);
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  await writeFile(path.join(res, dir, 'ic_launcher.png'), png);
  await writeFile(path.join(res, dir, 'ic_launcher_round.png'), png);
}
await ensure('drawable');
const foreground = await sharp(svg).resize(292, 292).png().toBuffer();
const adaptive = await sharp({ create: { width: 432, height: 432, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: foreground, left: 70, top: 70 }]).png().toBuffer();
await writeFile(path.join(res, 'drawable/ic_launcher_foreground.png'), adaptive);
await ensure('mipmap-anydpi-v26');
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background" />
  <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;
await writeFile(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptiveXml);
await writeFile(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptiveXml);
await ensure('values');
const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#FFF7E6</color></resources>
`;
await writeFile(path.join(res, 'values/ic_launcher_background.xml'), colorsXml);
console.log('Generated Sanabil web and Android launcher icons.');
