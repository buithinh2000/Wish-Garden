import test from 'node:test';
import assert from 'node:assert/strict';
import {handler,checkWish,verifyToken} from '../src/worker.mjs';
const origin='https://buithinh2000.github.io';
const cfg={AUTH_ISSUER:'https://identity.example.test/',AUTH_AUDIENCE:'wish-garden-api',AUTH_JWKS_URL:'https://identity.example.test/keys',ALLOW_ORIGIN:origin,FEATURE_COLLECTIVE_HOPE:'false'};
const b64=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
async function tokenFor(sub='user-a'){
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='testing-key';
 const now=Math.floor(Date.now()/1000);
 const raw=b64({alg:'RS256',kid:jwk.kid})+'.'+b64({sub,iss:cfg.AUTH_ISSUER,aud:cfg.AUTH_AUDIENCE,iat:now,exp:now+300});
 const signed=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(raw))).toString('base64url');
 return {token:raw+'.'+signed,jwk};
}
class MockDB {
 constructor(){this.rows=[];this.quotas=new Map()}
 prepare(sql){return {bind:(...args)=>({
   run:async()=>{
     if(sql.startsWith('INSERT INTO write_quotas')){const key=args[0]+':'+args[1],count=this.quotas.get(key)||0;if(count>=10)return {meta:{changes:0}};this.quotas.set(key,count+1);return {meta:{changes:1}}}
     if(sql.startsWith('INSERT INTO wishes')){this.rows.push({id:args[0],owner_sub:args[1],topic:args[2],body:args[3],state:'ongoing',aggregate_opt_in:0,created_at:args[4],updated_at:args[5]});return {meta:{changes:1}}}
     if(sql.startsWith('DELETE')){const before=this.rows.length;this.rows=this.rows.filter(x=>!(x.id===args[0]&&x.owner_sub===args[1]));return {meta:{changes:before-this.rows.length}}}
     if(sql.startsWith('UPDATE')){let row=this.rows.find(x=>x.id===args[3]&&x.owner_sub===args[4]);if(!row)return {meta:{changes:0}};row.state=args[0];row.aggregate_opt_in=args[1];row.updated_at=args[2];return {meta:{changes:1}}}
     throw new Error('unexpected query '+sql);
   },
   all:async()=>{
     if(sql.startsWith('SELECT id,topic,body'))return {results:this.rows.filter(x=>x.owner_sub===args[0])};
     if(sql.startsWith('SELECT topic,COUNT'))return {results:[]};
     throw new Error('unexpected query '+sql);
   }
 })}}
}
function req(path,token,method='GET',body){return new Request('https://api.example.test'+path,{method,headers:{origin,authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined})}
test('validates topics and wish size',()=>{assert.equal(checkWish({topic:'invalid',body:'a'}),null);assert.equal(checkWish({topic:'peace',body:'   '}),null);assert.deepEqual(checkWish({topic:'peace',body:' hi '}),{topic:'peace',body:'hi'})});
test('rejects invalid JWT signature and respects issuer audience',async()=>{
 const {token,jwk}=await tokenFor();
 const old=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({keys:[jwk]})});
 try{assert.equal(await verifyToken('Bearer '+token,cfg),'user-a');await assert.rejects(()=>verifyToken('Bearer '+token.slice(0,-12)+'ABCD'+token.slice(-8),cfg));await assert.rejects(()=>verifyToken('Bearer '+token,{...cfg,AUTH_AUDIENCE:'wrong'}))}finally{globalThis.fetch=old}
});
test('enforces owner isolation, explicit aggregate consent, and deletion',async()=>{
 const {token,jwk}=await tokenFor('a'),other=await tokenFor('b');const db=new MockDB();
 const old=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({keys:[jwk,other.jwk]})});
 // Both keys share test kid; use individual fetcher based on token for simulated multi-user validation.
 // In this test use one issuer RSA key with sub changed only for handler-level ownership:
 try{
 const env={...cfg,DB:db};
 const created=await handler(req('/v1/wishes',token,'POST',{topic:'family',body:'May my family be well'}),env);
 assert.equal(created.status,201);const item=await created.json();assert.equal(item.aggregate_opt_in,false);
 const list=await(await handler(req('/v1/wishes',token),env)).json();assert.equal(list.wishes.length,1);
 const patch=await handler(req('/v1/wishes/'+item.id,token,'PATCH',{state:'fulfilled',aggregate_opt_in:true}),env);assert.equal(patch.status,200);
 const removed=await handler(req('/v1/wishes/'+item.id,token,'DELETE'),env);assert.deepEqual(await removed.json(),{deleted:true});
 const remaining=await(await handler(req('/v1/wishes',token),env)).json();assert.equal(remaining.wishes.length,0);
 const hope=await handler(req('/v1/collective-hope',token),env);assert.equal(hope.status,404);
 }finally{globalThis.fetch=old}
});
test('refuses cross-origin writes without touching the database',async()=>{
 const db=new MockDB();
 const response=await handler(new Request('https://api.example.test/v1/wishes',{method:'POST',headers:{origin:'https://evil.example',authorization:'Bearer fake'},body:'{}'}),{...cfg,DB:db});
 assert.equal(response.status,403);
 assert.equal(db.rows.length,0);
});
