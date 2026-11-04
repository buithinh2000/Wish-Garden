/* Wish Garden V0.4: public project-only RF draft, never a sent receipt.
   Intentionally contains no localStorage, wish access or provider requests. */
export const DEFAULT_PHRASE='WISH GARDEN | PEACE, FAMILY, HEALTH AND HOPE FROM EARTH';
export function planFor(now=new Date()){
 const days=[[2,30],[5,30],[8,30],[11,30]];
 for(let year=now.getUTCFullYear();year<=now.getUTCFullYear()+2;year++){
  for(const [month,day] of days){
   const when=new Date(Date.UTC(year,month,day,12));
   if(when>now)return {id:when.toISOString().slice(0,10),proposedUtc:when.toISOString()};
  }
 }
 throw Error('No future ceremony');
}
export function draftPacket(now=new Date(),phrase=DEFAULT_PHRASE){
 const text=phrase.trim();
 if(!text||[...text].length>140||/[\r\n]/.test(text))throw Error('Invalid project-only phrase');
 const plan=planFor(now);
 return {schema:'wish-garden-public-packet-v1',batchId:plan.id,proposedUtc:plan.proposedUtc,
  message:text,source:'project-owned-public-phrase-only',participantCount:null,
  consentedParticipantDataIncluded:false,operator:'UNASSIGNED',providerRequestId:null,
  actualBroadcastUtc:null,operatorEvidenceUrl:null,status:'DRAFT_NOT_SUBMITTED'};
}
export async function sha256Hex(text){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function manifest(now=new Date()){
 const draft=draftPacket(now);
 return {...draft,messageSha256:await sha256Hex(draft.message),
  notice:'This is a local, unsigned draft. No radio emission or user participation is represented.'};
}
function download(data,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function mountPacketPreview(root=document.getElementById('ceremony')){
 if(!root)return;
 const box=document.createElement('section');
 box.id='hopePacketPreview';
 box.setAttribute('aria-label','Public draft signal package');
 box.style.cssText='margin-top:18px;padding:18px;border:1px solid #b5ab9666;border-radius:18px;background:#152439;color:#f7e9ce';
 const title=document.createElement('h3'),intro=document.createElement('p'),phrase=document.createElement('p'),
  hash=document.createElement('p'),status=document.createElement('p'),button=document.createElement('button');
 title.style.cssText='font:normal 24px Georgia,serif;margin:0 0 8px';
 phrase.style.cssText='font-family:ui-monospace,monospace;overflow-wrap:anywhere;color:#f4d9a0;font-size:13px';
 hash.style.cssText='font-family:ui-monospace,monospace;overflow-wrap:anywhere;font-size:11px;color:#cbd3e5';
 status.style.cssText='font-size:13px;color:#e6c89b';
 button.type='button';button.style.cssText='padding:10px 14px;border-radius:12px;border:1px solid #e6c89b;background:transparent;color:#f7e9ce';
 box.append(title,intro,phrase,hash,status,button);root.append(box);
 const data=await manifest();
 // Only project-authored text is hashed: never local participants or their wishes.
 function paint(){
  const vi=document.documentElement.lang==='vi';
  title.textContent=vi?'Gói tín hiệu chung · bản nháp':'Public signal package · draft';
  intro.textContent=vi?'Gói minh họa dùng câu chữ của dự án, chưa tổng hợp người tham gia. Giới hạn 140 ký tự.':'Project-owned sample phrase only; no participant data. 140-character limit.';
  phrase.textContent=data.message;
  hash.textContent='SHA-256: '+data.messageSha256;
  status.textContent=vi?'CHƯA GỬI · Không có xác nhận phát sóng':'NOT SUBMITTED · No station evidence';
  button.textContent=vi?'Xuất bản nháp để kiểm tra':'Export draft manifest';
 }
 button.addEventListener('click',()=>download(data,'wish-garden-draft-'+data.batchId+'.json'));
 paint();
 document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(paint));
 window.WishPacketPreview={getDraft:()=>({...data}),refreshLanguage:paint};
}
if(typeof document!=='undefined')mountPacketPreview().catch(()=>{
 const root=document.getElementById('ceremony');if(!root)return;
 const p=document.createElement('p');p.textContent='Public packet preview unavailable; no signal has been submitted.';root.append(p);
});
