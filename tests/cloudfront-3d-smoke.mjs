import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url='https://d3vvpfv5t9ws76.cloudfront.net/world.html';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'});
  const failures=[];
  page.on('pageerror',err=>failures.push(err.message));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200,'public CloudFront must serve the standalone 3D page');
  await page.waitForFunction(()=>document.querySelector('#sanctuary3d')?.dataset.rendered==='true' && document.querySelector('.garden')?.classList.contains('world-ready'),{timeout:25000});
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('world-showcase')),true);
  assert.equal(await page.locator('#fallback').isVisible(),false,'loading overlay must be removed after 3D is ready');
  assert.equal(await page.locator('.hero-content').count(),0,'standalone world cannot contain legacy homepage overlay');
  assert.equal(await page.locator('.avatar').count(),0,'standalone world cannot contain cartoon SVG avatar');
  assert.equal(await page.locator('.garden-art').count(),0,'standalone world cannot include 2D illustration');
  const canvas=await page.locator('#sanctuary3d').boundingBox();
  assert.ok(canvas?.height>viewport.height*.9 && canvas.width>viewport.width*.9,'GPU scene fills almost entire viewport');
  assert.equal(await page.locator('#worldWalk').isVisible(),true,'Explore must be visible');
  const state=await page.evaluate(()=>window.WishWorld3D?.getState());
  assert.ok(state?.ready&&state.meshes>=30,'3D scene has physical landscape and structures');
  const initial=state.azimuth;
  await page.locator('#worldRight').click();
  const rotated=await page.evaluate(()=>window.WishWorld3D.getState());
  assert.ok(rotated.azimuth>initial,'camera must orbit in the publicly deployed experience');
  assert.deepEqual(failures,[],'no browser runtime errors');
  console.log('PASS live standalone CloudFront 3D:',viewport.width,'meshes',state.meshes);
  await page.close();
 }
} finally{await browser.close();}
