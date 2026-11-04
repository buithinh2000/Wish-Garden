import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_PHRASE,planFor,draftPacket,sha256Hex,manifest} from '../src/hope-packet.mjs';

test('next quarterly UTC plan rolls over and is not an RF reservation',()=>{
 assert.equal(planFor(new Date('2026-11-05T00:00:00Z')).id,'2026-12-30');
 assert.equal(planFor(new Date('2026-12-30T12:00:00Z')).id,'2027-03-30');
 assert.equal(planFor(new Date('2027-06-30T11:59:59Z')).id,'2027-06-30');
});
test('project-owned RF draft has zero personal participation evidence',()=>{
 const draft=draftPacket(new Date('2026-11-05T00:00:00Z'));
 assert.equal(draft.message,DEFAULT_PHRASE);
 assert.equal(draft.status,'DRAFT_NOT_SUBMITTED');
 assert.equal(draft.participantCount,null);
 assert.equal(draft.consentedParticipantDataIncluded,false);
 assert.equal(draft.actualBroadcastUtc,null);
 assert.equal(draft.operatorEvidenceUrl,null);
 assert.equal(draft.providerRequestId,null);
 assert.ok([...draft.message].length<=140);
});
test('SHA-256 covers the exact public phrase and does not invent RF evidence',async()=>{
 assert.equal(await sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 const x=await manifest(new Date('2026-11-05T00:00:00Z'));
 assert.equal(x.messageSha256,await sha256Hex(x.message));
 assert.match(x.notice,/No radio emission/);
});
test('long and multiline project phrases are rejected',()=>{
 assert.throws(()=>draftPacket(new Date('2026-11-05T00:00:00Z'),'x'.repeat(141)));
 assert.throws(()=>draftPacket(new Date('2026-11-05T00:00:00Z'),'a\nb'));
});
test('browser-only preview never reads wishes or contacts providers',()=>{
 const source=readFileSync(new URL('../src/hope-packet.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|fetch\\s*\\(|XMLHttpRequest|sendBeacon|WebSocket|innerHTML\\s*=/);
 assert.match(source,/DRAFT_NOT_SUBMITTED/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<script type="module" src="src\/hope-packet\.mjs"><\/script>/);
});
