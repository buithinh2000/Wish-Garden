import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('independent static preview has original sanctuary scene', () => {
  assert.match(html, /<svg class="garden-art"/);
  assert.match(html, /id="moon"/);
  assert.match(html, /garden-fireflies/);
  assert.doesNotMatch(html, /<div class="tree">🌳<\/div>/);
});
test('wish sending defaults to no persistence', () => {
  assert.match(html, /name="keep" value="no" checked/);
  assert.match(html, /name="keep" value="yes"/);
  assert.match(html, /document\.querySelector\('input\[name=keep\]:checked'\)\.value==='yes'/);
});
test('export, delete and local-only notices remain present', () => {
  for (const token of ['id="export"', 'id="delete"', 'localStorage.removeItem(key)', 'Wishes are never transmitted', 'Lời nguyện không truyền đi']) assert.ok(html.includes(token), token);
});
test('bilingual and reduced motion features remain present', () => {
  for (const token of ['document.documentElement.lang', 'prefers-reduced-motion', 'id="motion"', 'id="lang"', 'role="status"']) assert.ok(html.includes(token), token);
});
test('preview has no misleading community count or external service integration', () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(html, /google-analytics|gtag\(|firebase|supabase/i);
});

test('release ritual has accessible skip and constellation completion', () => {
  for (const token of ['id="skipRitual"', 'id="finishNote"', 'class="constellation"', 'function finishRitual()', 'ritualTimer=setTimeout(finishRitual,3500)', "if(quiet)finishRitual()"]) {
    assert.ok(html.includes(token), token);
  }
  assert.match(html, /id="sky" hidden/);
});

test('sanctuary lighting supports bilingual dawn/twilight controls', () => {
  for (const token of ['id="twilight"', 'id="dawn"', 'aria-pressed="true"', "setScene('twilight')", "setScene('dawn')", "body.dawn", '☀ Bình minh']) {
    assert.ok(html.includes(token), token);
  }
});
test('release view is brought into focus without exposing wish content', () => {
  assert.ok(html.includes("scrollIntoView({behavior:quiet?'instant':'smooth',block:'center'})"));
  assert.ok(html.includes("body.classList.toggle('no-motion',quiet)"));
  assert.ok(html.includes('class="ripple"'));
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});
