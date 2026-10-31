'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const fail = (message) => { console.error('FAIL:', message); process.exitCode = 1; };
const pass = (message) => console.log('PASS:', message);

const appFiles = ['index.html', 'src/app.js', 'sw.js', 'manifest.webmanifest'];
const missing = appFiles.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.warn('WAITING FOR APP SOURCE: ' + missing.join(', '));
  console.warn('App regression checks will remain skipped until the original Sanabil app files are added.');
} else {
  for (const file of appFiles) pass('Found ' + file);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
  if (!scripts.length) fail('No inline application script found');
  for (const [i, source] of scripts.entries()) {
    try { new vm.Script(source, { filename: 'index.html:inline-' + (i + 1) }); pass('Inline JavaScript parses'); }
    catch (error) { fail('Inline JavaScript syntax error: ' + error.message); }
  }
  const checks = [
    ['Arabic RTL document direction', /<html[^>]*dir=["']rtl["']/i],
    ['Families screen', /id=["']p-fam["']/],
    ['Distribution screen', /id=["']p-dist["']/],
    ['Statistics screen', /id=["']p-stats["']/],
    ['Settings screen', /id=["']p-set["']/],
    ['Local database key', /sanabil_db/],
    ['9 kg per person rule', /members\s*\*\s*9/],
    ['250 IQD per person rule', /members\s*\*\s*250/],
    ['50 kg bag calculation', /Math\.floor\([^)]*\/\s*50\)/],
    ['Service worker registration', /serviceWorker\.register\(['"]sw\.js['"]\)/]
  ];
  for (const [label, pattern] of checks) pattern.test(html) ? pass(label) : fail('Missing: ' + label);
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
    manifest.display ? pass('PWA display mode') : fail('PWA display mode missing');
    manifest.start_url ? pass('PWA start_url') : fail('PWA start_url missing');
  } catch { fail('Invalid PWA manifest JSON'); }
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  /addEventListener\(['"]fetch['"]/.test(sw) ? pass('Service worker fetch handler') : fail('Service worker fetch handler missing');
  /telegram|script\.google/i.test(sw) ? pass('External messaging/sheets excluded from offline cache') : fail('Review external endpoint cache exclusions');
}

for (const file of ['.gitignore', 'SECURITY.md', '.github/workflows/qa.yml', '.github/workflows/codeql.yml']) {
  fs.existsSync(path.join(root, file)) ? pass('QA control file: ' + file) : fail('Missing QA control file: ' + file);
}
const forbidden = /(^|\/)(families-backup[^/]*\.json|flour-[^/]*backup[^/]*\.json)$/i;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (forbidden.test(full.slice(root.length + 1))) fail('Backup data must never be committed: ' + full.slice(root.length + 1));
  }
}
walk(root);
if (!process.exitCode) pass('No citizen backup files detected');
