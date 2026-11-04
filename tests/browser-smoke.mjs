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
   res.setHeader('Content-Type', target.endsWith('.html')?'text/html':target.endsWith('.jpg')?'image/jpeg':'text/plain');
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
  assert.ok(sceneVisual.image.includes('assets/forest.jpg'),'cinematic forest image applied');
  assert.equal(sceneVisual.svg,'none','old diagram layer no longer obscures environment');
  const imageLoaded=await page.evaluate(async()=>{const i=new Image();i.src='assets/forest.jpg';await i.decode();return i.naturalWidth>1000});
  assert.ok(imageLoaded,'forest source loaded at image resolution');
  const scene=await page.locator('.garden').boundingBox();
  assert.ok(scene && scene.width>viewport.width*.95,'cinematic sanctuary fills screen width');
  const layers=await page.locator('.ground-mist,.wish-path,.lantern-glow,.visitor-shadow').count();
  assert.ok(layers>=5,'atmospheric scene layers present');

  assert.equal(await page.locator('#prayerPanel').isVisible(),false,'initial form hidden');
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
  await page.locator('.memory-star').first().click();
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
  assert.deepEqual(errors,[],'no page errors');
  console.log('Browser smoke PASS viewport '+viewport.width+'x'+viewport.height);
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
  assert.deepEqual(motionErrors,[],'animation path should not throw errors');
  await motionContext.close();
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
