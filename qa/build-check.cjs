'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
let errors = 0;
const fail = m => { errors++; console.error('BUILD FAIL:', m); };
const pass = m => console.log('BUILD PASS:', m);

if (!/<html\b[^>]*\blang=["']ar["'][^>]*\bdir=["']rtl["']/i.test(html)) fail('Arabic RTL root element missing');
else pass('Arabic RTL entry document');

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) fail('Duplicate HTML IDs: ' + [...new Set(duplicates)].join(', '));
else pass('HTML IDs are unique');

const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
if (!styles.length || !styles.some(s => s.trim().length > 100)) fail('No embedded application styles found');
else pass('Embedded CSS found (' + styles.length + ' style blocks)');

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
if (!scripts.length) fail('No executable application script found');
for (let i = 0; i < scripts.length; i++) {
  try { new vm.Script(scripts[i], { filename: 'index.html:inline-' + (i + 1) }); pass('Inline JavaScript ' + (i + 1) + ' parses'); }
  catch (e) { fail('Inline JavaScript ' + (i + 1) + ': ' + e.message); }
}

const localRefs = [...html.matchAll(/(?:src|href)=["']([^"'#][^"']*)["']/gi)]
  .map(m => m[1]).filter(u => !/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(u) && !u.startsWith('//'));
for (const ref of localRefs) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  const target = path.resolve(root, clean);
  if (!target.startsWith(root + path.sep) && target !== root) { fail('Unsafe asset path: ' + ref); continue; }
  if (fs.existsSync(target)) pass('Referenced asset exists: ' + clean);
  else fail('Referenced asset missing: ' + clean);
}

try {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  if (!manifest.name || !manifest.start_url || !manifest.display) fail('Manifest missing required PWA fields');
  else pass('PWA manifest valid');
  for (const icon of manifest.icons || []) {
    const p = icon.src.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(root, p))) fail('Manifest icon missing: ' + p);
    else pass('Manifest icon exists: ' + p);
  }
} catch (e) { fail('Manifest JSON invalid: ' + e.message); }

if (!fs.existsSync(path.join(root, 'sw.js'))) fail('Service worker missing');
else pass('Service worker file present');

if (errors) { console.error('BUILD CHECK FAILED: ' + errors + ' issue(s)'); process.exitCode = 1; }
else console.log('BUILD CHECK PASSED');
