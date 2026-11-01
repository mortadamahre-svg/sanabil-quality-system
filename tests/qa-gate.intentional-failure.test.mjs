import test from 'node:test';
import assert from 'node:assert/strict';

// TEMPORARY QA GATE TEST ONLY.
// This test is intentionally failing to verify that GitHub blocks merging
// when a required status check fails. Do not merge this pull request.
test('temporary required-check gate must fail', () => {
  assert.equal('intentional-failure', 'expected-success');
});
