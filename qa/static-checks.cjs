'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
let failures = 0;
const fail = message => { failures++; console.error('FAIL:', message); };
const pass = message => console.log('PASS:', message);

const appFiles = [
  'index.html', 'src/app.js', 'src/style.css', 'sw.js',
  'manifest.webmanifest', 'sentry-init.js', 'icon-192.png', 'icon-512.png', 'icon.svg'
];
for (const file of appFiles) {
  if (fs.existsSync(path.join(root, file))) pass('Found ' + file);
  else fail('Missing application file: ' + file);
}

if (appFiles.every(file => fs.existsSync(path.join(root, file)))) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

  for (const [label, source] of [['Application JavaScript', appJs]]) {
    try { new vm.Script(source, { filename: label }); pass(label + ' syntax'); }
    catch (error) { fail(label + ' syntax: ' + error.message); }
  }
  const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]).filter(source => source.trim());
  for (const [index, source] of inlineScripts.entries()) {
    try { new vm.Script(source, { filename: 'index.html:inline-' + (index + 1) }); pass('Inline script ' + (index + 1) + ' syntax'); }
    catch (error) { fail('Inline script syntax: ' + error.message); }
  }

  const sentryInit = fs.readFileSync(path.join(root, 'sentry-init.js'), 'utf8');
  const checks = [
    ['Arabic RTL document', /<html\\b[^>]*\\bdir=["']rtl["']/i, html],
    ['Families screen', /id=["']p-fam["']/, html],
    ['Distribution screen', /id=["']p-dist["']/, html],
    ['Statistics screen', /id=["']p-stats["']/, html],
    ['Settings screen', /id=["']p-set["']/, html],
    ['Local database key', /sanabil_db/, appJs],
    ['9 kg/person quota', /members\\s*\\*\\s*9/, appJs],
    ['250 IQD/person payment', /members\\s*\\*\\s*250/, appJs],
    ['50 kg bag calculation', /Math\\.floor\\s*\\([^)]*\\/\\s*50\\s*\\)/, appJs],
    ['Service worker registration', /serviceWorker['"]?\\s*\\)?\\.register|serviceWorker\\.register/, html],
    ['Service worker install handler', /addEventListener\\(['"]install['"]/, sw],
    ['Service worker fetch handler', /addEventListener\\(['"]fetch['"]/, sw],
    ['External messaging excluded from cache', /telegram|script\\.google/i, sw],
    ['Provided Sentry Loader script is present', /https:\\/\\/js\\.sentry-cdn\\.com\\/04840aef61b2c3c27289909e1d91fd38\\.min\\.js/, html],
    ['Sentry initialization runs before the Loader', /sentry-init\\.js[\\s\\S]*?js\\.sentry-cdn\\.com/, html],
    ['Sentry PII collection disabled', /sendDefaultPii\\s*:\\s*false/, sentryInit],
    ['Sentry events scrubbed before sending', /beforeSend\\s*:\\s*safeEvent/, sentryInit],
    ['Sentry replay and tracing disabled', /tracesSampleRate\\s*:\\s*0[\\s\\S]*?replaysSessionSampleRate\\s*:\\s*0[\\s\\S]*?replaysOnErrorSampleRate\\s*:\\s*0/, sentryInit]
  ];
  for (const [label, pattern, source] of checks) {
    if (pattern.test(source)) pass(label);
    else fail('Missing: ' + label);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
    if (manifest.display) pass('PWA display mode'); else fail('PWA display mode missing');
    if (manifest.start_url) pass('PWA start_url'); else fail('PWA start_url missing');
  } catch { fail('Invalid PWA manifest JSON'); }
}

for (const file of ['.gitignore', 'SECURITY.md', '.github/workflows/qa.yml', '.github/workflows/codeql.yml']) {
  if (fs.existsSync(path.join(root, file))) pass('QA control file: ' + file);
  else fail('Missing QA control file: ' + file);
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
if (failures) {
  console.error('QA FAILED: ' + failures + ' check(s) failed.');
  process.exitCode = 1;
} else {
  pass('All static checks passed.');
}
