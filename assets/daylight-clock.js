/* Local-device daylight rhythm. No geo permission, tracking or API requests.
   The seasonal sunrise/sunset depends on latitude; without location these are
   approximate civil-time transitions, not astronomical sunrise predictions. */
(()=>{
 'use strict';
 const periods=[
  {name:'night',start:0,sky:'#101e2c',haze:'#122c39'},
  {name:'dawn',start:5,sky:'#947269',haze:'#ac8876'},
  {name:'day',start:7,sky:'#79aec5',haze:'#9cc9cd'},
  {name:'dusk',start:17.5,sky:'#b16c6d',haze:'#8b636a'},
  {name:'night',start:19.5,sky:'#101e2c',haze:'#122c39'}
 ];
 function getState(now=new Date()){
  const hour=now.getHours()+now.getMinutes()/60;
  const period=periods.reduce((last,item)=>hour>=item.start?item:last,periods[0]);
  return {phase:period.name,sky:period.sky,haze:period.haze,hour,
   time:now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
   timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'device',
   basis:'device-local-clock'};
 }
 let current=getState();
 function refresh(){
  const next=getState();
  const changed=next.phase!==current.phase||next.time!==current.time;
  current=next;
  const display=document.getElementById('daylightStatus');
  if(display)display.textContent='LOCAL '+next.time+' · '+next.phase.toUpperCase();
  if(changed)window.dispatchEvent(new CustomEvent('wish-daylight-change',{detail:next}));
  return next;
 }
 window.WishDaylight={getState,refresh};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
 else refresh();
 window.setInterval(refresh,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
