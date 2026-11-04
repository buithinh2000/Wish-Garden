import test from 'node:test';
import assert from 'node:assert/strict';
import {handle,nextBatch,inputValid} from '../service/worker.mjs';
const NOW=new Date('2026-11-05T01:00:00.000Z'),BATCH='2026-12-30',ORIGIN='https://buithinh2000.github.io';
const secret='a'.repeat(64);
const payload={batchId:BATCH,topic:2,secret,challenge:'test-turnstile-token'};
function mockDB(){
 const rows=new Map();
 return {rows,prepare(sql){let params=[];return {bind(...args){params=args;return this},async run(){
  if(sql.startsWith('INSERT INTO')){
   const [hash,batch,topic,created]=params;
   const prev=rows.get(hash);
   if(prev?.withdrawn)return {meta:{changes:0}};
   rows.set(hash,{hash,batch,topic,created,withdrawn:null});
   return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE participation')){
   const [withdrawn,hash,batch]=params;
   const prev=rows.get(hash);
   if(!prev||prev.batch!==batch||prev.withdrawn)return {meta:{changes:0}};
   prev.withdrawn=withdrawn;return {meta:{changes:1}};
  }
  throw Error('unexpected statement: '+sql);
 },async all(){
  const [batch]=params;
  const counts=new Map();
  for(const v of rows.values())if(v.batch===batch&&!v.withdrawn)counts.set(v.topic,(counts.get(v.topic)||0)+1);
  return {results:[...counts].map(([topic,n])=>({topic,n}))};
 }};}};
}
const env=()=>({DB:mockDB(),ALLOWED_ORIGIN:ORIGIN,TURNSTILE_SECRET:'test-server-secret',TURNSTILE_HOSTNAME:'buithinh2000.github.io'});
function req(method,path='/api/v1/participation',body=null,origin=ORIGIN){
 return new Request('https://api.example.test'+path,{method,headers:{origin,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
}
test('batch and cutoff use UTC date, not local browser time',()=>{
 assert.deepEqual(nextBatch(NOW),{batchId:BATCH,plannedUtc:'2026-12-30T12:00:00.000Z',cutoffUtc:'2026-12-29T12:00:00.000Z'});
 assert.equal(nextBatch(new Date('2026-12-30T12:00:00Z')).batchId,'2027-03-30');
});
test('reject private prose, email, names and arbitrary participant fields',()=>{
 assert.equal(inputValid({...payload,wish:'secret text'}),false);
 assert.equal(inputValid({...payload,email:'person@example.com'}),false);
 assert.equal(inputValid({...payload,topic:99}),false);
 assert.equal(inputValid(payload),true);
});
test('request requires exact configured origin and server-side challenge',async()=>{
 const e=env();
 assert.equal((await handle(req('OPTIONS'),e,NOW)).status,204);
 assert.equal((await handle(req('POST','/api/v1/participation',payload,'https://attacker.test'),e,NOW)).status,403);
 assert.equal((await handle(req('POST','/api/v1/participation',payload),{...e,TURNSTILE_SECRET:null},NOW)).status,503);
});
test('register, deduplicate, summarize privately, withdraw, forbid revoked receipt replay', {concurrency:false},async()=>{
 const e=env(),original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({success:true,hostname:'buithinh2000.github.io'});
 try{
  let res=await handle(req('POST','/api/v1/participation',payload),e,NOW);
  assert.equal(res.status,201);
  const issued=await res.json();
  assert.equal(issued.status,'REGISTERED_NOT_TRANSMITTED');
  assert.match(issued.receiptCode,/^[0-9a-f]{16}$/);
  assert.equal(e.DB.rows.size,1);
  res=await handle(req('POST','/api/v1/participation',payload),e,NOW);
  assert.equal(res.status,201);
  assert.equal(e.DB.rows.size,1);
  const summary=await (await handle(req('GET','/api/v1/summary'),e,NOW)).json();
  assert.equal(summary.submissions,null);
  assert.equal(summary.privacyThresholdReached,false);
  assert.equal(summary.status,'PLANNING_NOT_TRANSMITTED');
  res=await handle(req('DELETE','/api/v1/participation',payload),e,NOW);
  assert.equal(res.status,200);
  assert.equal((await res.json()).updated,true);
  res=await handle(req('POST','/api/v1/participation',payload),e,NOW);
  assert.equal(res.status,409);
  assert.equal((await res.json()).error,'RECEIPT_REVOKED');
 }finally{globalThis.fetch=original}
});
test('cutoff locks new consent before planned ceremony; no claims of RF emission',async()=>{
 const e=env(),cutoff=new Date('2026-12-29T12:00:00.000Z');
 const r=await handle(req('POST','/api/v1/participation',payload),e,cutoff);
 assert.equal(r.status,409);
 assert.equal((await r.json()).error,'BATCH_LOCKED');
});

test('Turnstile tokens from another host cannot register participation',async()=>{
 const e=env(),original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({success:true,hostname:'other.example'});
 try{
  const response=await handle(req('POST','/api/v1/participation',payload),e,NOW);
  assert.equal(response.status,403);
  assert.equal((await response.json()).error,'CHALLENGE_FAILED');
  assert.equal(e.DB.rows.size,0);
 }finally{globalThis.fetch=original}
});
test('missing Turnstile hostname prevents writes even with a valid challenge secret',async()=>{
 const e=env();delete e.TURNSTILE_HOSTNAME;
 const response=await handle(req('POST','/api/v1/participation',payload),e,NOW);
 assert.equal(response.status,503);
 assert.equal(e.DB.rows.size,0);
});
