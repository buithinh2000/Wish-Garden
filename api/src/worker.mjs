// Wish Garden v0.2 — private backend candidate. NEVER enabled on the public preview by default.
const TOPICS = new Set(['peace', 'family', 'health', 'future', 'remember', 'gratitude']);
const STATES = new Set(['ongoing', 'fulfilled', 'released']);
const encoder = new TextEncoder();
export const json = (value, status=200, extra={}) => new Response(JSON.stringify(value), {
  status, headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}
});
export function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid token encoding');
  const str=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(str, x=>x.charCodeAt(0));
}
function parsePart(value) { return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))); }
export async function verifyToken(header, env, fetcher=fetch) {
  if (!env.AUTH_ISSUER || !env.AUTH_AUDIENCE || !env.AUTH_JWKS_URL) throw new Error('auth_not_configured');
  if (!env.AUTH_JWKS_URL.startsWith('https://')) throw new Error('unsafe_jwks_url');
  const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(header||'');
  if (!match || match[1].length>8192) throw new Error('unauthorized');
  const parts=match[1].split('.');
  if(parts.length!==3) throw new Error('unauthorized');
  const head=parsePart(parts[0]),body=parsePart(parts[1]);
  if(head.alg!=='RS256' || typeof head.kid!=='string' || head.kid.length>128) throw new Error('unauthorized');
  const now=Math.floor(Date.now()/1000);
  if(body.iss!==env.AUTH_ISSUER || !(body.aud===env.AUTH_AUDIENCE || Array.isArray(body.aud)&&body.aud.includes(env.AUTH_AUDIENCE))
    || typeof body.sub!=='string' || !body.sub || body.sub.length>200
    || typeof body.exp!=='number' || body.exp<=now
    || typeof body.iat!=='number' || body.iat>now+60
    || (body.nbf!==undefined && (typeof body.nbf!=='number'||body.nbf>now+60))) throw new Error('unauthorized');
  const response=await fetcher(env.AUTH_JWKS_URL,{headers:{accept:'application/json'}});
  if(!response.ok) throw new Error('auth_keys_unavailable');
  const data=await response.json();
  const jwk=Array.isArray(data.keys)?data.keys.find(k=>k.kid===head.kid&&k.kty==='RSA'&&(k.use===undefined||k.use==='sig')&&(!k.alg||k.alg==='RS256')):null;
  if(!jwk) throw new Error('unauthorized');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeBase64Url(parts[2]),encoder.encode(parts[0]+'.'+parts[1]));
  if(!valid) throw new Error('unauthorized');
  return body.sub;
}
export function checkWish(input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) return null;
  if(!TOPICS.has(input.topic)||typeof input.body!=='string') return null;
  const body=input.body.trim();
  if(body.length<1||body.length>700) return null;
  return {topic:input.topic,body};
}
function responseHeaders(request,env) {
  const allowed=env.ALLOW_ORIGIN;
  const origin=request.headers.get('origin');
  if(!allowed||origin!==allowed) return {};
  return {'access-control-allow-origin':allowed,'vary':'Origin','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'};
}
async function payload(request) {
  const body=await request.text();
  if(body.length>3500) return null;
  try{return JSON.parse(body)}catch{return null}
}
function ensureDatabase(env) {if(!env.DB) throw new Error('database_not_configured');}
async function quota(env,owner) {
  const hour=new Date().toISOString().slice(0,13);
  const r=await env.DB.prepare('INSERT INTO write_quotas (owner_sub,hour_bucket,counter) VALUES (?,?,1) ON CONFLICT(owner_sub,hour_bucket) DO UPDATE SET counter=counter+1 WHERE counter < 10').bind(owner,hour).run();
  return (r.meta?.changes||0)>0;
}
export async function handler(request,env,ctx={}) {
  const headers=responseHeaders(request,env);
  const reply=(v,status=200)=>json(v,status,headers);
  const path=new URL(request.url).pathname,method=request.method;
  if(method==='OPTIONS'){
    return Object.keys(headers).length?new Response(null,{status:204,headers}):reply({error:'origin_denied'},403);
  }
  if(method==='GET'&&path==='/health')return reply({status:'up',service:'wish-garden-private-api',production_ready:false});
  if(!env.ALLOW_ORIGIN || request.headers.get('origin')!==env.ALLOW_ORIGIN) return reply({error:'origin_denied'},403);
  try {
    ensureDatabase(env);
    const owner=await verifyToken(request.headers.get('authorization'),env);
    if(method==='POST'&&path==='/v1/wishes'){
      const wish=checkWish(await payload(request));
      if(!wish)return reply({error:'invalid_wish'},400);
      if(!(await quota(env,owner)))return reply({error:'rate_limited'},429);
      const now=new Date().toISOString(),id=crypto.randomUUID();
      await env.DB.prepare('INSERT INTO wishes (id,owner_sub,topic,body,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(id,owner,wish.topic,wish.body,now,now).run();
      return reply({id,topic:wish.topic,state:'ongoing',aggregate_opt_in:false,created_at:now},201);
    }
    if(method==='GET'&&path==='/v1/wishes'){
      const rows=await env.DB.prepare('SELECT id,topic,body,state,aggregate_opt_in,created_at,updated_at FROM wishes WHERE owner_sub=? ORDER BY created_at DESC LIMIT 100').bind(owner).all();
      return reply({wishes:(rows.results||[]).map(x=>({...x,aggregate_opt_in:!!x.aggregate_opt_in}))});
    }
    const wishMatch=/^\/v1\/wishes\/([0-9a-f-]{36})$/.exec(path);
    if(wishMatch&&method==='DELETE'){
      const result=await env.DB.prepare('DELETE FROM wishes WHERE id=? AND owner_sub=?').bind(wishMatch[1],owner).run();
      return reply({deleted:(result.meta?.changes||0)>0});
    }
    if(wishMatch&&method==='PATCH'){
      const input=await payload(request);
      if(!input||!STATES.has(input.state)||typeof input.aggregate_opt_in!=='boolean')return reply({error:'invalid_update'},400);
      if(!(await quota(env,owner)))return reply({error:'rate_limited'},429);
      const result=await env.DB.prepare('UPDATE wishes SET state=?,aggregate_opt_in=?,updated_at=? WHERE id=? AND owner_sub=?').bind(input.state,input.aggregate_opt_in?1:0,new Date().toISOString(),wishMatch[1],owner).run();
      if(!(result.meta?.changes>0))return reply({error:'not_found'},404);
      return reply({updated:true,aggregate_opt_in:input.aggregate_opt_in});
    }
    if(method==='GET'&&path==='/v1/collective-hope'){
      // Never return individual wish text; strict opt-in and k-anonymity threshold.
      if(env.FEATURE_COLLECTIVE_HOPE!=='true')return reply({error:'not_enabled'},404);
      const result=await env.DB.prepare("SELECT topic,COUNT(DISTINCT owner_sub) AS people FROM wishes WHERE aggregate_opt_in=1 AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days') GROUP BY topic HAVING COUNT(DISTINCT owner_sub) >= 20").all();
      return reply({window:'past_30_days',topics:(result.results||[]).map(x=>({topic:x.topic,people:x.people})),method:'opt_in_unique_accounts_min_20'});
    }
    return reply({error:'not_found'},404);
  }catch(e){
    if(e.message==='unauthorized')return reply({error:'unauthorized'},401);
    if(e.message==='auth_not_configured'||e.message==='database_not_configured'||e.message==='unsafe_jwks_url'||e.message==='auth_keys_unavailable')return reply({error:'service_unavailable'},503);
    return reply({error:'internal_error'},500);
  }
}
export default {fetch:handler};
