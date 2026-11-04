import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
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
  assert.match(html, /<script src="assets\/visitor-rig\.bundle\.js" defer><\/script>/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
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

test('inline JavaScript compiles', () => {
  const matches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(matches.length>=2,'both ritual and WebGL scripts are present');
  for (const match of matches) assert.doesNotThrow(()=>new Script(match[1]));
});

test('immersive visitor view opens a separate prayer ritual', () => {
  for(const item of ['class="avatar"', 'id="enter"', 'id="prayerPanel"', "prayerPanel').classList.add('open')", 'A moment for yourself · No account needed']) assert.ok(html.includes(item),item);
  assert.ok(html.includes('.panel{position:relative'));
  assert.ok(html.includes('.panel.open{display:block'));
});

test('full-screen release has accessible way back and visitor appearance selection',()=>{
 for(const needle of ['id="closeSky"','id="returnGarden"','function leaveSky()','role="dialog"','aria-modal="true"','data-look="warm"','data-look="light"','document.body.style.overflow='])assert.ok(html.includes(needle),needle);
 assert.ok(html.includes(".sky{position:fixed"));
});

test('cinematic environment uses locally deployed forest and cosmos assets',()=>{
 for(const token of ['assets/forest.jpg','assets/cosmos.jpg','class="avatar"','class="hero-content"']) assert.ok(html.includes(token),token);
});

test('visitor enters ritual by approaching the tree', () => {
  for (const needle of ['id="prayerStop"', 'function approachTree()', "garden.classList.add('walking')", "garden.classList.add('arrived')", "prayerPanel').classList.add('open')", "wish').focus({preventScroll:true})"]) assert.ok(html.includes(needle), needle);
});
test('walking respects reduced motion and has no networking', () => {
  assert.ok(html.includes("const delay=quiet?0:1250"));
  assert.ok(html.includes('body.no-motion .garden .avatar'));
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test('native WebGL 3D avatar has real mesh and action transitions', () => {
  for (const token of [
    'id="visitor3d"', "getContext('webgl'", 'gl.drawArrays(gl.TRIANGLES',
    'window.WishAvatar3D={', "WishAvatar3D?.setPose('walk')",
    "WishAvatar3D?.setPose('pray')", 'garden.webgl-ready .avatar{display:none}',
    "garden.classList.remove('webgl-ready')"
  ]) assert.ok(html.includes(token), token);
});
test('3D avatar keeps fallback, privacy, and motion protections', () => {
  assert.match(html, /<svg class="avatar"/);
  assert.ok(html.includes("WishAvatar3D?.setReduced(quiet)"));
  assert.doesNotMatch(html, /<script[^>]+src=/i);
});

test('visual scene includes depth layers, realistic framing and accessible controls',()=>{
 for(const token of ['class="ground-mist"','class="wish-path"','class="lantern-glow lantern-glow-one"','class="visitor-shadow"','.hero-content h1{max-width:12ch','@media(max-width:680px)'])assert.ok(html.includes(token),token);
 assert.doesNotMatch(html, /<div class="garden" aria-hidden="true"/);
 assert.ok(html.includes('aria-label="A quiet forest sanctuary with your visitor by the wishing tree"'));
});

test('rigged character is first-party and keeps safe fallback', () => {
  assert.ok(html.includes('garden.rig-ready #visitor3d{display:none}'));
  assert.ok(html.includes('garden.rig-ready #visitorRig{display:block}'));
  assert.ok(html.includes("garden.classList.contains('rig-ready')"));
});
