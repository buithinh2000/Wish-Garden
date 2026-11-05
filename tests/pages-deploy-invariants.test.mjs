import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Pages deployment verifies the actual public website, not only PR artifacts',()=>{
 const workflow=readFileSync('.github/workflows/pages.yml','utf8');
 const deploy=workflow.indexOf('uses: actions/deploy-pages@v4');
 const verify=workflow.indexOf('- name: Verify public Pages release and 3D assets');
 assert.ok(deploy>=0 && verify>deploy,'public acceptance must run after deploy-pages');
 const live=workflow.slice(verify);
 for(const expected of [
  'steps.deployment.outputs.page_url',
  'github.sha',
  'Build $SHORT_SHA',
  'sanctuary-world.bundle.js?v=$SHORT_SHA',
  'id="daylightStatus"',
  'class="world-prayer-link"',
  'assets/visitor-human.glb',
  'assets/sanctuary/lotus-pond-pavilion.glb',
  'assets/nature/tree_oak.glb',
  'PUBLIC PAGES VERIFIED'
 ])assert.ok(live.includes(expected),`missing public live check: ${expected}`);
});
