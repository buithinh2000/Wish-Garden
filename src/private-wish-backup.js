/* Private wish backup restore. Entirely local: no fetch, beacon or external service.
 * Only accepts Wish Garden's legacy JSON-array export from this browser. */
(function(){
'use strict';
const section=document.querySelector('.saved');
if(!section)return;
const KEY='wg-preview-local-01',MAX_BYTES=131072,MAX_ITEMS=100,MAX_TEXT=2000;
const file=document.createElement('input');
file.type='file';file.id='wishBackupFile';file.accept='.json,application/json';
file.setAttribute('aria-label','Select a local Wish Garden JSON backup');
file.hidden=true;
const button=document.createElement('button');
button.type='button';button.className='small';button.id='wishRestore';
const note=document.createElement('p');note.id='wishRestoreNote';note.setAttribute('role','status');
note.style.cssText='font-size:13px;line-height:1.5;color:#e6d9b8';
const actions=section.querySelector('.buttons');actions?.append(button,file);
section.append(note);
function vi(){return document.documentElement.lang==='vi';}
function label(){
 button.textContent=vi()?'Khôi phục từ JSON':'Restore from JSON';
 note.textContent=vi()
  ?'Chỉ đọc tập tin trên thiết bị. Nhập sẽ thay thế lời nguyện đang lưu sau khi bạn xác nhận; không tải lên AWS.'
  :'Reads a local file only. Import replaces saved wishes after confirmation; nothing is uploaded to AWS.';
 file.setAttribute('aria-label',vi()?'Chọn bản sao lưu Wish Garden JSON':'Select a local Wish Garden JSON backup');
}
function validate(data){
 if(!Array.isArray(data)||data.length>MAX_ITEMS)throw Error('format');
 const found=new Set();
 return data.map((entry,i)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('format');
  const {id,text,topic,date}=entry;
  if(typeof text!=='string'||!text.trim()||text.length>MAX_TEXT)throw Error('format');
  if(!Number.isInteger(topic)||topic<0||topic>5)throw Error('format');
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('format');
  if(typeof id!=='string'||!id||id.length>120||found.has(id))throw Error('format');
  found.add(id);
  return {id,text,topic,date};
 });
}
button.addEventListener('click',()=>{file.value='';file.click();});
file.addEventListener('change',async()=>{
 const selected=file.files?.[0];
 if(!selected)return;
 try{
  if(selected.size>MAX_BYTES||selected.size===0)throw Error('size');
  const data=validate(JSON.parse(await selected.text()));
  const confirmed=window.confirm(vi()
   ?'Thay thế toàn bộ lời nguyện đã lưu trên thiết bị bằng '+data.length+' lời nguyện từ bản sao lưu?'
   :'Replace ALL saved wishes on this device with '+data.length+' wishes from the backup?');
  if(!confirmed){
   note.textContent=vi()?'Đã hủy, dữ liệu hiện tại được giữ nguyên.':'Cancelled. Existing wishes were not changed.';
   return;
  }
  localStorage.setItem(KEY,JSON.stringify(data));
  // Reload so the saved list and private sky are regenerated from the same records.
  window.location.reload();
 }catch{
  note.textContent=vi()
    ?'Không thể nhập. Chỉ chọn tập tin JSON đã xuất từ Wish Garden (tối đa 128 KiB, 100 lời nguyện). Dữ liệu cũ giữ nguyên.'
    :'Import rejected. Select a Wish Garden exported JSON file (max 128 KiB, 100 wishes). Existing data is unchanged.';
 }finally{file.value='';}
});
document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(label));
label();
window.WishBackup={validate};
})();