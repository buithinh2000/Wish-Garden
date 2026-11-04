/* V0.5: consented theme registration. Disabled until a real, audited API and
   Cloudflare Turnstile site key are explicitly configured by the operator. */
const publicConfig=window.WG_PUBLIC_CONFIG||{};
const cfg={api:String(publicConfig.api||'').replace(/\/$/,''),sitekey:String(publicConfig.sitekey||'')};
const root=document.getElementById('ceremony');
if(root){
 const section=document.createElement('section');section.id='hopeParticipation';
 section.style.cssText='margin-top:18px;padding:18px;border:1px solid #baa8806b;border-radius:16px;background:#17283d;color:#f9ebd2';
 const heading=document.createElement('h3'),explain=document.createElement('p'),checkLabel=document.createElement('label'),checkbox=document.createElement('input'),
  topic=document.createElement('select'),widget=document.createElement('div'),join=document.createElement('button'),withdraw=document.createElement('button'),
  feedback=document.createElement('p'),receipt=document.createElement('p');
 heading.style.cssText='font:normal 24px Georgia,serif;margin:0 0 10px';
 checkbox.type='checkbox';checkLabel.append(checkbox);
 checkLabel.style.cssText='display:block;margin:12px 0;font-size:14px';
 topic.style.cssText='display:block;width:100%;max-width:300px;padding:10px;margin:10px 0;background:#263a51;color:#fff;border:1px solid #e8cc9d';
 for(let i=0;i<6;i++){const opt=document.createElement('option');opt.value=String(i);topic.append(opt)}
 join.type='button';withdraw.type='button';
 for(const b of [join,withdraw])b.style.cssText='padding:10px 12px;margin:6px 6px 6px 0;background:#f1dfb7;border:0;border-radius:10px;color:#233047;font:inherit';
 feedback.setAttribute('role','status');receipt.style.cssText='font-size:12px;overflow-wrap:anywhere';
 section.append(heading,explain,topic,checkLabel,widget,join,withdraw,feedback,receipt);root.append(section);
 const key='wg-private-receipt-v05';
 const topicLabels={en:['Peace','Family','Health','Future','Remembrance','Gratitude'],vi:['Bình an','Gia đình','Sức khỏe','Tương lai','Tưởng nhớ','Biết ơn']};
 let challengeId=null,challengeReady=false,challengeScriptRequested=false;
 function activeBatch(){return window.WishCeremony?.getPlan()?.event?.id||null}
 function oldReceipt(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
 function currentReceipt(){const r=oldReceipt();return r&&r.batchId===activeBatch()?r:null}
 function freshSecret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('')}
 function configured(){return Boolean(cfg.api&&cfg.sitekey&&/^https:\/\//.test(cfg.api))}
 function paint(){
  const vi=document.documentElement.lang==='vi',saved=currentReceipt();
  heading.textContent=vi?'Đăng ký đóng góp chủ đề':'Contribute a theme';
  explain.textContent=vi?'Lời nguyện của bạn không được gửi đi. Sau khi dịch vụ được kích hoạt, chỉ chủ đề đã chọn được ghi nhận bằng một mã riêng.':'Your private wish is never uploaded. Once the verified service is enabled, only your chosen theme can be registered under a private code.';
  checkLabel.lastChild?.nodeType===3&&(checkLabel.lastChild.textContent='');
  checkLabel.append(document.createTextNode(vi?' Tôi chọn xác minh với Cloudflare để đăng ký hoặc rút lại một chủ đề; không gửi lời nguyện riêng.':' I choose Cloudflare verification to register or withdraw a theme; never my private wish.'));
  for(const [i,o] of [...topic.options].entries())o.textContent=topicLabels[vi?'vi':'en'][i];
  join.textContent=vi?'Ghi nhận vào gói chung':'Register theme';withdraw.textContent=vi?'Rút lại':'Withdraw';
  join.disabled=!configured()||!challengeReady||!checkbox.checked;
  withdraw.disabled=!configured()||!challengeReady||!saved;
  receipt.textContent=saved?(vi?'Mã biên nhận riêng: ':'Private receipt: ')+saved.code+' · '+(vi?'Đã ghi nhận, chưa phát sóng':'Registered, not transmitted'):'';
  if(!configured())feedback.textContent=vi?'Dịch vụ ghi nhận toàn cầu chưa được kích hoạt. Bạn vẫn có thể sử dụng khu vườn và gói nháp cục bộ.':'Global registration is not active yet. The private garden and local draft remain available.';
 }
 async function submit(method){
  if(!configured()||!challengeReady||!checkbox.checked&&method==='POST')return;
  const token=window.turnstile?.getResponse(challengeId);
  if(!token){feedback.textContent='Complete verification first';return}
  const prior=currentReceipt(),secret=prior?.secret||freshSecret(),batchId=activeBatch();
  // Secrets are retained only in this browser. Never embedded into public capsule.
  const res=await fetch(cfg.api+'/api/v1/participation',{method,headers:{'Content-Type':'application/json'},
   body:JSON.stringify({batchId,topic:Number(topic.value),secret,challenge:token})});
  const result=await res.json();
  if(!res.ok){feedback.textContent=result.error||'Request failed';window.turnstile?.reset(challengeId);challengeReady=false;paint();return}
  if(method==='POST'){
   try{localStorage.setItem(key,JSON.stringify({batchId,secret,code:result.receiptCode,topic:Number(topic.value)}))}
   catch{feedback.textContent='Registered, but your browser could not keep the recovery code. Contact support to discuss options.'}
  }else try{localStorage.removeItem(key)}catch{}
  feedback.textContent=method==='POST'?'Registered in the pending batch. No radio transmission has occurred.':'Withdrawal processed.';
  window.turnstile?.reset(challengeId);challengeReady=false;paint();
 }
 checkbox.addEventListener('change',()=>{if(checkbox.checked)loadChallengeOnConsent();paint()});
 join.addEventListener('click',()=>submit('POST').catch(()=>{feedback.textContent='Network unavailable; nothing confirmed.'}));
 withdraw.addEventListener('click',()=>submit('DELETE').catch(()=>{feedback.textContent='Network unavailable; withdrawal not confirmed.'}));
 document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(paint));
 // Do not request third-party CAPTCHA until configuration is real.
 function loadChallengeOnConsent(){
  if(!configured()||!checkbox.checked||challengeScriptRequested)return;
  challengeScriptRequested=true;
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.onload=()=>{challengeId=window.turnstile.render(widget,{sitekey:cfg.sitekey,callback:()=>{challengeReady=true;paint()},'expired-callback':()=>{challengeReady=false;paint()}})};
  script.onerror=()=>{challengeScriptRequested=false;feedback.textContent='Verification could not load';paint()};
  document.head.append(script);
 }
 paint();
}
