import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url='https://d3vvpfv5t9ws76.cloudfront.net/3d-preview.html';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  const failures=[];
  page.on('pageerror',err=>failures.push(err.message));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,'public CloudFront must serve page');
  await page.waitForFunction(()=>document.querySelector('#sanctuary3d')?.dataset.rendered==='true' && document.querySelector('.garden')?.classList.contains('world-ready'),{timeout:25000});
  const world=await page.evaluate(()=>window.WishWorld3D?.getState());
  assert.ok(world?.ready&&world.meshes>=30,'public URL must render a true 3D world');
  const photo=await page.locator('.garden').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.equal(photo,'none','public 3D preview must not be the old static photograph');
  const first=world.azimuth;
  await page.locator('#worldRight').click();
  const second=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(second.azimuth>first,'CloudFront 3D view must respond to orbit');
  assert.deepEqual(failures,[],'no public page JavaScript exceptions');
  console.log('PASS live CloudFront 3D:',viewport.width,'world meshes',world.meshes);
  await page.close();
 }
} finally{await browser.close();}
