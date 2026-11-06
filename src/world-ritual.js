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
 <button type="button" id="ritualClose" class="ritual-close" aria-label="Return to the garden">✕</button>
 <div class="ritual-kicker">✦ THE WISHING TREE</div>
 <div class="ritual-lamp" aria-hidden="true">✧</div>
 <div id="ritualWrite">
  <h2 id="ritualTitle">A moment beneath the tree</h2>
  <p class="ritual-note">Stand before the tree. Take your time; your words belong to you.</p>
  <div class="reflection-leaf" aria-label="Optional reflection leaf">
    <button type="button" id="reflectionPick">✧ Draw a reflection leaf</button>
    <p class="reflection-help">A gentle question for you to consider. Not fortune-telling or a prediction.</p>
    <p id="reflectionLeafText" role="status" hidden></p>
  </div>
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
  <h2>Your light has risen through the Wishing Tree</h2>
  <p>One small moment of hope. This is a symbolic release, not a real transmission.</p>
  <button type="button" id="ritualAgain">Offer another wish</button>
  <button type="button" id="ritualReturn">Return to the garden</button>
 </div>
 <div id="ritualMemories" hidden>
  <h2 id="ritualMemoriesTitle" tabindex="-1">My wishes</h2>
  <p class="ritual-privacy">Only saved wishes from this browser appear here. Not synced between devices.</p>
  <ul id="ritualMemoryList"></ul>
  <div class="ritual-backup-actions">
    <button type="button" id="ritualExport">Download backup</button>
    <button type="button" id="ritualImport">Restore backup</button>
    <input type="file" id="ritualImportFile" accept=".json,application/json" hidden aria-label="Choose a Wish Garden backup JSON file">
  </div>
  <p id="ritualBackupNote" role="status" class="ritual-privacy">Backup stays on your device. Restoring will ask before replacing saved wishes.</p>
  <button type="button" id="ritualNewWish">Make a new wish</button>
 </div>
</section>
<div id="ritualLight" aria-hidden="true" hidden><span>✦</span></div>
`;
document.body.append(root);
const treeButton=$('touchWishingTree');
if(treeButton){
 treeButton.addEventListener('click',()=>{
  window.WishWorld3D?.awakenTree?.();
  treeButton.textContent='✧ The tree is glowing';
  treeButton.setAttribute('aria-label','Wishing Tree is glowing with light');
  // No suggestion that the universe has scientifically received a signal.
  treeButton.focus({preventScroll:true});
 });
}
// Solitude is as valid as companionship. Mirror the 3D world's local-only
// visibility preference, while remaining usable before WebGL is ready.
const presenceToggle=$('ambientToggle');
const presenceKey='wg-ambient-companions-v1';
function companionsVisible(){
  try{return localStorage.getItem(presenceKey)!=='hidden';}catch{return true;}
}
function syncCompanionToggle(){
  const visible=companionsVisible();
  presenceToggle.setAttribute('aria-pressed',String(visible));
  presenceToggle.textContent=visible?'✧ Quiet space':'✧ Show companions';
  presenceToggle.setAttribute('aria-label',visible?'Hide illustrative companions':'Show illustrative companions');
  window.WishWorld3D?.setCompanionsVisible?.(visible);
}
if(presenceToggle){
  presenceToggle.addEventListener('click',()=>{
    const next=!companionsVisible();
    try{localStorage.setItem(presenceKey,next?'shown':'hidden');}catch{}
    syncCompanionToggle();
  });
  syncCompanionToggle();
}
let mode='',lastFocus=null,session=[];
const reflections=[
 'What matters most to you at this moment?',
 'What is one kindness you could offer yourself today?',
 'Who makes you feel less alone?',
 'What small step could make tomorrow gentler?',
 'Which memory gives you strength?',
 'What can you release without losing hope?',
 'What are you grateful to have learned?',
 'Who might welcome a message from you today?',
 'What does a peaceful day look like for you?',
 'What is within your reach, even if the future is uncertain?'
];
let reflectionDrawCount=0;
function drawReflection(){
 const last=$('reflectionLeafText').dataset.index;
 const random=new Uint32Array(1);crypto.getRandomValues(random);
 let index=random[0]%reflections.length;
 if(reflections.length>1 && String(index)===last)index=(index+1)%reflections.length;
 const el=$('reflectionLeafText');el.textContent=reflections[index];
 el.dataset.index=String(index);el.hidden=false;reflectionDrawCount++;
 window.WishWorld3D?.awakenTree?.();
}
$('reflectionPick').addEventListener('click',drawReflection);

function load(){
 try{const items=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(items)?items.filter(x=>x&&typeof x.text==='string'):[]}catch{return []}
}
const MAX_BACKUP_BYTES=131072,MAX_BACKUP_WISHES=100;
function validateBackup(raw){
 if(!Array.isArray(raw)||raw.length>MAX_BACKUP_WISHES)throw Error('Invalid Wish Garden backup');
 const seen=new Set();
 return raw.map(x=>{
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid wish');
  const {id,text,topic,date}=x;
  if(typeof id!=='string'||!id||id.length>120||seen.has(id))throw Error('Invalid ID');
  if(typeof text!=='string'||!text.trim()||text.length>2000)throw Error('Invalid words');
  if(!Number.isInteger(topic)||topic<0||topic>5)throw Error('Invalid topic');
  if(typeof date!=='string'||!Number.isFinite(Date.parse(date))||!/^\d{4}-\d{2}-\d{2}T/.test(date))throw Error('Invalid date');
  seen.add(id);return {id,text,topic,date};
 });
}
function exportBackup(){
 const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='wish-garden-export.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('ritualBackupNote').textContent='Backup downloaded. Keep the file somewhere private.';
}
async function importBackup(){
 const file=$('ritualImportFile').files?.[0];
 if(!file)return;
 try{
  if(!file.size||file.size>MAX_BACKUP_BYTES)throw Error('Invalid file size');
  const wishes=validateBackup(JSON.parse(await file.text()));
  const ok=confirm('Replace ALL saved wishes on this device with '+wishes.length+' from this backup?');
  if(!ok){$('ritualBackupNote').textContent='Restore cancelled. Existing wishes are unchanged.';return;}
  localStorage.setItem(KEY,JSON.stringify(wishes));
  renderMemories();
  $('ritualBackupNote').textContent='Backup restored on this device. '+wishes.length+' saved wishes.';
 }catch{
  $('ritualBackupNote').textContent='Import rejected. Use a Wish Garden JSON export (max 128 KiB, 100 wishes). Existing wishes are unchanged.';
 }finally{$('ritualImportFile').value='';}
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
 $('ritualPanel').setAttribute('aria-label',next==='memories'?'My saved wishes':'Wishing Tree');
 if(next==='write'){$('ritualWords').focus({preventScroll:true});}
 if(next==='memories'){renderMemories();$('ritualMemoriesTitle').focus({preventScroll:true});}
 if(next==='complete'){$('ritualReturn').focus({preventScroll:true});}
}
function open(next='write',trigger){
 if($('ritualPanel').hidden)lastFocus=trigger||document.activeElement;
 $('ritualVeil').hidden=false;$('ritualPanel').hidden=false;
 document.body.classList.add('ritual-open');
 window.WishWorld3D?.focusShrine?.();
 window.WishWorld3D?.awakenTree?.();
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
$('ritualExport').addEventListener('click',exportBackup);
$('ritualImport').addEventListener('click',()=>{$('ritualImportFile').value='';$('ritualImportFile').click();});
$('ritualImportFile').addEventListener('change',importBackup);
document.addEventListener('keydown',event=>{
 if($('ritualPanel').hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();return;}
 if(event.key!=='Tab')return;
 const focusable=[...$('ritualPanel').querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea')].filter(el=>el.getClientRects().length>0);
 if(!focusable.length)return;
 if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus();}
 else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus();}
});
window.WishInWorldRitual={getState:()=>({mode,open:!$('ritualPanel').hidden,stored:load().length,session:session.length,reflectionDrawCount}),open,close};
})();
