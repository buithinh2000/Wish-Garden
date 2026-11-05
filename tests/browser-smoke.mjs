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
   res.setHeader('Content-Type', target.endsWith('.html')?'text/html':target.endsWith('.jpg')?'image/jpeg':target.endsWith('.mjs')||target.endsWith('.js')?'text/javascript':'text/plain');
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
  const initialWorld=await page.evaluate(()=>window.WishWorld3D?.getState());
  assert.ok(initialWorld?.ready&&initialWorld.meshes>=30,'real terrain, pavilion, lanterns and trees are GPU meshes');
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
  await page.screenshot({path:'qa-screenshots/'+viewport.width+'-sanctuary.png',fullPage:false});
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
  await page.screenshot({path:'qa-screenshots/'+viewport.width+'-visitor-prayer.png',fullPage:false});
  await page.locator('#wish').scrollIntoViewIfNeeded();
  await page.screenshot({path:'qa-screenshots/'+viewport.width+'-prayer.png',fullPage:false});
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
  await page.screenshot({path:'qa-screenshots/'+viewport.width+'-constellation.png',fullPage:false});
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
  const worldBounds=await worldPage.locator('#sanctuary3d').boundingBox();
  assert.ok(worldBounds?.height>viewport.height*.9,'world must cover entire screen');
  await worldPage.waitForFunction(()=>window.WishWorld3D?.getState().visitorSource==='civilian-glb',{timeout:15000});
  const visitorState=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.equal(visitorState.visitorVisible,true,'standalone world must include a visible human visitor');
  assert.equal(visitorState.visitorSource,'civilian-glb','world must load the real civilian human asset, not just a primitive substitute');
    const beforeOrbit=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  await worldPage.locator('#worldRight').click();
  const afterOrbit=await worldPage.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(afterOrbit.azimuth>beforeOrbit.azimuth,'world orbit must respond');
  await worldPage.screenshot({path:'qa-screenshots/'+viewport.width+'-standalone-world.png',fullPage:false});
  await worldPage.close();
  // Simulate a user's browser failing to load WebGL: never leave an empty page.
  const fallbackPage=await context.newPage();
  await fallbackPage.route('**/assets/sanctuary-world.bundle.js',route=>route.abort());
  await fallbackPage.goto('http://127.0.0.1:'+port+'/world.html');
  await fallbackPage.waitForFunction(()=>window.WishSoftware3D?.getState().active===true,{timeout:12000});
  assert.equal(await fallbackPage.locator('#fallback').isVisible(),false,'3D software fallback removes waiting overlay');
  assert.equal(await fallbackPage.locator('#softwareWorld').isVisible(),true,'standalone world draws an actual perspective scene despite failed WebGL');
  const swBefore=await fallbackPage.evaluate(()=>window.WishSoftware3D.getState());
  assert.equal(swBefore.visitorDrawn,true,'software world must visibly draw a human in perspective');
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
  await animatedWorld.waitForFunction(before=>window.WishWorld3D?.getState().visitorAnimationTime>before+.08,beforeStep,{timeout:5000});
  const moved=await animatedWorld.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(moved.walkDistance>0&&moved.visitorAnimationTime>beforeStep,'human walks and animates on the lantern path');
  await animatedWorld.screenshot({path:'qa-screenshots/'+viewport.width+'-human-walking.png',fullPage:false});
  await animatedWorld.close();
    assert.deepEqual(motionErrors,[],'animation path should not throw errors');
  await motionContext.close();
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
