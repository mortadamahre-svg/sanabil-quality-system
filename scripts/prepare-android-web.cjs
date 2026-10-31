'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const files = [
  'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'icon.svg', 'sentry-init.js', 'sentry-config.js', 'sw.js'
];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    if (file === 'sentry-config.js' || file === 'sw.js' || file === 'icon.svg') continue;
    throw new Error('Required Android web asset missing: ' + file);
  }
  fs.copyFileSync(source, path.join(out, file));
}
const src = path.join(root, 'src');
if (fs.existsSync(src)) fs.cpSync(src, path.join(out, 'src'), { recursive: true });
const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
if (!html.includes('<html lang="ar" dir="rtl"')) {
  throw new Error('Android bundle must remain Arabic RTL');
}
for (const file of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  if (!fs.existsSync(path.join(out, file))) throw new Error('Android bundle incomplete: ' + file);
}
console.log('Android web bundle prepared in www/');
