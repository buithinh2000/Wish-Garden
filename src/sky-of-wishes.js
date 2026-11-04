/* Wish Garden V0.2P: a private sky, not a public community feed.
   Visible stars represent only wishes saved on this browser and this session. */
(function(){
'use strict';
const sky=document.getElementById('sky');
const field=document.getElementById('starField');
const flare=document.getElementById('skyFlare');
const card=document.getElementById('starMemory');
const cardDate=document.getElementById('starMemoryDate');
const cardText=document.getElementById('starMemoryText');
const cardTopic=document.getElementById('starMemoryTopic');
const cardClose=document.getElementById('starMemoryClose');
const skyHint=document.getElementById('skyHint');
const storageKey='wg-preview-local-01';
if(!sky||!field||!flare||!card)return;
let current=null,starTimer=null,session=[],language='en',lastFocus=null,finishedStar=null;
const palettes=['#b7e6ff','#f9d8a2','#9de7da','#c6c6ff','#e8c7ff','#f6e1b6'];
const topics={
 en:['Peace','Family and loved ones','Health','Hope for the future','Remembrance','Gratitude'],
 vi:['Bình an','Gia đình và người thân','Sức khỏe','Hy vọng tương lai','Tưởng nhớ','Biết ơn']
};
function stored(){try{const x=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function hash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function keyOf(w,i){return String(w.id||'legacy-'+hash(String(w.date||'')+'|'+String(w.text||'')+'|'+i))}
function position(w,i){const seed=hash(keyOf(w,i));return {x:14+(seed%73),y:22+(Math.floor(seed/89)%52)}}
function normalize(w,i,saved){const p=position(w,i);return {id:keyOf(w,i),text:String(w.text||''),date:String(w.date||''),topic:Number(w.topic)||0,x:Number.isFinite(+w.starX)?Math.max(10,Math.min(90,+w.starX)):p.x,y:Number.isFinite(+w.starY)?Math.max(15,Math.min(78,+w.starY)):p.y,saved:!!saved};}
function wishes(){const list=stored().map((x,i)=>normalize(x,i,true));const ids=new Set(list.map(x=>x.id));session=session.filter(x=>!x.saved&&!ids.has(x.id));return list.concat(session);}
function resetFlare(){if(starTimer!==null){clearTimeout(starTimer);starTimer=null}flare.classList.remove('launch','burst','settle');flare.hidden=true;}
function draw(excludeId){
 field.replaceChildren();
 for(const w of wishes()){
   if(w.id===excludeId)continue;
   const button=document.createElement('button');
   button.type='button';button.className='memory-star';
   button.style.left=w.x+'%';button.style.top=w.y+'%';
   button.style.setProperty('--star-delay',String((hash(w.id)%3000)/1000)+'s');
   button.style.setProperty('--star-color',palettes[Math.max(0,Math.min(5,w.topic))]);
   button.dataset.starId=w.id;
   button.setAttribute('aria-label',w.saved?(language==='vi'?'Xem lời nguyện riêng đã lưu':'View your saved private wish'):(language==='vi'?'Xem lời nguyện vừa gửi':'View the wish from this visit'));
   button.title=language==='vi'?'Mở lời nguyện của bạn':'Open your own wish';
   button.addEventListener('click',()=>open(w,button));
   field.append(button);
 }
 field.append(flare); // Light and stars share one responsive coordinate plane.
 skyHint.textContent=language==='vi'
  ?'Những ngôi sao riêng của bạn trên thiết bị này. Chạm để xem lại.'
  :'Only your own stars on this device. Tap a star to revisit.';
}
function open(w,trigger){
 lastFocus=trigger;
 cardTopic.textContent=topics[language][Math.max(0,Math.min(5,w.topic))];
 cardDate.textContent=w.date?new Date(w.date).toLocaleDateString(language==='vi'?'vi-VN':'en-AU',{day:'numeric',month:'long',year:'numeric'}):'';
 cardText.textContent=w.text; // Never inject user wishes as markup.
 card.querySelector('[data-memory-heading]').textContent=language==='vi'?'Lời nguyện của tôi':'My private wish';
 cardClose.textContent=language==='vi'?'Đóng':'Close';
 card.hidden=false;cardClose.focus();
}
function closeCard(){card.hidden=true;if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;}
cardClose.addEventListener('click',closeCard);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden){e.stopImmediatePropagation();e.preventDefault();closeCard();}});
function start(entry){
 closeCard();resetFlare();finishedStar=null;
 const w=normalize(entry,stored().length,!!entry.saved);
 if(!w.saved)session.push(w);
 current=w;
 draw(w.id);
 // Flare and final star share the same absolute coordinate system.
 flare.style.left=w.x+'%';flare.style.top=w.y+'%';
 flare.style.setProperty('--flare-color',palettes[Math.max(0,Math.min(5,w.topic))]);
 flare.hidden=false;
 if(document.body.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches){
   settle();return;
 }
 requestAnimationFrame(()=>flare.classList.add('launch'));
 starTimer=setTimeout(()=>{flare.classList.add('burst');},2580);
}
function settle(){
 if(!current)return;
 resetFlare();
 draw();
 const target=[...field.querySelectorAll('.memory-star')].find(b=>b.dataset.starId===current.id);
 if(target){target.classList.add('new-star');finishedStar=target.dataset.starId;}
 current=null;
}
function refresh(){resetFlare();current=null;finishedStar=null;closeCard();session=session.filter(x=>!x.saved);draw();}
function setLanguage(value){language=value==='vi'?'vi':'en';draw();if(!card.hidden)closeCard();}
draw();
window.WishSky={release:start,finish:settle,refresh,show(){resetFlare();current=null;draw();},setLanguage,closeCard,getActiveStar(){return finishedStar;}};
})();
