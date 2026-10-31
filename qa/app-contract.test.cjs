'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appReady = ['index.html', 'sw.js', 'manifest.webmanifest'].every(f => fs.existsSync(path.join(root, f)));

test('Sanabil application regression contract', { skip: !appReady && 'App source files not uploaded yet' }, () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const id of ['p-home', 'p-fam', 'p-dist', 'p-stats', 'p-set']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing screen ' + id);
  }
  assert.match(html, /members\s*\*\s*9/, '9 kg per person rule must remain');
  assert.match(html, /members\s*\*\s*250/, '250 IQD per person rule must remain');
  assert.match(html, /Math\.floor\([^)]*\/\s*50\)/, 'bag size must remain 50 kg');
  assert.match(html, /sanabil_db/);
  assert.match(html, /sanabil_tg_token/);
  assert.match(html, /type=["']password["']/);
  assert.doesNotMatch(html, /localStorage\.clear\s*\(/, 'app must not clear all browser storage');
  for (const id of ['bkFull', 'rsFull', 'famBk', 'famRs']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing backup control ' + id);
  }
  assert.match(html, /serviceWorker\.register\(['"]sw\.js['"]\)/);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.ok(manifest.display);
});
