import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const root=process.cwd();
const server=createServer(async(req,res)=>{
 const requested=(req.url||'/').split('?')[0];
 const target=normalize(join(root,requested==='/'?'index.html':requested.replace(/^\//,'')));
 if(!target.startsWith(root)){res.writeHead(403).end();return;}
 try{const body=await readFile(target);
   res.setHeader('Content-Type', target.endsWith('.html')?'text/html':target.endsWith('.jpg')?'image/jpeg':target.endsWith('.mjs')||target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/plain');
   res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
await mkdir('qa-screenshots',{recursive:true});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  const context=await browser.newContext({viewport, reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE JS ERROR:',e.stack||e.message);});
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'||m.text().startsWith('Wish Garden Maya bone roster:'))console.log('BROWSER CONSOLE:',m.type(),m.text());});
  await page.goto('http://127.0.0.1:'+port+'/');
  // Follow the same homepage-to-3D path a real visitor uses on both screen sizes.
  const worldEntry=page.getByRole('link',{name:'Open the separate interactive 3D garden'});
  assert.equal(await worldEntry.isVisible(),true,'3D entry must be discoverable on the homepage');
  assert.equal(await page.getByRole('link',{name:'Enter the 3D Wishing Tree and send a wish there'}).isVisible(),true,'homepage offers a prominent direct route to the 3D Wishing Tree');

  assert.equal(await worldEntry.getAttribute('href'),'./world.html','3D entry must route to the independent world');
  await worldEntry.click();
  await page.waitForURL('**/world.html');
  await page.locator('#worldStatus').waitFor();
  await page.waitForFunction(()=>document.body.classList.contains('world-ready') || document.body.classList.contains('software-ready'),{timeout:15000});
  assert.equal(await page.locator('.site-head').isVisible(),true,'independent world has its own navigation');
  await page.getByRole('link',{name:'Private wishes'}).click();
  await page.waitForURL(url=>url.pathname.endsWith('/index.html'));
  await page.locator('#hero').waitFor();
  await page.waitForFunction(()=>document.querySelector('.garden')?.classList.contains('rig-ready'),{timeout:15000});
  assert.equal(await page.locator('#visitorRig').isVisible(),true,'rigged 3D model replaces procedural visitor');
  assert.equal(await page.locator('#visitorRig').getAttribute('data-avatar-source'),'civilian-maya','realistic civilian rig must load; do not silently promote fallback');
  if(viewport.width===1280){
    const bones=await page.evaluate(()=>window.WishAvatar3D.getBoneNames());
    await (await import('node:fs/promises')).writeFile('qa-screenshots/maya-bones.json',JSON.stringify(bones,null,2));
    console.log('Skeletal joints collected:',bones.length);
  }

  assert.equal(await page.locator('.garden').getAttribute('aria-hidden'),null,'sanctuary controls cannot be hidden from accessibility tree');
  const sceneVisual=await page.locator('.garden').evaluate(el=>{const s=getComputedStyle(el);const svg=el.querySelector('.garden-art');return {image:s.backgroundImage,svg:getComputedStyle(svg).display}});
  await page.waitForFunction(()=>document.querySelector('.garden')?.classList.contains('world-ready') && document.querySelector('#sanctuary3d')?.dataset.rendered==='true',{timeout:15000});
  assert.equal(sceneVisual.svg,'none','old diagram layer no longer obscures environment');
  assert.equal(await page.locator('#sanctuary3d').isVisible(),true,'full-screen 3D environment visible');
  assert.equal(await page.locator('#worldRight').isVisible(),false,'technical camera controls are hidden by default');
  await page.locator('#worldOptions').click();
  assert.equal(await page.locator('#worldRight').isVisible(),true,'view options reveal camera controls when requested');
    const initialWorld=await page.evaluate(()=>window.WishWorld3D?.getState());
  assert.ok(initialWorld?.ready&&initialWorld.meshes>=30,'real terrain, pavilion, lanterns and trees are GPU meshes');
  // The hero tree must be the licensed detailed GLB, not silent procedural fallback.
  await page.waitForFunction(()=>window.WishWorld3D?.getState().heroTreeVisible===true,{timeout:20000});
  const heroTree=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(heroTree.heroTreeSource,'innerscene-cc0-oak-glb','hero tree must load real CC0 GLB');
  assert.equal(heroTree.heroTreeHeight,22,'hero oak must render at focal 22m height');
  assert.equal(heroTree.heroTreeCanopyWidthMultiplier,1.28,'authored canopy must read as landmark');
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-hero-oak.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-hero-oak.png'.includes('hero-wishing-tree')) await page.screenshot({path:'qa-screenshots/'+viewport.width+'-hero-oak.png',fullPage:false,animations:'disabled',timeout:60000});

  await page.locator('#worldRight').click();
  const rotatedWorld=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(rotatedWorld.azimuth>initialWorld.azimuth,'orbit controls rotate actual 3D camera');
  await page.locator('#worldNear').click();
  const zoomedWorld=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(zoomedWorld.radius<rotatedWorld.radius,'zoom controls change actual 3D camera distance');
  await page.locator('#worldLeft').click();
  await page.locator('#worldWalk').click();
  await page.waitForFunction(()=>window.WishWorld3D?.getState().walkT===1);
  const explored=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(explored.walkMode,true,'Explore enters an actual eye-level 3D view');
  assert.equal(await page.locator('#worldForward').isVisible(),true,'walk controls appear inside Explore');
  if(viewport.width<650){
    const buttons=await page.locator('#worldControls button:visible').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
    assert.ok(buttons.every(r=>r.left>=0&&r.right<=viewport.width&&r.top>=0&&r.bottom<=viewport.height),'WebGL walking buttons fit mobile viewport');
  }
  const firstStep=explored.walkDistance;
  await page.locator('#worldForward').click();
  const stepped=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(stepped.walkDistance>firstStep,'visitor really advances on the world path');
  await page.keyboard.press('w');
  assert.ok((await page.evaluate(()=>window.WishWorld3D.getState())).walkDistance>stepped.walkDistance,'keyboard W advances through 3D world');
  await page.locator('#worldBack').click();
  await page.keyboard.press('a');
  assert.ok((await page.evaluate(()=>window.WishWorld3D.getState())).walkLateral<0,'keyboard A moves viewpoint within bounded path');

  assert.equal(await page.locator('#worldWalk').getAttribute('aria-pressed'),'true');
  await page.locator('#worldWalk').click();
  await page.waitForFunction(()=>window.WishWorld3D?.getState().walkT===0);
  assert.equal((await page.evaluate(()=>window.WishWorld3D.getState())).walkMode,false,'Overview returns from walk through');

  assert.equal(sceneVisual.svg,'none','old diagram layer no longer obscures environment');
  const imageLoaded=await page.evaluate(async()=>{const i=new Image();i.src='assets/forest.jpg';await i.decode();return i.naturalWidth>1000});
  assert.ok(imageLoaded,'forest source loaded at image resolution');
  const scene=await page.locator('.garden').boundingBox();
  assert.ok(scene && scene.width>viewport.width*.95,'cinematic sanctuary fills screen width');
  const layers=await page.locator('.ground-mist,.wish-path,.lantern-glow,.visitor-shadow').count();
  assert.ok(layers>=5,'atmospheric scene layers present');

  assert.equal(await page.locator('#prayerPanel').isVisible(),false,'initial form hidden');
  assert.equal(await page.locator('#ceremony').isVisible(),true,'planning countdown is visible before entering the ritual');

  assert.equal(await page.locator('#hopeParticipation').isVisible(),true,'optional global participation section shown');
  assert.equal(await page.locator('#hopeParticipation input[type=checkbox]').isChecked(),false,'participation has no implied consent');
  assert.equal(await page.locator('#hopeParticipation button').first().isDisabled(),true,'no submissions when service is not configured');
  assert.match(await page.locator('#hopeParticipation [role=status]').textContent(),/not active yet/,'unconfigured global registration is explicitly disabled');
  assert.equal(await page.evaluate(()=>localStorage.getItem('wg-private-receipt-v05')),null,'no receipt or secret stored by default');

  await page.locator('#hopePacketPreview').waitFor({state:'visible'});
  assert.match(await page.locator('#hopePacketPreview').textContent(),/NOT SUBMITTED/,'draft preview must not claim on-air');
  const draftInfo=await page.evaluate(()=>window.WishPacketPreview?.getDraft());
  assert.equal(draftInfo.status,'DRAFT_NOT_SUBMITTED','browser public package is draft only');
  assert.equal(draftInfo.consentedParticipantDataIncluded,false,'no private data in packet');
  const draftDownload=page.waitForEvent('download');
  await page.locator('#hopePacketPreview button').click();
  const draftFile=await draftDownload;
  assert.match(draftFile.suggestedFilename(),/wish-garden-draft-.*\.json/);
  const draftJson=JSON.parse(await readFile(await draftFile.path(),'utf8'));
  assert.equal(draftJson.operatorEvidenceUrl,null,'operator proof must not be fabricated');

  assert.equal(await page.locator('#ceremony').evaluate(el=>el.parentElement===document.querySelector('main')),true,'ceremony is not hidden inside the prayer form');
  assert.match(await page.locator('#ceremonyStatus').textContent(),/NO TRANSMISSION CONFIRMED/,'never mislabel planning as completed transmission');
  assert.match(await page.locator('#ceremonyCountdown').textContent(),/^\d{2,} : \d{2} : \d{2}$/,'countdown days hours minutes');
  // V0.3: public/private journeys are visually distinct but evidence-truthful.
  assert.equal(await page.locator('#hopeCapsuleJourney').isVisible(),true,'capsule journey is visible');
  assert.equal(await page.locator('#hcPublic').getAttribute('aria-pressed'),'true','public capsule default');
  assert.match(await page.locator('#hcTimeline').textContent(),/No issuance record/,'public cannot claim transmitted');
  await page.locator('#hcMine').click();
  assert.equal(await page.locator('#hcMine').getAttribute('aria-pressed'),'true','private tab selected');
  assert.match(await page.locator('#hcTimeline').textContent(),/Not selected/,'no local participation without user action');
  await page.locator('#hcPublic').click();
  assert.match(await page.locator('#hcFoot').textContent(),/not an RF timeslot/,'planned UTC is not station slot');
  assert.equal(await page.evaluate(()=>localStorage.length),0,'no consent or transmission record stored by default');
  await page.locator('#ceremonyTopic').selectOption('2');
  await page.locator('#ceremonyJoin').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-ceremony-interest-01')||'[]').length),1,'explicit opt-in records local topic only');
  await page.locator('#hcMine').click();
  assert.match(await page.locator('#hcMessage').textContent(),/Health/,'local theme visible in private journey');
  assert.match(await page.locator('#hcTimeline').textContent(),/requires fresh consent/,'local interest not global opt-in');
  const localDownload=page.waitForEvent('download');
  await page.locator('#hcSaveReceipt').click();
  const localFile=await localDownload;
  assert.match(localFile.suggestedFilename(),/wish-garden-local-.*\.json/);
  const localReceipt=JSON.parse(await readFile(await localFile.path(),'utf8'));
  assert.equal(localReceipt.broadcastVerified,false,'local export never fakes operator verification');
  assert.equal(localReceipt.submittedToServer,false,'local interest has not been submitted');
  assert.equal(localReceipt.topics[0].topic,'Health','local export contains the selected theme');
  assert.equal(Object.hasOwn(localReceipt,'wishText'),false,'never exports a personal wish in the capsule record');
  const calendarDownload=page.waitForEvent('download');
  await page.locator('#hcSaveCalendar').click();
  const calendarFile=await calendarDownload;
  assert.match(calendarFile.suggestedFilename(),/wish-garden-plan-.*\.ics/);
  const calendarText=await readFile(await calendarFile.path(),'utf8');
  assert.match(calendarText,/DTSTART:\d{8}T120000Z/,'planning reminder has UTC event time');
  assert.match(calendarText,/No station booking or real transmission confirmed/);


  assert.deepEqual(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('wg-ceremony-interest-01'))[0]).sort()),['at','batch','id','topic'],'no original words or identity persisted');
  await page.locator('#ceremonyJoin').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-ceremony-interest-01')).length),1,'duplicate topic not counted twice');
  await page.locator('#ceremonyClear').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('wg-ceremony-interest-01')),null,'delete local participation interest');
  await page.locator('.garden').scrollIntoViewIfNeeded();
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-sanctuary.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-sanctuary.png'.includes('hero-wishing-tree')) await page.screenshot({path:'qa-screenshots/'+viewport.width+'-sanctuary.png',fullPage:false,animations:'disabled',timeout:60000});
  const hasWebGL=await page.evaluate(()=>!!window.WishAvatar3D);
  console.log('WebGL avatar present: '+hasWebGL+' ('+viewport.width+'px)');
  if(hasWebGL)assert.equal(await page.evaluate(()=>window.WishAvatar3D.getPose()),'idle');

  assert.equal(await page.locator('input[name=keep]:checked').getAttribute('value'),'no','default no saving');
  await page.locator('#enter').click();
  await page.waitForTimeout(1400);
  console.log('Ritual after click:',await page.evaluate(()=>({garden:document.querySelector('.garden').className,panel:document.getElementById('prayerPanel').className,pose:window.WishAvatar3D?.getPose?.(),rig:document.querySelector('.garden').classList.contains('rig-ready')})));

  await page.locator('#wish').waitFor({state:'visible'});
  if(hasWebGL)assert.equal(await page.evaluate(()=>window.WishAvatar3D.getPose()),'pray');
  const handsDistance=await page.evaluate(()=>window.WishAvatar3D?.getPrayerDistance?.());
  console.log('Maya prayer hands separation (scene units):',handsDistance);
  assert.ok(Number.isFinite(handsDistance)&&handsDistance<0.20,
    'both hand bones must meet near the chest during prayer, not merely raise arms');
  await page.locator('.garden').scrollIntoViewIfNeeded();
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-visitor-prayer.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-visitor-prayer.png'.includes('hero-wishing-tree')) await page.screenshot({path:'qa-screenshots/'+viewport.width+'-visitor-prayer.png',fullPage:false,animations:'disabled',timeout:60000});
  await page.locator('#wish').scrollIntoViewIfNeeded();
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-prayer.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-prayer.png'.includes('hero-wishing-tree')) await page.screenshot({path:'qa-screenshots/'+viewport.width+'-prayer.png',fullPage:false,animations:'disabled',timeout:60000});
  await page.locator('#wish').fill('A private sample wish');
  await page.locator('#backToSanctuary').click();
  assert.equal(await page.locator('#prayerPanel').isVisible(),false,'return to garden');
  if(hasWebGL)assert.equal(await page.evaluate(()=>window.WishAvatar3D.getPose()),'idle');
  await page.locator('#enter').click();
  await page.locator('#wish').waitFor({state:'visible'});
  assert.equal(await page.locator('#wish').inputValue(),'A private sample wish','unsent draft preserved');
  await page.locator('#send').click();
  assert.equal(await page.locator('#sky').isVisible(),true);
  await page.locator('#finishNote').waitFor({state:'visible'});
  await page.locator('.memory-star').first().waitFor({state:'visible'});
  assert.equal(await page.locator('.memory-star').count(),1,'unsaved wish becomes a session-only star');
  const starGeometry=await page.evaluate(()=>{
    const star=document.querySelector('.memory-star'),field=document.querySelector('#starField');
    const style=getComputedStyle(star),rect=star.getBoundingClientRect(),area=field.getBoundingClientRect();
    return {width:rect.width,height:rect.height,areaWidth:area.width,areaHeight:area.height,parent:star.parentElement===field};
  });
  assert.ok(starGeometry.parent&&starGeometry.width>=40&&starGeometry.height>=40,
    'stars have full accessible tap target in the sky field');
  assert.ok(starGeometry.areaWidth>200&&starGeometry.areaHeight>200,'sky field is a usable region');
  await page.locator('.memory-star').first().click();
  assert.equal(await page.locator('#starMemoryText').textContent(),'A private sample wish');
  await page.locator('#starMemoryClose').click();
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-constellation.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-constellation.png'.includes('hero-wishing-tree')) await page.screenshot({path:'qa-screenshots/'+viewport.width+'-constellation.png',fullPage:false,animations:'disabled',timeout:60000});
  await page.locator('#returnGarden').click();
  assert.equal(await page.locator('#sky').isVisible(),false);
  const localCount=await page.evaluate(()=>localStorage.length);
  assert.equal(localCount,0,'private wish should not be saved by default');
  await page.locator('#mySkyFromPrayer').click();
  assert.equal(await page.locator('.memory-star').count(),1,'private unsaved star remains during current visit');
  await page.locator('#closeSky').click();
  await page.locator('#lang').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'vi');
  await page.locator('#wish').fill('Lời nguyện kiểm thử');
  await page.locator('input[name=keep][value=yes]').check();
  await page.locator('#send').click();
  assert.equal(await page.locator('#sky').isVisible(),true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]').length),1);
  const chosenId=await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]')[0].id);
  await page.locator('.memory-star[data-star-id="'+chosenId+'"]').evaluate(el=>el.click());
  assert.equal(await page.locator('#starMemoryText').textContent(),'Lời nguyện kiểm thử');
  await page.locator('#starMemoryClose').click();
  await page.locator('#closeSky').click();
  await page.reload();
  await page.locator('#mySky').click();
  assert.equal(await page.locator('.memory-star').count(),1,'only chosen saved wish persists after reload');
  assert.equal(await page.locator('#sky').evaluate(el=>el.parentElement===document.body),true,
    'My Sky is independent of the hidden prayer panel');
  assert.equal(await page.locator('.memory-star').first().isVisible(),true,
    'saved star remains visible after reload');
  await page.locator('.memory-star').first().click();
  assert.equal(await page.locator('#starMemoryText').textContent(),'Lời nguyện kiểm thử');
  await page.locator('#starMemoryClose').click();
  await page.locator('#closeSky').click();
  await page.locator('#enter').click();
  await page.locator('#wish').waitFor({state:'visible'});
  page.once('dialog',d=>d.accept());
  await page.locator('#delete').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]').length),0);
  await page.reload();
  await page.locator('#mySky').click();
  assert.equal(await page.locator('.memory-star').count(),0,'no saved stars remain after deletion and reload');
  await page.locator('#closeSky').click();
  await page.locator('#enter').click();
  await page.locator('#wish').waitFor({state:'visible'});
  assert.equal(await page.locator('#wishRestore').isVisible(),true,'JSON restore action is available');
  const restored=[{id:'backup-test-'+viewport.width,text:'Private restored hope',topic:1,date:'2026-11-05T02:00:00.000Z'}];
  const backup={name:'wish-garden-export.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restored))};
  page.once('dialog',d=>d.dismiss());
  await page.locator('#wishBackupFile').setInputFiles(backup);
  assert.equal(await page.evaluate(()=>localStorage.getItem('wg-preview-local-01')),null,'cancelled import must not write');
  await page.locator('#wishBackupFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
  await page.waitForFunction(()=>document.querySelector('#wishRestoreNote')?.textContent?.includes('Import rejected'));
  assert.match(await page.locator('#wishRestoreNote').textContent(),/Import rejected/,'invalid backup is refused');
  assert.equal(await page.evaluate(()=>localStorage.getItem('wg-preview-local-01')),null,'invalid JSON never writes');
  page.once('dialog',d=>d.accept());
  await page.locator('#wishBackupFile').setInputFiles(backup);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]').length===1);
  await page.waitForFunction(()=>document.querySelector('#list')?.textContent?.includes('Private restored hope'));
  await page.locator('#mySky').click();
  assert.equal(await page.locator('.memory-star').count(),1,'restored wish is visible as a private star');
  await page.locator('.memory-star').first().click();
  assert.equal(await page.locator('#starMemoryText').textContent(),'Private restored hope');
  await page.locator('#starMemoryClose').click();
  await page.locator('#closeSky').click();
  await page.locator('#enter').click();
  await page.locator('#wish').waitFor({state:'visible'});
  page.once('dialog',d=>d.accept());
  await page.locator('#delete').click();
  assert.deepEqual(errors,[],'no page errors');
  console.log('Browser smoke PASS viewport '+viewport.width+'x'+viewport.height);
  // Independent 3D world must be visually distinct from legacy landing page.
  const worldPage=await context.newPage();
  await worldPage.goto('http://127.0.0.1:'+port+'/world.html');
  await worldPage.waitForFunction(()=>document.querySelector('#sanctuary3d')?.dataset.rendered==='true' && document.querySelector('.garden')?.classList.contains('world-ready'),{timeout:15000});
  assert.equal(await worldPage.locator('.hero-content').count(),0,'3D world cannot include old hero overlay');
  assert.equal(await worldPage.locator('.avatar').count(),0,'3D world cannot include old SVG avatar');
  assert.equal(await worldPage.locator('#fallback').isVisible(),false,'world renderer must remove loading cover');
  assert.equal(await worldPage.locator('#daylightStatus').isVisible(),true,'world displays automatic local day/night status');
  const phases=await worldPage.evaluate(()=>{
    const phaseAt=hour=>{const d=new Date();d.setHours(hour,30,0,0);return window.WishDaylight.getState(d).phase;};
    return [phaseAt(1),phaseAt(6),phaseAt(12),phaseAt(18),phaseAt(21)];
  });
  assert.deepEqual(phases,['night','dawn','day','dusk','night'],'local clock maps to distinct day/night atmospheres');
    assert.equal(await worldPage.locator('#worldBuild').isVisible(),true,'build fingerprint always visible in 3D world');
  const worldBuild=await worldPage.locator('#worldBuild').textContent();
  assert.match(worldBuild,/Build (?:[a-f0-9]{12}|__WISH_BUILD_SHA__)/,'release identity present before or after publish stamping');
  const ritualCss=await worldPage.locator('link[href*="world-ritual.css"]').getAttribute('href');
  const ritualJs=await worldPage.locator('script[src*="world-ritual.js"]').getAttribute('src');
  assert.match(ritualCss,/world-ritual\.css\?v=(?:[a-f0-9]{12}|__WISH_BUILD_SHA__)/,'ritual CSS has the exact Pages release cache key');
  assert.match(ritualJs,/world-ritual\.js\?v=(?:[a-f0-9]{12}|__WISH_BUILD_SHA__)/,'ritual JavaScript has the exact Pages release cache key');
  assert.equal(await worldPage.evaluate(()=>typeof window.WishInWorldRitual?.open),'function','the new ritual controller actually loads');
  const bundleSrc=await worldPage.locator('script[src*="sanctuary-world.bundle"]').getAttribute('src');
  assert.match(bundleSrc,/sanctuary-world\.bundle\.js\?v=(?:[a-f0-9]{12}|__WISH_BUILD_SHA__)/,'3D bundle cache key matches release stamp');
  const worldBounds=await worldPage.locator('#sanctuary3d').boundingBox();
  assert.ok(worldBounds?.height>viewport.height*.9,'world must cover entire screen');
  await worldPage.waitForFunction(()=>window.WishWorld3D?.getState().visitorSource==='civilian-glb',{timeout:15000});
  await worldPage.waitForFunction(()=>window.WishWorld3D?.getState().natureSource==='kenney-cc0-glb',{timeout:15000});
  await worldPage.waitForFunction(()=>window.WishWorld3D?.getState().sanctuarySource==='cc0-lotus-glb',{timeout:15000});
  assert.equal((await worldPage.evaluate(()=>window.WishWorld3D.getState())).sanctuaryVisible,true,'real licensed lotus garden must replace the hand-built pavilion');
    const heroState=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.deepEqual(heroState.heroTreeCenter,[0,-18],'central Wishing Tree is the 3D scene focal point');
  assert.ok(heroState.heroTreeScale>=2,'the Wishing Tree is substantially larger than background trees');
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-hero-wishing-tree.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-hero-wishing-tree.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-hero-wishing-tree.png',fullPage:false,animations:'disabled',timeout:60000});
  const natureState=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(natureState.natureTreeCount,12,'authored CC0 nature models replace all 12 hand-made trees');
  const visitorState=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(visitorState.visitorVisible,true,'standalone world must include a visible human visitor');
  assert.equal(visitorState.visitorSource,'civilian-glb','world must load the real civilian human asset, not just a primitive substitute');
  const companions=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(companions.ambientCompanionCount,4,'four ambient figures stand near the Wishing Tree');
  assert.equal(companions.ambientCompanionsSimulated,true,'visitors are marked simulated, not real online users');
  assert.match(await worldPage.locator('#ambientDisclosure').textContent(),/simulated figures, not real people online/,'visible disclosure prevents fabricated social proof');
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-tree-companions.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-tree-companions.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-tree-companions.png',fullPage:false,animations:'disabled',timeout:60000});
  const quietToggle=worldPage.locator('#ambientToggle');
  assert.equal(await quietToggle.isVisible(),true,'visitor can choose a solitary Wishing Tree');
  assert.equal(await quietToggle.getAttribute('aria-pressed'),'true','simulated companions shown initially');
  await quietToggle.click();
  assert.equal((await worldPage.evaluate(()=>window.WishWorld3D.getState())).ambientCompanionsVisible,false,'Quiet space actually hides simulated 3D figures');
  assert.equal(await quietToggle.getAttribute('aria-pressed'),'false','quiet preference is accessible');
  assert.equal(await worldPage.evaluate(()=>localStorage.getItem('wg-ambient-companions-v1')),'hidden','quiet preference saved only in this browser');
  await worldPage.reload();
  await worldPage.waitForFunction(()=>window.WishWorld3D?.getState().ready,{timeout:15000});
  assert.equal((await worldPage.evaluate(()=>window.WishWorld3D.getState())).ambientCompanionsVisible,false,'solitary preference persists after page reload');
  assert.match(await worldPage.locator('#ambientToggle').textContent(),/Show companions/,'user has a visible way to restore companions');
  await worldPage.locator('#ambientToggle').click();
  assert.equal((await worldPage.evaluate(()=>window.WishWorld3D.getState())).ambientCompanionsVisible,true,'user can restore figures without navigating or creating an account');
  assert.match(await worldPage.locator('#ambientDisclosure').textContent(),/simulated figures, not real people online/,'presence remains transparently fictional');

    const beforeOrbit=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(await worldPage.locator('#worldRight').isVisible(),false,'standalone sanctuary opens without game-like controls');
  await worldPage.locator('#worldOptions').click();
    await worldPage.locator('#worldRight').click();
  const afterOrbit=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(afterOrbit.azimuth>beforeOrbit.azimuth,'world orbit must respond');
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-standalone-world.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-standalone-world.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-standalone-world.png',fullPage:false,animations:'disabled',timeout:60000});
  // Universal Tree of Hopes, not a deity/altar or religion-specific ritual.
  assert.match(await worldPage.locator('.heading h1').textContent(),/Wishing Tree/,'shared tree is the purpose of this world');
  const treeTouch=worldPage.getByRole('button',{name:'Touch the Wishing Tree and watch its lights awaken'});
  assert.equal(await treeTouch.isVisible(),true,'visitor can interact with the tree without writing a wish');
  const treeBefore=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  await treeTouch.click();
  const treeAfter=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(treeAfter.treeAwakenCount,treeBefore.treeAwakenCount+1,'touching the tree lights its real 3D leaves/constellation');
  assert.equal(await worldPage.locator('#ritualPanel').isVisible(),false,'touching tree does not force a prayer form');
  assert.equal(new URL(worldPage.url()).pathname.endsWith('/world.html'),true,'tree gesture is in-world');
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-wishing-tree.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-wishing-tree.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-wishing-tree.png',fullPage:false,animations:'disabled',timeout:60000});
  // The entire prayer ritual stays inside the same sanctuary and 3D canvas.
  const wishEntry=worldPage.getByRole('link',{name:'Make a private wish in Wish Garden'});
  assert.equal(await wishEntry.isVisible(),true,'prayer entry is visible on desktop and mobile');
  // A visitor may be looking away from the temple; the ritual reorients
  // them to the shrine and returns them to their exact earlier view.
  // View controls are already open in the orbit test above.
  await worldPage.locator('#worldRight').click();
  const beforeRitual=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  await wishEntry.click();
  const focusedRitual=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(focusedRitual.ritualFocus,true,'wish centers attention on the Wishing Tree');
  assert.notEqual(focusedRitual.azimuth,beforeRitual.azimuth,'wish camera turns toward the Wishing Tree');
  assert.equal(await worldPage.locator('#worldControls').isVisible(),false,'exploration controls disappear during prayer');
  assert.equal(new URL(worldPage.url()).pathname.endsWith('/world.html'),true,'prayer does not exit 3D world');
  assert.equal(await worldPage.locator('#sanctuary3d').isVisible(),true,'3D sanctuary remains behind ritual');
  assert.equal(await worldPage.locator('#ritualPanel').isVisible(),true,'in-scene prayer form opens');
  assert.equal(await worldPage.locator('#reflectionLeafText').isVisible(),false,'reflection is voluntary and hidden before drawing');
  await worldPage.locator('#reflectionPick').click();
  assert.equal(await worldPage.locator('#reflectionLeafText').isVisible(),true,'a reflection question appears within the tree ritual');
  assert.ok((await worldPage.locator('#reflectionLeafText').textContent()).length>15,'the reflection has meaningful text');
  assert.equal((await worldPage.evaluate(()=>window.WishInWorldRitual.getState())).reflectionDrawCount,1,"reflection draw is observable without storing or revealing private words");
  assert.equal(await worldPage.locator('#ritualRelease').isDisabled(),true,'drawing a reflection never submits a wish');

  const ritualStyle=await worldPage.locator('#ritualPanel').evaluate(el=>({position:getComputedStyle(el).position,z:Number(getComputedStyle(el).zIndex)}));
  assert.equal(ritualStyle.position,'fixed','ritual stylesheet loads as CSS and stays over the scene');
  assert.ok(ritualStyle.z>=40,'ritual content must sit over WebGL canvas');
  if(viewport.width<650){
    const ritualBounds=await worldPage.locator('#ritualPanel').boundingBox();
    assert.ok(ritualBounds && ritualBounds.height<viewport.height*.72,'on phones the shrine remains visible above a compact prayer sheet');
    assert.ok(ritualBounds.y>viewport.height*.2,'mobile form must not hide the entire 3D sanctuary');
  }
  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-in-world-prayer.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-in-world-prayer.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-in-world-prayer.png',fullPage:false,animations:'disabled',timeout:60000});
  assert.equal(await worldPage.locator('#ritualWords').inputValue(),'','private words start blank');
  assert.equal(await worldPage.locator('#ritualRelease').isDisabled(),true,'cannot release empty words');
  await worldPage.locator('#ritualWords').fill('A quiet light from this garden');
  await worldPage.locator('#ritualRelease').click();
  assert.equal(await worldPage.locator('#ritualComplete').isVisible(),true,'release ends with a ritual closure');
  assert.equal(await worldPage.locator('#ritualVeil').isVisible(),false,'release unveils tree instead of masking it with the dark veil');
  assert.equal(await worldPage.evaluate(()=>window.WishInWorldRitual.getState().releaseMoments),1,'release triggers a cinematic moment');
  assert.equal(await worldPage.locator('#ritualPanel').evaluate(el=>getComputedStyle(el).position),'fixed','compact closure floats over the sanctuary');
  assert.equal(await worldPage.locator('#sanctuary3d').isVisible(),true,'WebGL tree is still visible through the release');

  if(viewport.width>=650 || 'qa-screenshots/'+viewport.width+'-in-world-release.png'.includes('hero-oak') || 'qa-screenshots/'+viewport.width+'-in-world-release.png'.includes('hero-wishing-tree')) await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-in-world-release.png',fullPage:false,animations:'disabled',timeout:60000});
  assert.ok((await worldPage.evaluate(()=>window.WishWorld3D.getState())).wishReleaseCount>=1,'releasing a wish triggered an actual WebGL light in the sanctuary');
  assert.equal((await worldPage.evaluate(()=>window.WishInWorldRitual.getState())).stored,0,'unsaved prayers are not persisted by default');
  assert.equal(await worldPage.locator('#sanctuary3d').isVisible(),true,'renderer stays visible after release');
  await worldPage.locator('#ritualReturn').click();
  const afterRitual=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(afterRitual.ritualFocus,false,'ritual focus is released');
  assert.equal(afterRitual.azimuth,beforeRitual.azimuth,'visitor previous camera angle restored on return');
  assert.equal(afterRitual.radius,beforeRitual.radius,'visitor previous distance restored on return');
  assert.equal(await worldPage.locator('#worldControls').isVisible(),true,'optional controls restore after ritual');
  assert.equal(await worldPage.locator('#ritualPanel').isVisible(),false,'ritual closes back to same sanctuary');
  assert.equal(new URL(worldPage.url()).pathname.endsWith('/world.html'),true,'no navigation throughout wish');
  await worldPage.close();
  // Returning visitors can view/delete only their own locally saved wishes,
  // in the same world and without starting a new prayer.
  const memoryPage=await context.newPage();
  await memoryPage.goto('http://127.0.0.1:'+port+'/world.html');
  await memoryPage.evaluate(()=>{
    localStorage.setItem('wg-preview-local-01',JSON.stringify([
      {id:'my-wish-1',text:'My saved private hope',topic:0,date:'2026-11-05T02:00:00.000Z'},
      {id:'my-wish-2',text:'Keep this second hope',topic:1,date:'2026-11-05T03:00:00.000Z'}
    ]));
  });
  const memoryEntry=memoryPage.getByRole('link',{name:'View my saved wishes on this device'});
  assert.equal(await memoryEntry.isVisible(),true,'memories entry visible');
  await memoryEntry.click();
  assert.equal((await memoryPage.evaluate(()=>window.WishWorld3D.getState())).ritualFocus,true,'saved wishes also open around the shrine');
  assert.equal(new URL(memoryPage.url()).pathname.endsWith('/world.html'),true,'My wishes stays in sanctuary');
  assert.equal(await memoryPage.locator('#ritualMemories').isVisible(),true,'saved wishes open in-scene');
  assert.match(await memoryPage.locator('#ritualMemoryList').textContent(),/My saved private hope/,'local wish visible');
  assert.equal(await memoryPage.locator('#ritualMemoriesTitle').evaluate(el=>document.activeElement===el),true,'focus reaches saved memories');
  assert.equal(await memoryPage.locator('#ritualMemoryList button').count(),2,'individual deletion controls');
  memoryPage.once('dialog',dialog=>dialog.dismiss());
  await memoryPage.locator('#ritualMemoryList button').first().click();
  assert.equal(await memoryPage.locator('#ritualMemoryList button').count(),2,'cancel preserves both');
  memoryPage.once('dialog',dialog=>dialog.accept());
  await memoryPage.locator('#ritualMemoryList button').first().click();
  assert.equal(await memoryPage.locator('#ritualMemoryList button').count(),1,'delete only selected wish');
  assert.match(await memoryPage.locator('#ritualMemoryList').textContent(),/Keep this second hope/,'other wish survives');
  await memoryPage.locator('#ritualNewWish').click();
  await memoryPage.locator('#ritualWords').fill('Saved directly from the sanctuary');
  await memoryPage.locator('#ritualSave').check();
  await memoryPage.locator('#ritualRelease').click();
  assert.equal((await memoryPage.evaluate(()=>window.WishInWorldRitual.getState())).stored,2,'opted-in prayer saves on device');
  await memoryPage.locator('#ritualReturn').click();
  await memoryPage.reload();
  await memoryPage.getByRole('link',{name:'View my saved wishes on this device'}).click();
  assert.match(await memoryPage.locator('#ritualMemoryList').textContent(),/Saved directly from the sanctuary/,'saved wish persists after reload');
  assert.doesNotMatch(await memoryPage.locator('#ritualMemoryList').textContent(),/My saved private hope/,'deleted wish stays deleted');
  // Complete backup cycle without leaving the 3D sanctuary, using the same
  // JSON-array export format as the existing lightweight 2D fallback.
  const worldBackupDownload=memoryPage.waitForEvent('download');
  await memoryPage.locator('#ritualExport').click();
  const worldBackup=await worldBackupDownload;
  assert.equal(worldBackup.suggestedFilename(),'wish-garden-export.json','in-world backup uses the portable Wish Garden format');
  const exported=JSON.parse(await readFile(await worldBackup.path(),'utf8'));
  assert.equal(exported.length,2,'all locally saved wishes are in the downloaded backup');
  assert.ok(exported.every(x=>typeof x.id==='string'&&typeof x.text==='string'),'backup entries contain real private data');
  const importInput=memoryPage.locator('#ritualImportFile');
  const backupFile={name:'wish-garden-export.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{id:'restored-one',text:'Restored inside the temple',topic:1,date:'2026-11-05T02:00:00.000Z'}]))};
  memoryPage.once('dialog',d=>d.dismiss());
  await importInput.setInputFiles(backupFile);
  assert.equal((await memoryPage.evaluate(()=>window.WishInWorldRitual.getState())).stored,2,'cancelled restore cannot overwrite saved wishes');
  await importInput.setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});
  await memoryPage.waitForFunction(()=>document.querySelector('#ritualBackupNote')?.textContent?.includes('Import rejected'));
  assert.equal((await memoryPage.evaluate(()=>window.WishInWorldRitual.getState())).stored,2,'invalid backup must be rejected');
  memoryPage.once('dialog',d=>d.accept());
  await importInput.setInputFiles(backupFile);
  await memoryPage.waitForFunction(()=>document.querySelector('#ritualMemoryList')?.textContent?.includes('Restored inside the temple'));
  assert.equal((await memoryPage.evaluate(()=>window.WishInWorldRitual.getState())).stored,1,'confirmed restore replaces local wishes');
  assert.equal(new URL(memoryPage.url()).pathname.endsWith('/world.html'),true,'backup remains entirely in the sanctuary');

  await memoryPage.keyboard.press('Escape');
  assert.equal(await memoryPage.locator('#ritualPanel').isVisible(),false,'Escape returns to sanctuary');
  await memoryPage.close();
  // Simulate a user's browser failing to load WebGL: never leave an empty page.
  const fallbackPage=await context.newPage();
  await fallbackPage.route('**/assets/sanctuary-world.bundle.js*',route=>route.abort());
  await fallbackPage.goto('http://127.0.0.1:'+port+'/world.html');
  await fallbackPage.waitForFunction(()=>window.WishSoftware3D?.getState().active===true,{timeout:12000});
  assert.equal(await fallbackPage.locator('#fallback').isVisible(),false,'3D software fallback removes waiting overlay');
  assert.equal(await fallbackPage.locator('#softwareWorld').isVisible(),true,'standalone world draws an actual perspective scene despite failed WebGL');
  const swBefore=await fallbackPage.evaluate(()=>window.WishSoftware3D.getState());
  assert.equal(swBefore.visitorDrawn,true,'software world must visibly draw a human in perspective');
  assert.equal(swBefore.daylight,await fallbackPage.evaluate(()=>window.WishDaylight.getState().phase),'software mode uses the same local daylight phase');
  assert.ok(swBefore.faces>100,'software fallback has substantive 3D scene geometry');
  assert.ok(swBefore.faces>1200,'rounded tree canopies have substantial 3D surface geometry');
  assert.ok(swBefore.faces>1400,'garden has additional spatial landscaping and pavilion geometry');
  await fallbackPage.locator('#softwareExplore').click();
  assert.equal((await fallbackPage.evaluate(()=>window.WishSoftware3D.getState())).walk,true,'software Explore enters near-eye view');
  assert.equal(await fallbackPage.locator('#softwareForward').isVisible(),true,'Software Mode exposes walk button in Explore');
  if(viewport.width<650){
    const buttonRects=await fallbackPage.locator('#softwareControls button:visible').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
    assert.ok(buttonRects.every(r=>r.left>=0&&r.right<=viewport.width&&r.top>=0&&r.bottom<=viewport.height),'software controls stay onscreen for mobile walking');
  }
  const softwareFirst=await fallbackPage.evaluate(()=>window.WishSoftware3D.getState().walkDistance);
  await fallbackPage.locator('#softwareForward').click();
  assert.ok((await fallbackPage.evaluate(()=>window.WishSoftware3D.getState().walkDistance))>softwareFirst,'software camera advances on the real path');
  await fallbackPage.keyboard.press('w');
  assert.ok((await fallbackPage.evaluate(()=>window.WishSoftware3D.getState().walkDistance))>softwareFirst+1.8,'keyboard W moves software camera forward');
  await fallbackPage.locator('#softwareBack').click();
  await fallbackPage.keyboard.press('s');
  assert.equal((await fallbackPage.evaluate(()=>window.WishSoftware3D.getState().walkDistance)),softwareFirst,'software path can retreat');

  await fallbackPage.locator('#softwareExplore').click();
  assert.equal((await fallbackPage.evaluate(()=>window.WishSoftware3D.getState())).walk,false,'software Overview returns to garden viewpoint');

  assert.equal(await fallbackPage.locator('#showRenderDetails').isVisible(),true,'software mode gives user clear graphics diagnostic control');
  await fallbackPage.locator('#showRenderDetails').click();
  assert.equal(await fallbackPage.locator('#renderDiagnostics').isVisible(),true,'graphics diagnostics open without developer console');
  assert.match(await fallbackPage.locator('#renderDetailText').textContent(),/3D engine JavaScript failed to load/,'blocked bundle displays root cause');
  assert.equal((await fallbackPage.evaluate(()=>window.WishRenderDiagnostic.getState())).assetStatus,'failed','3D bundle load failure is exposed');
  assert.match(await fallbackPage.locator('#worldStatus').textContent(),/3D SCRIPT FAILED/,'visible HUD must name missing engine');
  assert.equal(await fallbackPage.locator('#retryWebGL').isVisible(),true,'users can retry graphics from the app');
  await fallbackPage.locator('#closeRenderDetails').click();
  assert.equal(await fallbackPage.locator('#renderDiagnostics').isVisible(),false);

  await fallbackPage.locator('#softwareControls button[aria-label="Rotate right"]').click();
  const swAfter=await fallbackPage.evaluate(()=>window.WishSoftware3D.getState());
  assert.ok(swAfter.yaw>swBefore.yaw,'software perspective camera rotates');
  await fallbackPage.screenshot({path:'qa-screenshots/'+viewport.width+'-software-3d-fallback.png',fullPage:false});
  assert.equal(await fallbackPage.locator('#gpuCheckLink').getAttribute('href'),'./gpu-check.html','Software Mode links to a direct WebGL isolation test');
  await fallbackPage.close();
  // This page must use native WebGL directly, without loading our 3D engine.
  const gpuPage=await context.newPage();
  await gpuPage.goto('http://127.0.0.1:'+port+'/gpu-check.html');
  await gpuPage.waitForFunction(()=>window.WishGpuProbe?.getState().status!=='checking' && window.WishGpuProbe?.getState().status!=='not-run',{timeout:12000});
  const gpu=await gpuPage.evaluate(()=>window.WishGpuProbe.getState());
  assert.ok(['rendering','blocked','error'].includes(gpu.status),'GPU probe must report an explicit outcome');
  assert.equal(await gpuPage.locator('script[src*="sanctuary-world"]').count(),0,'GPU test must not load the main 3D bundle');
  assert.equal(await gpuPage.locator('#retry').isVisible(),true);
  await gpuPage.close();
  await context.close();
  // Repeat the key pose transition without reduced motion so animation
  // interpolation is exercised, not merely its final static IK position.
  const motionContext=await browser.newContext({viewport,reducedMotion:'no-preference'});
  const motionPage=await motionContext.newPage();
  const motionErrors=[];
  motionPage.on('pageerror',e=>motionErrors.push(e.message));
  await motionPage.goto('http://127.0.0.1:'+port+'/');
  await motionPage.waitForFunction(()=>document.querySelector('.garden')?.classList.contains('rig-ready'));
  await motionPage.locator('#enter').click();
  await motionPage.locator('#wish').waitFor({state:'visible'});
  await motionPage.waitForFunction(()=>document.querySelector('#visitorRig')?.dataset.posePhase==='pray',{timeout:7000});
  const motionDistance=await motionPage.evaluate(()=>window.WishAvatar3D.getPrayerDistance());
  assert.ok(motionDistance<.20,'animated prayer ends with both hands together');
  await motionPage.locator('#backToSanctuary').click();
  assert.equal(await motionPage.evaluate(()=>window.WishAvatar3D.getPose()),'idle');
  await motionPage.waitForFunction(()=>{
    const phase=document.querySelector('#visitorRig')?.dataset.posePhase;
    return phase==='returning'||phase==='idle';
  },{timeout:3000});
  await motionPage.waitForFunction(()=>document.querySelector('#visitorRig')?.dataset.posePhase==='idle',{timeout:4500});
  await motionPage.locator('.garden').scrollIntoViewIfNeeded();
  await motionPage.screenshot({path:'qa-screenshots/'+viewport.width+'-after-prayer.png',fullPage:false});
  // The standalone world must animate its real GLB when the visitor takes a step.
  const animatedWorld=await motionContext.newPage();
  animatedWorld.on('pageerror',e=>motionErrors.push(e.message));
  await animatedWorld.goto('http://127.0.0.1:'+port+'/world.html');
  await animatedWorld.waitForFunction(()=>window.WishWorld3D?.getState().visitorSource==='civilian-glb',{timeout:15000});
  const animationReady=await animatedWorld.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(animationReady.visitorAnimated,true,'the civilian GLB provides an animation mixer');
  await animatedWorld.locator('#worldWalk').click();
  await animatedWorld.waitForFunction(()=>window.WishWorld3D?.getState().walkT===1,{timeout:5000});
  const beforeStep=await animatedWorld.evaluate(()=>window.WishWorld3D.getState().visitorAnimationTime);
  await animatedWorld.locator('#worldForward').click();
  await animatedWorld.waitForFunction(before=>window.WishWorld3D?.getState().visitorAnimationTime>before+.08,beforeStep,{timeout:10000});
  const moved=await animatedWorld.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(moved.walkDistance>0&&moved.visitorAnimationTime>beforeStep,'human walks and animates on the lantern path');
  await animatedWorld.screenshot({path:'qa-screenshots/'+viewport.width+'-human-walking.png',fullPage:false});
  await animatedWorld.close();
    assert.deepEqual(motionErrors,[],'animation path should not throw errors');
  await motionContext.close();
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
