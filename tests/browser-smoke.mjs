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
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER CONSOLE:',m.type(),m.text());});
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.locator('#hero').waitFor();
  await page.waitForFunction(()=>document.querySelector('.garden')?.classList.contains('rig-ready'),{timeout:15000});
  assert.equal(await page.locator('#visitorRig').isVisible(),true,'rigged 3D model replaces procedural visitor');

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
  await page.screenshot({path:'qa-screenshots/'+viewport.width+'-constellation.png',fullPage:false});
  await page.locator('#returnGarden').click();
  assert.equal(await page.locator('#sky').isVisible(),false);
  const localCount=await page.evaluate(()=>localStorage.length);
  assert.equal(localCount,0,'private wish should not be saved by default');
  await page.locator('#lang').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'vi');
  await page.locator('#wish').fill('Lời nguyện kiểm thử');
  await page.locator('input[name=keep][value=yes]').check();
  await page.locator('#send').click();
  assert.equal(await page.locator('#sky').isVisible(),true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]').length),1);
  await page.locator('#closeSky').click();
  page.once('dialog',d=>d.accept());
  await page.locator('#delete').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wg-preview-local-01')||'[]').length),0);
  assert.deepEqual(errors,[],'no page errors');
  console.log('Browser smoke PASS viewport '+viewport.width+'x'+viewport.height);
  await context.close();
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
