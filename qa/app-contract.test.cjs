'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('Sanabil app contains its core Arabic screens', () => {
  for (const id of ['p-home', 'p-fam', 'p-dist', 'p-stats', 'p-set']) {
    assert.match(html, new RegExp('id=["\\\\']' + id + '["\\\\']'), 'missing screen ' + id);
  }
});

test('Fixed monthly allocation rules remain unchanged', () => {
  assert.match(html, /members\\s*\\*\\s*9/, '9 kg per person must remain fixed');
  assert.match(html, /members\\s*\\*\\s*250/, '250 IQD per person must remain fixed');
  assert.match(html, /Math\\.floor\\([^)]*\\/\\s*50\\)/, 'bag size must remain 50 kg');
});

test('Beneficiary records and Telegram token remain local-storage based', () => {
  assert.match(html, /sanabil_db/);
  assert.match(html, /sanabil_tg_token/);
  assert.match(html, /type=["']password["']/);
  assert.doesNotMatch(html, /localStorage\\.clear\\s*\\(/, 'app must not clear all browser storage');
});

test('Full backup and restore controls exist', () => {
  for (const id of ['bkFull', 'rsFull', 'famBk', 'famRs']) {
    assert.match(html, new RegExp('id=["\\\\']' + id + '["\\\\']'), 'missing backup control ' + id);
  }
});

test('PWA offline support is registered', () => {
  assert.match(html, /serviceWorker\\.register\\(['"]sw\\.js['"]\\)/);
  assert.ok(fs.existsSync(path.join(root, 'manifest.webmanifest')));
  assert.ok(fs.existsSync(path.join(root, 'sw.js')));
});
