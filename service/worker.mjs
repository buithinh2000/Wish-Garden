// Wish Garden V0.5 — isolated participation API (Cloudflare Worker + D1).
// No personal wish text, name, email, IP, or user ID is requested or stored.
const topics=['peace','family','health','future','remembrance','gratitude'];
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
export function nextBatch(now=new Date()){
 for(let y=now.getUTCFullYear();y<=now.getUTCFullYear()+2;y++)
  for(const m of [2,5,8,11]){
   const day=new Date(Date.UTC(y,m,30,12));
   if(day>now)return {batchId:day.toISOString().slice(0,10),plannedUtc:day.toISOString(),cutoffUtc:new Date(day.getTime()-86400000).toISOString()};
  }
 throw Error('No next batch');
}
export function inputValid(payload){
 return payload&&typeof payload==='object'&&!Array.isArray(payload)&&
 typeof payload.batchId==='string'&&/^\d{4}-(03|06|09|12)-30$/.test(payload.batchId)&&
 Number.isInteger(payload.topic)&&payload.topic>=0&&payload.topic<6&&
 typeof payload.secret==='string'&&/^[a-f0-9]{64}$/.test(payload.secret)&&
 typeof payload.challenge==='string'&&payload.challenge.length>=3&&payload.challenge.length<4096&&
 Object.keys(payload).every(k=>['batchId','topic','secret','challenge'].includes(k));
}
async function receiptHash(batchId,secret){
 const encoded=new TextEncoder().encode('wish-garden-v05:'+batchId+':'+secret);
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoded));
 return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function turnstile(token,secret,ip){
 if(!secret)return false; // fail closed before production
 const body=new URLSearchParams({secret,response:token});
 const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {method:'POST',body,signal:AbortSignal.timeout(5000)});
 if(!result.ok)return false;
 return (await result.json()).success===true;
}
function validOrigin(request,env){
 const origin=request.headers.get('origin');
 return Boolean(origin&&env.ALLOWED_ORIGIN&&origin===env.ALLOWED_ORIGIN);
}
function cors(origin){return {'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET,POST,DELETE,OPTIONS','access-control-allow-headers':'Content-Type','access-control-max-age':'600'};}
async function parseBody(request){
 if(!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('content-type')||''))return null;
 const raw=await request.text();
 if(raw.length>8192)return null;
 try{return JSON.parse(raw)}catch{return null}
}
export async function handle(request,env,now=new Date()){
 if(!env?.DB||!env.ALLOWED_ORIGIN)return json({error:'NOT_CONFIGURED'},503);
 const path=new URL(request.url).pathname;
 const origin=request.headers.get('origin');
 const headers=validOrigin(request,env)?cors(origin):{};
 if(path!=='/api/v1/participation'&&path!=='/api/v1/summary')return json({error:'NOT_FOUND'},404,headers);
 if(request.method==='OPTIONS'){
  if(!validOrigin(request,env))return json({error:'ORIGIN_DENIED'},403);
  return new Response(null,{status:204,headers});
 }
 if(!validOrigin(request,env))return json({error:'ORIGIN_DENIED'},403);
 const batch=nextBatch(now);
 if(path==='/api/v1/summary'&&request.method==='GET'){
  const rows=await env.DB.prepare('SELECT topic, COUNT(*) AS n FROM participation WHERE batch_id=? AND withdrawn_at IS NULL GROUP BY topic').bind(batch.batchId).all();
  const totals=rows.results||[];
  const total=totals.reduce((sum,r)=>sum+Number(r.n),0);
  // Privacy threshold for public count release; never claim distinct humans.
  return json({batchId:batch.batchId,plannedUtc:batch.plannedUtc,cutoffUtc:batch.cutoffUtc,
    status:'PLANNING_NOT_TRANSMITTED',aggregation:'opt-in receipts, not verified unique people',
    submissions:total>=20?total:null,topics:total>=20?Object.fromEntries(totals.filter(r=>Number(r.n)>=5).map(r=>[topics[Number(r.topic)],Number(r.n)])):null,
    privacyThresholdReached:total>=20},200,headers);
 }
 if(!['POST','DELETE'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405,headers);
 if(!env.TURNSTILE_SECRET)return json({error:'CHALLENGE_NOT_CONFIGURED'},503,headers);
 if(now.toISOString()>=batch.cutoffUtc)return json({error:'BATCH_LOCKED'},409,headers);
 const data=await parseBody(request);
 if(!inputValid(data)||data.batchId!==batch.batchId)return json({error:'INVALID_INPUT'},400,headers);
 if(!await turnstile(data.challenge,env.TURNSTILE_SECRET))return json({error:'CHALLENGE_FAILED'},403,headers);
 const hash=await receiptHash(data.batchId,data.secret);
 if(request.method==='POST'){
  const result=await env.DB.prepare('INSERT INTO participation(receipt_hash,batch_id,topic,created_at,withdrawn_at) VALUES(?,?,?,?,NULL) ON CONFLICT(receipt_hash) DO UPDATE SET topic=excluded.topic,withdrawn_at=NULL WHERE participation.batch_id=excluded.batch_id AND participation.withdrawn_at IS NULL').bind(hash,data.batchId,data.topic,now.toISOString()).run();
  if(Number(result.meta?.changes||0)===0)return json({error:'RECEIPT_REVOKED'},409,headers);
  return json({status:'REGISTERED_NOT_TRANSMITTED',batchId:batch.batchId,receiptCode:hash.slice(0,16),
    topic:topics[data.topic],cutoffUtc:batch.cutoffUtc,notice:'Only the selected theme is stored. Your private wish is not submitted or transmitted.'},201,headers);
 }
 const result=await env.DB.prepare('UPDATE participation SET withdrawn_at=? WHERE receipt_hash=? AND batch_id=? AND withdrawn_at IS NULL').bind(now.toISOString(),hash,batch.batchId).run();
 return json({status:'WITHDRAWAL_PROCESSED',batchId:batch.batchId,updated:((result.meta?.changes||0)>0)},200,headers);
}
export default {fetch:(request,env)=>handle(request,env)};
