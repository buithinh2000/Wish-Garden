/* Wish Garden MVP: the entire ritual happens inside the garden.
 * Local-first, optional persistence, no account, no telemetry or broadcast.
 */
(()=>{
'use strict';
const KEY='wg-preview-local-01',MAX=700;
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const root=document.createElement('div');
root.id='worldRitualRoot';
root.innerHTML=`
<div id="ritualVeil" hidden></div>
<section id="ritualPanel" role="dialog" aria-modal="true" aria-labelledby="ritualTitle" hidden>
 <button type="button" id="ritualClose" class="ritual-close" aria-label="Return to the sanctuary">✕</button>
 <div class="ritual-kicker">✦ THE QUIET SANCTUARY</div>
 <div class="ritual-lamp" aria-hidden="true">🪔</div>
 <div id="ritualWrite">
  <h2 id="ritualTitle">A moment for your hope</h2>
  <p class="ritual-note">Pause here. Your words belong to you.</p>
  <label for="ritualTopic">What is this wish for?</label>
  <select id="ritualTopic">
   <option>Peace & calm</option><option>Family & loved ones</option><option>Health & strength</option>
   <option>Hope for tomorrow</option><option>Remembrance</option><option>Gratitude</option>
  </select>
  <label for="ritualWords">Your private words</label>
  <textarea id="ritualWords" maxlength="700" rows="4" placeholder="I hope that..."></textarea>
  <label class="ritual-check"><input id="ritualSave" type="checkbox"> Keep this wish on this device</label>
  <p class="ritual-privacy">By default, your wish is not saved. Saving is local to this browser, not shared publicly or sent to space.</p>
  <button type="button" id="ritualRelease" disabled>Release my wish · ✨</button>
 </div>
 <div id="ritualComplete" hidden role="status">
  <h2>Your light has joined the sky</h2>
  <p>One small moment of hope. This is a symbolic release, not a real transmission.</p>
  <button type="button" id="ritualAgain">Offer another wish</button>
  <button type="button" id="ritualReturn">Return to the sanctuary</button>
 </div>
 <div id="ritualMemories" hidden>
  <h2 id="ritualMemoriesTitle" tabindex="-1">My wishes</h2>
  <p class="ritual-privacy">Only saved wishes from this browser appear here. Not synced between devices.</p>
  <ul id="ritualMemoryList"></ul>
  <button type="button" id="ritualNewWish">Make a new wish</button>
 </div>
</section>
<div id="ritualLight" aria-hidden="true" hidden><span>✦</span></div>
`;
document.body.append(root);
let mode='',lastFocus=null,session=[];
function load(){
 try{const items=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(items)?items.filter(x=>x&&typeof x.text==='string'):[]}catch{return []}
}
function close(){
 $('ritualPanel').hidden=true;$('ritualVeil').hidden=true;
 document.body.classList.remove('ritual-open');
 $('ritualLight').hidden=true;mode='';
 window.WishWorld3D?.restoreView?.();
 lastFocus?.focus?.({preventScroll:true});
}
function view(next){
 mode=next;
 $('ritualWrite').hidden=next!=='write';
 $('ritualComplete').hidden=next!=='complete';
 $('ritualMemories').hidden=next!=='memories';
 $('ritualPanel').setAttribute('aria-label',next==='memories'?'My saved wishes':'Wishing sanctuary');
 if(next==='write'){$('ritualWords').focus({preventScroll:true});}
 if(next==='memories'){renderMemories();$('ritualMemoriesTitle').focus({preventScroll:true});}
 if(next==='complete'){$('ritualReturn').focus({preventScroll:true});}
}
function open(next='write',trigger){
 if($('ritualPanel').hidden)lastFocus=trigger||document.activeElement;
 $('ritualVeil').hidden=false;$('ritualPanel').hidden=false;
 document.body.classList.add('ritual-open');
 window.WishWorld3D?.focusShrine?.();
 view(next);
}
function animateLight(){
 const light=$('ritualLight');
 light.hidden=false;
 light.classList.remove('rise');
 void light.offsetWidth;
 light.classList.add('rise');
 if(reduced.matches){light.hidden=true;return;}
 light.addEventListener('animationend',()=>{light.hidden=true;},{once:true});
}
function release(){
 const text=$('ritualWords').value.trim();if(!text)return;
 const item={id:crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),text:text.slice(0,MAX),topic:$('ritualTopic').selectedIndex,date:new Date().toISOString()};
 const save=$('ritualSave').checked;
 // A failed previous save must not leave a false warning on a later release.
 $('ritualComplete').querySelector('p').textContent='One small moment of hope. This is a symbolic release, not a real transmission.';
 if(save){
  try{
   const entries=load();entries.push(item);
   localStorage.setItem(KEY,JSON.stringify(entries));
  }catch{
   // Storage can fail in private mode/quota; tell the user, and do not claim persistence.
   $('ritualComplete').querySelector('p').textContent='Your wish was released symbolically, but it could not be saved on this device.';
  }
 }else session.push(item);
 $('ritualWords').value='';$('ritualSave').checked=false;$('ritualRelease').disabled=true;
 view('complete');animateLight();
 window.WishWorld3D?.bless?.();
}
function renderMemories(){
 const list=$('ritualMemoryList');list.replaceChildren();
 const records=load();
 if(!records.length){const empty=document.createElement('li');empty.textContent='No wishes saved on this device yet.';list.append(empty);return;}
 for(const item of records){
  const li=document.createElement('li'),words=document.createElement('p'),del=document.createElement('button');
  words.textContent=(new Date(item.date).toLocaleDateString()||'')+' · '+item.text;
  del.type='button';del.textContent='Delete';del.setAttribute('aria-label','Delete this saved wish');
  del.addEventListener('click',()=>{
   if(!confirm('Delete only this wish from this device?'))return;
   try{localStorage.setItem(KEY,JSON.stringify(load().filter(x=>x.id!==item.id)));renderMemories();}
   catch{alert('Could not delete this wish on this device.');}
  });
  li.append(words,del);list.append(li);
 }
}
document.querySelectorAll('.world-actions a').forEach(link=>{
 const mine=link.getAttribute('href')?.includes('mine=1');
 const ritual=link.getAttribute('href')?.includes('ritual=1');
 if(!mine&&!ritual)return;
 link.addEventListener('click',event=>{event.preventDefault();open(mine?'memories':'write',link);});
});
$('ritualWords').addEventListener('input',()=>{$('ritualRelease').disabled=!$('ritualWords').value.trim();});
$('ritualRelease').addEventListener('click',release);
$('ritualClose').addEventListener('click',close);
$('ritualVeil').addEventListener('click',close);
$('ritualReturn').addEventListener('click',close);
$('ritualAgain').addEventListener('click',()=>view('write'));
$('ritualNewWish').addEventListener('click',()=>view('write'));
document.addEventListener('keydown',event=>{
 if($('ritualPanel').hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();return;}
 if(event.key!=='Tab')return;
 const focusable=[...$('ritualPanel').querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea')].filter(el=>el.getClientRects().length>0);
 if(!focusable.length)return;
 if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus();}
 else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus();}
});
window.WishInWorldRitual={getState:()=>({mode,open:!$('ritualPanel').hidden,stored:load().length,session:session.length}),open,close};
})();
