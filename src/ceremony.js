/* Wish Garden: proof-first ceremony planning, no radio, no server.
   An opt-in here records only this device's *interest*; never submission. */
(function(){
'use strict';
const root=document.getElementById('ceremony');
if(!root)return;
// The planning countdown must be discoverable before opening the prayer panel.
const panel=document.getElementById('prayerPanel');
if(panel?.parentElement)panel.parentElement.insertBefore(root,panel);
const $=id=>document.getElementById(id);
const key='wg-ceremony-interest-01';
const releaseDates=[{month:2,day:30,name:'March'},{month:5,day:30,name:'June'},{month:8,day:30,name:'September'},{month:11,day:30,name:'December'}];
const categories={
 en:['Peace','Family','Health','Future','Remembrance','Gratitude'],
 vi:['Bình an','Gia đình','Sức khỏe','Tương lai','Tưởng nhớ','Biết ơn']
};
function language(){return document.documentElement.lang==='vi'?'vi':'en';}
function upcoming(now=new Date()){
 const options=[];
 for(let y=now.getUTCFullYear();y<=now.getUTCFullYear()+2;y++){
  for(const d of releaseDates){
   const date=new Date(Date.UTC(y,d.month,d.day,12,0,0));
   if(date.getTime()>now.getTime())options.push({date,id:y+'-'+String(d.month+1).padStart(2,'0')+'-'+d.day,name:d.name});
  }
 }
 return options.sort((a,b)=>a.date-b.date)[0];
}
function records(){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&typeof x.batch==='string'&&Number.isInteger(x.topic)&&x.topic>=0&&x.topic<6):[]}catch{return []}}
function save(data){try{localStorage.setItem(key,JSON.stringify(data));return true}catch{return false}}
function label(name){const vi={March:'Tháng Ba',June:'Tháng Sáu',September:'Tháng Chín',December:'Tháng Mười Hai'};return language()==='vi'?vi[name]:name;}
function counter(now=new Date()){
 const event=upcoming(now);
 const delta=Math.max(0,event.date-now),days=Math.floor(delta/86400000),hours=Math.floor(delta/3600000)%24,mins=Math.floor(delta/60000)%60;
 return {event,days,hours,mins};
}

/* Hope Capsule v0.3: truthful, static-site-only public/private journey.
   Never infer provider transmission from a countdown or local preference. */
const journey=document.createElement('section');
journey.id='hopeCapsuleJourney';
journey.setAttribute('aria-label','Hope Capsule journey');
journey.insertAdjacentHTML('beforeend',`
 <div class="hc-tabs" role="group" aria-label="Choose capsule view">
   <button type="button" id="hcPublic" aria-pressed="true"></button>
   <button type="button" id="hcMine" aria-pressed="false"></button>
 </div>
 <div class="hc-body">
  <div class="hc-tag" id="hcTag"></div>
  <h3 id="hcTitle"></h3>
  <p id="hcMessage"></p>
  <ol class="hc-timeline" id="hcTimeline"></ol>
  <div class="hc-personal-actions" id="hcActions" hidden><button type="button" id="hcSaveReceipt"></button><button type="button" id="hcSaveCalendar"></button></div>
  <p id="hcHistory"></p>
  <p class="hc-foot" id="hcFoot"></p>
 </div>`);
root.append(journey);
const style=document.createElement('style');
style.textContent=`
 #hopeCapsuleJourney{margin-top:25px;border:1px solid #d9c49b66;border-radius:22px;overflow:hidden;background:linear-gradient(140deg,#182b44,#192139)}
 #hopeCapsuleJourney .hc-tabs{display:flex;padding:8px;gap:8px;border-bottom:1px solid #ffffff1c}
 #hopeCapsuleJourney .hc-tabs button{flex:1;border-radius:12px;padding:11px 8px;background:#ffffff12;color:#e8e5e4;border:1px solid #ffffff2b;font:inherit;font-size:14px}
 #hopeCapsuleJourney .hc-tabs button[aria-pressed=true]{background:#f0dfbc;color:#242738;border-color:#f0dfbc;font-weight:650}
 #hopeCapsuleJourney .hc-tabs button:focus-visible{outline:3px solid #fff;outline-offset:2px}
 #hopeCapsuleJourney .hc-body{padding:21px 22px}
 #hopeCapsuleJourney .hc-tag{letter-spacing:.15em;font-size:11px;color:#e5ca94;text-transform:uppercase}
 #hopeCapsuleJourney h3{margin:9px 0 8px;font:normal 26px Georgia,serif;color:#f6e9ce}
 #hopeCapsuleJourney p{font-size:14px;line-height:1.6;color:#dbd9e4}
 #hopeCapsuleJourney .hc-timeline{list-style:none;padding:3px 0 0;margin:12px 0}
 #hopeCapsuleJourney .hc-timeline li{position:relative;padding:0 0 19px 32px;border-left:1px solid #9e99b46b;margin-left:8px;font-size:14px;color:#dbd9e4}
 #hopeCapsuleJourney .hc-timeline li:last-child{border-left-color:transparent;padding-bottom:0}
 #hopeCapsuleJourney .hc-timeline li:before{content:'';position:absolute;left:-7px;top:3px;width:12px;height:12px;border-radius:50%;background:#67748d;border:1px solid #fff5d490}
 #hopeCapsuleJourney .hc-timeline li.hc-local:before{background:#dec389}
 #hopeCapsuleJourney .hc-timeline strong{display:block;color:#fff2db;font-weight:600}
 #hopeCapsuleJourney .hc-timeline span{display:block;color:#bdc3d6;font-size:12px}
 #hopeCapsuleJourney .hc-personal-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
 #hopeCapsuleJourney .hc-personal-actions[hidden]{display:none}
 #hopeCapsuleJourney .hc-personal-actions button{background:#ffffff17;color:#f6e9ce;border:1px solid #f6e9ce55;border-radius:12px;padding:9px 11px;font:inherit;font-size:13px}
 #hopeCapsuleJourney .hc-personal-actions button:focus-visible{outline:3px solid #fff;outline-offset:2px}
 #hopeCapsuleJourney .hc-foot{padding-top:12px;border-top:1px solid #ffffff24;font-size:12px;color:#b7bbc9}
 @media(max-width:430px){#hopeCapsuleJourney .hc-body{padding:17px 15px}#hopeCapsuleJourney h3{font-size:22px}}
`;
document.head.append(style);
let capsuleView='public';
const $hc=id=>document.getElementById(id);
function renderJourney(){
 const vi=language()==='vi',mine=capsuleView==='mine',event=upcoming();
 const local=records().filter(x=>x.batch===event.id);
 const categoriesHere=categories[language()];
 $hc('hcPublic').textContent=vi?'Gói chung':'Public capsule';
 $hc('hcMine').textContent=vi?'Hành trình của tôi':'My journey';
 $hc('hcPublic').setAttribute('aria-pressed',String(!mine));
 $hc('hcMine').setAttribute('aria-pressed',String(mine));
 $hc('hcTag').textContent=vi?'HY VỌNG · CHƯA PHÁT SÓNG':'HOPE CAPSULE · NOT TRANSMITTED';
 $hc('hcTitle').textContent=mine?(vi?'Ngôi sao của tôi':'My hope journey'):(vi?'Gói hy vọng của Trái Đất':'Earth Hope Capsule');
 $hc('hcMessage').textContent=mine
  ?(local.length?(vi?'Trên thiết bị này, bạn đã chọn: ':'On this device, you marked: ')+local.map(x=>categoriesHere[x.topic]).join(', ')+'.':(vi?'Chưa có lựa chọn nào được lưu cho đợt này trên thiết bị.':'No topic marked on this device for this ceremony.'))
  :(vi?'Thông điệp chung dự kiến sẽ được đóng gói sau khi có hệ thống đồng ý tham gia và xác nhận số liệu thật. Chưa có số người tham gia đã xác minh.':'The public message will be packaged only after real opt-ins and verified totals exist. There is no verified community participation count.');
 const items=mine?[
  [vi?'Lựa chọn trên thiết bị':'Local interest',local.length?(vi?'Đã lưu cục bộ · chưa gửi':'Stored locally · not submitted'):(vi?'Chưa chọn':'Not selected'),local.length],
  [vi?'Đăng ký tham gia gói chung':'Global batch opt-in',vi?'Chưa mở · cần đồng ý riêng':'Not available · requires fresh consent',false],
  [vi?'Chốt gói và biên nhận':'Batch lock & inclusion receipt',vi?'Chưa thực hiện':'Not performed',false],
  [vi?'Trạm phát và bằng chứng':'Station issuance & proof',vi?'Chưa xác minh':'Not verified',false]
 ]:[
  [vi?'Mốc nghi thức':'Ceremony target',event.date.toLocaleString(vi?'vi-VN':'en-AU',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' UTC · '+(vi?'dự kiến':'proposed'),true],
  [vi?'Đóng gói thông điệp':'Message packaging',vi?'Chưa khóa nội dung':'No packet locked',false],
  [vi?'Gửi đến nhà vận hành':'Operator submission',vi?'Chưa gửi yêu cầu':'No request submitted',false],
  [vi?'Trạm phát xác nhận':'Station evidence',vi?'Chưa có hồ sơ phát':'No issuance record',false]
 ];
 $hc('hcTimeline').replaceChildren(...items.map(([title,desc,isLocal])=>{
  const li=document.createElement('li');if(isLocal)li.className='hc-local';
  const strong=document.createElement('strong'),span=document.createElement('span');
  strong.textContent=title;span.textContent=desc;li.append(strong,span);return li;
 }));
 const past=records().filter(x=>x.batch!==event.id);
 $hc('hcHistory').textContent=mine&&past.length
   ?(vi?'Các lựa chọn trên thiết bị từ những đợt khác: ':'Past local interests on this device: ')+past.length+'. '+(vi?'Không phải hồ sơ phát sóng.':'Not broadcast receipts.')
   :'';
 $hc('hcActions').hidden=!mine;
 $hc('hcSaveReceipt').textContent=vi?'Xuất ghi nhận cục bộ (JSON)':'Export local record (JSON)';
 $hc('hcSaveCalendar').textContent=vi?'Thêm mốc dự kiến vào lịch':'Add proposed date to calendar';
 $hc('hcSaveReceipt').disabled=!local.length;
 $hc('hcFoot').textContent=mine
  ?(vi?'Lời nguyện riêng không nằm trong gói tín hiệu. Lựa chọn trên thiết bị chưa phải đăng ký phát sóng.':'Your private wish is never included in a radio packet. Local interest is not broadcast registration.')
  :(vi?'Mốc ngày không bảo đảm giờ phát. Không có hoạt cảnh hay đồng hồ nào chứng minh đã phát sóng.':'The proposed date is not an RF timeslot. No animation or countdown is evidence of a real transmission.');
}
// These downloads contain only this browser's minimal local choices, never a station receipt.
function downloadText(name,contents,type){
 const url=URL.createObjectURL(new Blob([contents],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$hc('hcSaveReceipt').addEventListener('click',()=>{
 const batch=upcoming().id,local=records().filter(x=>x.batch===batch);
 if(!local.length)return;
 const payload={version:1,kind:'local-interest-only',broadcastVerified:false,operatorReceipt:false,
   submittedToServer:false,batch,topics:local.map(x=>({topic:categories.en[x.topic],markedAt:x.at}))};
 downloadText('wish-garden-local-'+batch+'.json',JSON.stringify(payload,null,2),'application/json');
});
$hc('hcSaveCalendar').addEventListener('click',()=>{
 const event=upcoming();
 const timestamp=event.date.toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}/,'');
 const uid='wish-garden-planning-'+event.id+'@local.invalid';
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wish Garden//Hope Capsule Planning//EN',
  'BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+timestamp,'DTSTART:'+timestamp,
  'SUMMARY:Wish Garden - proposed ceremony milestone',
  'DESCRIPTION:Planning reminder only. No station booking or real transmission confirmed.',
  'END:VEVENT','END:VCALENDAR'];
 downloadText('wish-garden-plan-'+event.id+'.ics',lines.join('\\r\\n')+'\\r\\n','text/calendar');
});
$hc('hcPublic').addEventListener('click',()=>{capsuleView='public';renderJourney();});
$hc('hcMine').addEventListener('click',()=>{capsuleView='mine';renderJourney();});

function render(){
 const vi=language()==='vi',c=counter(),event=c.event;
 $('ceremonyHeading').textContent=vi?'Nghi thức gửi hy vọng':'A ceremony for our hopes';
 $('ceremonyIntro').textContent=vi?'Bốn mốc dự kiến mỗi năm (mỗi ba tháng). Một đợt chỉ được gọi là phát sóng thật khi có xác nhận và bằng chứng từ trạm phát.':'Four proposed quarterly milestones each year. A transmission is only real after an authorised station confirms it with evidence.';
 $('ceremonyEvent').textContent=label(event.name)+' · '+event.date.toLocaleDateString(vi?'vi-VN':'en-AU',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
 $('ceremonyCountdown').textContent=String(c.days).padStart(2,'0')+' : '+String(c.hours).padStart(2,'0')+' : '+String(c.mins).padStart(2,'0');
 $('ceremonyUnits').textContent=vi?'ngày · giờ · phút':'days · hours · minutes';
 $('ceremonyStatus').textContent=vi?'MỐC DỰ KIẾN · CHƯA XÁC NHẬN PHÁT SÓNG':'PROPOSED DATE · NO TRANSMISSION CONFIRMED';
 $('ceremonyTruth').textContent=vi?'Đây là đồng hồ đến mốc lên kế hoạch, không phải giờ phát đã được nhà đài xác nhận. Không có thông điệp nào đã được gửi qua vệ tinh hoặc anten.':'This counts down to a planning target, not an operator-confirmed broadcast. No wish has been sent via satellite or antenna.';
 $('ceremonyConsentLabel').textContent=vi?'Tôi muốn đóng góp một chủ đề vào đợt dự kiến. Chỉ lưu sự quan tâm trên thiết bị này; không gửi lời nguyện, tên hoặc dữ liệu ra ngoài. Khi có kết nối thật, tôi phải đồng ý lại.':'I want to mark one topic for a proposed ceremony. Interest stays on this device; no wish text, name or data leaves this browser. Real transmission would require fresh consent.';
 $('ceremonyJoin').textContent=vi?'Ghi nhận mong muốn trên thiết bị':'Mark interest on this device';
 $('ceremonyClear').textContent=vi?'Xóa những lựa chọn này':'Clear local interest';
 $('ceremonyArchiveTitle').textContent=vi?'Hồ sơ truyền tín hiệu':'Transmission record';
 $('ceremonyArchive').textContent=vi?'Chưa có đợt phát sóng được xác minh. Khi có: phải công bố nhà vận hành, giờ UTC và bằng chứng phát thực tế.':'No transmissions verified yet. Any future record must identify the operator, UTC time and actual transmission evidence.';
 $('ceremonyContribution').textContent=vi?'Trên thiết bị này: '+records().filter(x=>x.batch===event.id).length+' chủ đề đã ghi nhận. Không phải số liệu cộng đồng.':'On this device: '+records().filter(x=>x.batch===event.id).length+' topic(s) marked. Not a community total.';
 renderJourney();
 const select=$('ceremonyTopic'),v=select.value;
 [...select.options].forEach((o,i)=>o.textContent=categories[language()][i]);select.value=v;
}
$('ceremonyJoin').addEventListener('click',()=>{
 const topic=Number($('ceremonyTopic').value),batch=upcoming().id;
 if(!Number.isInteger(topic)||topic<0||topic>5)return;
 const data=records();
 // One local expression of interest per topic and planning period. No prose stored.
 if(!data.some(x=>x.batch===batch&&x.topic===topic))data.push({id:'interest-'+batch+'-'+topic,batch,topic,at:new Date().toISOString()});
 const saved=save(data);
 $('ceremonyFeedback').textContent=saved
  ?(language()==='vi'?'Đã ghi nhận trên thiết bị — CHƯA gửi ra không gian.':'Saved on this device — NOT transmitted to space.')
  :(language()==='vi'?'Không thể lưu vào trình duyệt này.':'Could not save in this browser.');
 render();
});
$('ceremonyClear').addEventListener('click',()=>{
 try{localStorage.removeItem(key);$('ceremonyFeedback').textContent=language()==='vi'?'Đã xóa ghi nhận trên thiết bị.':'Local interest cleared.'}
 catch{$('ceremonyFeedback').textContent=language()==='vi'?'Không thể xóa dữ liệu.':'Could not clear browser storage.'}
 render();
});
let interval=0;
function updateClock(){
 if(root.isConnected){
  const c=counter();
  $('ceremonyCountdown').textContent=String(c.days).padStart(2,'0')+' : '+String(c.hours).padStart(2,'0')+' : '+String(c.mins).padStart(2,'0');
  if($('ceremonyEvent').dataset.batch!==c.event.id){$('ceremonyEvent').dataset.batch=c.event.id;render();}
 }else if(interval)clearInterval(interval);
}
render();$('ceremonyEvent').dataset.batch=upcoming().id;
interval=setInterval(updateClock,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();updateClock();}});
window.WishCeremony={refreshLanguage:render,getPlan(){return counter();},getLocalInterest(){return records();}};
})();
