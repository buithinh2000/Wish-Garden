/* Wish Garden: proof-first ceremony planning, no radio, no server.
   An opt-in here records only this device's *interest*; never submission. */
(function(){
'use strict';
const root=document.getElementById('ceremony');
if(!root)return;
const $=id=>document.getElementById(id);
const key='wg-ceremony-interest-01';
const releaseDates=[{month:5,day:30,name:'Mid-Year'},{month:11,day:30,name:'Year-End'}];
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
function label(name){return language()==='vi'?(name==='Mid-Year'?'Giữa năm':'Cuối năm'):name;}
function counter(now=new Date()){
 const event=upcoming(now);
 const delta=Math.max(0,event.date-now),days=Math.floor(delta/86400000),hours=Math.floor(delta/3600000)%24,mins=Math.floor(delta/60000)%60;
 return {event,days,hours,mins};
}
function render(){
 const vi=language()==='vi',c=counter(),event=c.event;
 $('ceremonyHeading').textContent=vi?'Nghi thức gửi hy vọng':'A ceremony for our hopes';
 $('ceremonyIntro').textContent=vi?'Hai cột mốc dự kiến mỗi năm. Chỉ khi có trạm phát xác nhận và bằng chứng, một đợt mới được gọi là đã gửi thật.':'Two proposed milestones each year. A transmission is only real after an authorised station confirms it with evidence.';
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
