'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const fail = (message) => { console.error('FAIL:', message); process.exitCode = 1; };
const pass = (message) => console.log('PASS:', message);
const required = ['index.html', 'src/app.js', 'src/style.css', 'sw.js', 'manifest.webmanifest'];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail('Missing required app file: ' + file);
  else pass('Found ' + file);
}
if (process.exitCode) process.exit();

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]).filter(s => s.trim());
if (!inlineScripts.length) fail('No inline application script found');
for (const [i, source] of inlineScripts.entries()) {
  try { new vm.Script(source, { filename: 'index.html:inline-script-' + (i + 1) }); pass('Inline JavaScript parses'); }
  catch (error) { fail('Inline JavaScript syntax error: ' + error.message); }
}
for (const [label, pattern] of [
  ['Arabic RTL document direction', /<html[^>]*dir=["']rtl["']/i],
  ['Families view', /id=["']p-fam["']/],
  ['Distribution view', /id=["']p-dist["']/],
  ['Statistics view', /id=["']p-stats["']/],
  ['Settings view', /id=["']p-set["']/],
  ['Local family database key', /sanabil_db/],
  ['Per-person flour quota rule (9 kg)', /members\s*\*\s*9/],
  ['Per-person payment rule (250 IQD)', /members\s*\*\s*250/],
  ['50 kg bag calculation', /Math\.floor\([^)]*\/\s*50\)/],
  ['Service worker registration', /serviceWorker\.register\(['"]sw\.js['"]\)/]
]) {
  if (pattern.test(html)) pass(label); else fail('Missing expected app behavior: ' + label);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
if (manifest.display) pass('PWA manifest has display mode'); else fail('PWA manifest missing display mode');
if (manifest.start_url) pass('PWA manifest has start_url'); else fail('PWA manifest missing start_url');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (/addEventListener\(['"]fetch['"]/.test(sw)) pass('Service worker fetch handler exists'); else fail('Service worker fetch handler missing');
if (/telegram|script\\.google/i.test(sw)) pass('External messaging/sheets endpoints are excluded from offline caching'); else fail('Review service worker external endpoint exclusions');
const forbidden = /(^|\/)(families-backup[^/]*\\.json|flour-[^/]*backup[^/]*\\.json)$/i;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (forbidden.test(full.slice(root.length + 1))) fail('Backup data must never be committed: ' + full.slice(root.length + 1));
  }
}
walk(root);
pass('No local citizen backup files found in repository');
