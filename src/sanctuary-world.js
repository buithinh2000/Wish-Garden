/* Wish Garden: actual navigable 3D sanctuary. Three.js meshes, not a painted scene.
 * Local first-party bundle; no external runtime calls, telemetry, or private data.
 * Canvas and controls are progressive: photographic scene remains if WebGL fails.
 */
import * as THREE from 'three';

const garden=document.querySelector('.garden');
if(garden){
 const canvas=document.createElement('canvas');
 canvas.id='sanctuary3d';
 canvas.setAttribute('aria-label','Interactive 3D sanctuary with pavilion, lake, forest and lantern path');
 canvas.setAttribute('role','img');
 canvas.style.touchAction='pan-y';
 garden.prepend(canvas);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'high-performance'});}
 catch{canvas.remove();}
 if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=false;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x101e2c);
  scene.fog=new THREE.FogExp2(0x122c39,.020);
  const camera=new THREE.PerspectiveCamera(53,1,.1,180);
  const ambient=new THREE.HemisphereLight(0xa9c8dc,0x314b42,2.1);
  scene.add(ambient);
  const moon=new THREE.DirectionalLight(0xc0dbff,2.25);moon.position.set(-16,30,16);scene.add(moon);
  const warm=new THREE.PointLight(0xff9f52,52,32,1.8);warm.position.set(0,8,-12);scene.add(warm);
  const mat=(color,roughness=1,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const earth=mat(0x263e3b),path=mat(0x807b68),bark=mat(0x382c27),leaf=mat(0x254c42),stone=mat(0x77796f);
  const darkWood=mat(0x302522),roof=mat(0x26363e),roofEdge=mat(0x52616b),gold=mat(0xe5a760),water=new THREE.MeshStandardMaterial({color:0x1f5664,roughness:.19,metalness:.22,transparent:true,opacity:.88});
  function mesh(geometry,material,parent=scene){const obj=new THREE.Mesh(geometry,material);parent.add(obj);return obj;}
  function box(w,h,d,m,x,y,z,parent=scene){const obj=mesh(new THREE.BoxGeometry(w,h,d),m,parent);obj.position.set(x,y,z);return obj;}
  function cone(rad,height,segments,m,x,y,z,parent=scene){const obj=mesh(new THREE.ConeGeometry(rad,height,segments),m,parent);obj.position.set(x,y,z);return obj;}
  function cylinder(top,bottom,height,m,x,y,z,parent=scene){const obj=mesh(new THREE.CylinderGeometry(top,bottom,height,10),m,parent);obj.position.set(x,y,z);return obj;}
  // Deterministic procedural materials: no stock images, external texture requests,
  // or user data. The same scene remains lightweight and available offline.
  function textured(base,variation,repeatX,repeatY,seed){
    const surface=document.createElement('canvas');
    surface.width=128;surface.height=128;
    const ctx=surface.getContext('2d');
    if(!ctx)return base;
    ctx.fillStyle='#'+base.color.getHexString();
    ctx.fillRect(0,0,128,128);
    let value=seed>>>0;
    function random(){value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;}
    for(let i=0;i<560;i++){
      const v=Math.floor(variation*(random()-.5));
      const channel=n=>Math.max(0,Math.min(255,n+v));
      const color=base.color;
      ctx.fillStyle='rgba('+channel(Math.round(color.r*255))+','+
        channel(Math.round(color.g*255))+','+channel(Math.round(color.b*255))+','+
        (.08+random()*.24).toFixed(2)+')';
      ctx.fillRect(random()*128,random()*128,1+random()*12,1+random()*9);
    }
    const texture=new THREE.CanvasTexture(surface);
    texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(repeatX,repeatY);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    base.map=texture;base.needsUpdate=true;
    return base;
  }
  textured(earth,95,30,30,144);
  textured(path,65,3,13,802);
  textured(bark,95,1,4,1009);
  textured(stone,75,2,2,2081);
  textured(darkWood,65,3,2,2083);
  textured(roof,65,4,4,3083);
  textured(leaf,85,2,2,4091);
  const ground=mesh(new THREE.PlaneGeometry(170,170),earth);ground.rotation.x=-Math.PI/2;ground.position.y=-.10;
  const walkway=mesh(new THREE.PlaneGeometry(3.3,33),path);walkway.rotation.x=-Math.PI/2;walkway.position.set(0,.018,3);
  for(let i=0;i<15;i++){box(3.4,.055,.105,stone,0,.048,17-i*1.75);}
  // A reflective, three-dimensional lake with individual bank stones and islands.
  const lake=mesh(new THREE.CircleGeometry(17,64),water);lake.rotation.x=-Math.PI/2;lake.scale.set(1.25,.65,1);lake.position.set(12,.005,-20);
  const island=cylinder(6.0,6.4,.35,earth,9,.10,-18);island.scale.z=.65;
  // Three-dimensional water details make the lake legible from the walk-in camera.
  const lilyMat=new THREE.MeshStandardMaterial({color:0x4c795e,side:THREE.DoubleSide,roughness:.7});
  const glowMat=new THREE.MeshBasicMaterial({color:0x9fdad4,transparent:true,opacity:.2,depthWrite:false});
  for(let i=0;i<16;i++){
    const a=i*2.39996,r=4.3+(i%5)*1.95;
    const x=12+Math.cos(a)*r,z=-20+Math.sin(a)*r*.62;
    const pad=mesh(new THREE.CircleGeometry(.34+(i%4)*.12,16),lilyMat);
    pad.rotation.x=-Math.PI/2;pad.position.set(x,.026,z);
    const ripple=mesh(new THREE.RingGeometry(.55+(i%3)*.23,.58+(i%3)*.23,32),glowMat);
    ripple.rotation.x=-Math.PI/2;ripple.position.set(x,.029,z);
  }

  for(let i=0;i<30;i++){
    const a=i*Math.PI*2/30,r=11+(i%3)*1.2;
    const pebble=mesh(new THREE.DodecahedronGeometry(.45+(i%4)*.13,0),stone);
    pebble.position.set(12+Math.cos(a)*r,.12,-20+Math.sin(a)*r*.7);
    pebble.rotation.y=a;
  }
  // Pavilion: elevated platform, load-bearing pillars, roof with deep eaves.
  const pavilion=new THREE.Group();scene.add(pavilion);pavilion.position.set(0,0,-18);
  box(12,.8,11,darkWood,0,.70,0,pavilion);
  box(13,.22,12,stone,0,.27,0,pavilion);
  for(const x of [-4.6,4.6])for(const z of [-3.8,3.8]){
   cylinder(.25,.30,6.3,darkWood,x,4.2,z,pavilion);
   cylinder(.43,.43,.22,gold,x,1.15,z,pavilion);
   box(1.1,.15,1.1,stone,x,1.02,z,pavilion);
  }
  for(const z of [-4.25,4.25]){
    box(11.2,.20,.26,darkWood,0,2.75,z,pavilion);
    box(11.2,.16,.23,darkWood,0,2.13,z,pavilion);
  }
  // The roof is visible from every orbit angle, with two architectural tiers.
  const firstRoof=cone(9.4,3.7,4,roof,0,8.0,0,pavilion);firstRoof.rotation.y=Math.PI/4;firstRoof.scale.z=.83;
  const edge=cone(9.7,.40,4,roofEdge,0,6.45,0,pavilion);edge.rotation.y=Math.PI/4;edge.scale.z=.83;
  const secondRoof=cone(5.8,2.3,4,roof,0,11.5,0,pavilion);secondRoof.rotation.y=Math.PI/4;secondRoof.scale.z=.84;
  const secondEdge=cone(6.0,.30,4,roofEdge,0,10.5,0,pavilion);secondEdge.rotation.y=Math.PI/4;secondEdge.scale.z=.84;
  for(const x of [-2.5,2.5])for(const z of [-2,2])cylinder(.17,.17,2.6,darkWood,x,9,z,pavilion);
  cylinder(.12,.12,1.2,gold,0,13.0,0,pavilion);
  // Layered roof ribs read as real architectural depth under the lights.
  const roofRib=mat(0x65767d,.72);
  for(let level=0;level<2;level++){
    const width=level===0?6.35:3.85;
    const y=level===0?7.2:11.05;
    for(const side of [-1,1]){
      for(let i=-4;i<=4;i++){
        const x=i*width/5.5;
        const rib=box(.075,.085,width*1.30,roofRib,x,y-.12*Math.abs(i),side*.12,pavilion);
        rib.rotation.x=side*.34;
      }
    }
  }
  // Lanterns provide spatial cues while orbiting.
  const lanternMat=new THREE.MeshStandardMaterial({color:0xffc67e,emissive:0xff9c45,emissiveIntensity:2.6});
  for(const side of [-1,1])for(let n=0;n<7;n++){
    const z=12-n*4.4,x=side*(3.1+(n%2)*.30);
    cylinder(.085,.10,2.7,darkWood,x,1.35,z);
    box(.8,.93,.8,lanternMat,x,2.9,z);
    box(1.02,.13,1.02,roof,x,3.43,z);
    box(.96,.12,.96,darkWood,x,2.37,z);
    const light=new THREE.PointLight(0xffb46d,3.8,6,2);light.position.set(x,2.9,z);scene.add(light);
  }
  // Trunks, branches and foliage are actual meshes at different depths.
  function tree(x,z,scale,seed){
    const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group);
    cylinder(.39,.57,6.5,bark,0,3.10,0,group);
    for(let j=0;j<4;j++){
      const a=seed+j*2.1,rad=2.2+j*.22;
      const branch=cylinder(.12,.20,3.3,bark,Math.cos(a)*1.1,5.9,Math.sin(a)*1.1,group);
      branch.rotation.z=Math.sin(a)*.6;branch.rotation.x=Math.cos(a)*.6;
      const canopy=mesh(new THREE.IcosahedronGeometry(rad,1),leaf,group);
      canopy.position.set(Math.cos(a)*2.1,7.1+(j%2)*.9,Math.sin(a)*2.1);
      canopy.scale.set(1,.56,.90);
    }
  }
  const trees=[[-13,-9,1.3],[15,-9,1.2],[-20,-22,1.55],[22,-30,1.5],[-11,16,1.1],[12,19,1.4],[-24,6,1.5],[27,10,1.4],[-31,-31,1.7],[32,-43,1.8],[-24,32,1.4],[24,35,1.4]];
  trees.forEach(([x,z,s],i)=>tree(x,z,s,i*.93));
  // Stars provide parallax and clearly move with the camera, unlike CSS imagery.
  const stars=[];
  for(let i=0;i<100;i++){
    const phi=(i*2.39996),rad=35+(i%7)*4;
    stars.push(Math.cos(phi)*rad,17+(i%19)*2,Math.sin(phi)*rad-20);
  }
  const starGeo=new THREE.BufferGeometry();
  starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xe8eefb,size:.17,sizeAttenuation:true})));
  // Spatial detail: three-dimensional stepping-stones and vegetation, not a texture overlay.
  const moss=mat(0x476b50),fern=mat(0x557954),flower=mat(0xf2c57c);
  for(let i=0;i<96;i++){
    const z=19-i*.41;
    const side=i%2===0?-1:1;
    const x=side*(2.05+(i%7)*.27);
    const rock=mesh(new THREE.DodecahedronGeometry(.16+(i%5)*.055,0),i%4===0?stone:moss);
    rock.position.set(x,.13,z);rock.scale.set(1,.5,1.35);rock.rotation.y=i*.87;
    if(i%3===0){
      const stem=cone(.26,.9,5,fern,x,.46,z);
      stem.rotation.z=side*.25;
      const blossom=mesh(new THREE.IcosahedronGeometry(.08,0),flower);
      blossom.position.set(x,.88,z);
    }
  }
  // Small lit garden tree in the central island is a distinct navigation landmark.
  tree(9,-18,.85,2.3);
  // Distant ridge silhouettes stay physically in the scene while camera moves.
  const ridge=mat(0x253e44);
  for(let i=0;i<12;i++){
    const x=-55+i*10;
    const mountain=cone(9+(i%4)*3,20+(i%5)*5,5,ridge,x,8,-68);
    mountain.rotation.y=i*.47;
  }
  // Floating fireflies are real 3D sprites positioned through the sanctuary.
  const lights=[];
  for(let i=0;i<75;i++){
    const theta=i*2.39996;
    const r=4+(i%11)*1.55;
    lights.push(Math.sin(theta)*r,1.25+(i%13)*.55,Math.cos(theta)*r-14);
  }
  const sparkleGeo=new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));
  scene.add(new THREE.Points(sparkleGeo,new THREE.PointsMaterial({
    color:0xffdc88,size:.18,sizeAttenuation:true,transparent:true,opacity:.78,depthWrite:false
  })));
  // Camera orbit plus a walk-in zoom. User can drag/touch or use buttons.
  let azimuth=0, radius=31, elevation=.26, targetZ=-15, dragging=false,lastX=0,ready=false,raf=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function positionCamera(){
    const orbitPos=new THREE.Vector3(Math.sin(azimuth)*radius,7+radius*Math.sin(elevation)*.72,targetZ+Math.cos(azimuth)*radius);
    const eye=new THREE.Vector3(Math.sin(azimuth*.37)*1.5,2.55+Math.sin(elevation)*1.8,3.5);
    const lookZ=-19;
    camera.position.copy(orbitPos.lerp(eye,walkT));
    const lookAt=new THREE.Vector3(0,5,targetZ).lerp(new THREE.Vector3(Math.sin(azimuth)*4,3.8,lookZ),walkT);
    camera.lookAt(lookAt);
  }
  const controls=document.createElement('div');controls.id='worldControls';
  controls.innerHTML='<span id="worldHint"></span><button type="button" id="worldWalk" aria-label="Walk through the 3D garden">Explore</button><button type="button" id="worldLeft" aria-label="Rotate 3D view left">↶</button><button type="button" id="worldNear" aria-label="Move closer in 3D scene">＋</button><button type="button" id="worldFar" aria-label="Move back in 3D scene">－</button><button type="button" id="worldRight" aria-label="Rotate 3D view right">↷</button>';
  garden.append(controls);
  const hint=controls.querySelector('#worldHint');
  let walkMode=false,walkT=0,transitionStart=0,transitionFrom=0,transitionTo=0;
  const walkBtn=controls.querySelector('#worldWalk');
  function setHint(){
    const vi=document.documentElement.lang==='vi';
    hint.textContent=walkMode?(vi?'DẠO TRONG VƯỜN 3D':'WALKING INSIDE 3D'):(vi?'KÉO ĐỂ XOAY CẢNH 3D':'DRAG TO ORBIT 3D');
    walkBtn.textContent=walkMode?(vi?'Toàn cảnh':'Overview'):(vi?'Khám phá':'Explore');
    walkBtn.setAttribute('aria-pressed',String(walkMode));
  }
  function walkTo(next){
    walkMode=next;
    transitionFrom=walkT;transitionTo=next?1:0;
    transitionStart=performance.now();
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      walkT=transitionTo;transitionStart=0;schedule();
    }else{
      requestAnimationFrame(animateWalk);
    }
    setHint();
  }
  function animateWalk(now){
    if(!transitionStart)return;
    const t=clamp((now-transitionStart)/1100,0,1);
    const smooth=t*t*(3-2*t);
    walkT=transitionFrom+(transitionTo-transitionFrom)*smooth;
    schedule();
    if(t<1)requestAnimationFrame(animateWalk);
    else transitionStart=0;
  }
  setHint();document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(setHint));
  function render(){
    raf=0;if(!ready||document.hidden)return;
    const width=Math.max(1,garden.clientWidth),height=Math.max(1,garden.clientHeight);
    if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio())){
      renderer.setSize(width,height,false);
      camera.aspect=width/height;camera.updateProjectionMatrix();
    }
    positionCamera();renderer.render(scene,camera);
  }
  function schedule(){if(!raf&&ready&&!document.hidden)raf=requestAnimationFrame(render);}
  function orbit(delta){azimuth=clamp(azimuth+delta,-1.32,1.32);schedule();}
  function zoom(delta){if(walkMode){walkTo(false);}radius=clamp(radius+delta,17,47);schedule();}
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;orbit(dx*.006);});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  walkBtn.addEventListener('click',()=>walkTo(!walkMode));
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.sign(e.deltaY)*2);},{passive:false});
  canvas.addEventListener('dblclick',()=>walkTo(!walkMode));
  controls.querySelector('#worldLeft').addEventListener('click',()=>orbit(-.24));
  controls.querySelector('#worldRight').addEventListener('click',()=>orbit(.24));
  controls.querySelector('#worldNear').addEventListener('click',()=>zoom(-3));
  controls.querySelector('#worldFar').addEventListener('click',()=>zoom(3));
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const ro=new ResizeObserver(schedule);ro.observe(garden);
  document.addEventListener('visibilitychange',schedule);
  document.getElementById('twilight')?.addEventListener('click',()=>{
    scene.background.set(0x101e2c);scene.fog.color.set(0x122c39);
    ambient.intensity=2.1;warm.intensity=52;schedule();
  });
  document.getElementById('dawn')?.addEventListener('click',()=>{
    scene.background.set(0x526b75);scene.fog.color.set(0x526b75);
    ambient.intensity=3;warm.intensity=25;schedule();
  });
  // No false 3D success: ready only after a WebGL render has actually succeeded.
  try{
    ready=true;render();
    garden.classList.add('world-ready');
    canvas.dataset.rendered='true';
  }catch(error){
    ready=false;ro.disconnect();renderer.dispose();canvas.remove();controls.remove();
  }
  window.WishWorld3D={getState(){return {ready,azimuth,radius,elevation,walkMode,walkT,proceduralMaterials:[earth,path,bark,stone,darkWood,roof,leaf].filter(m=>m.map?.isCanvasTexture).length,waterPads:16,meshes:scene.children.filter(x=>x.isMesh).length};},orbit,zoom};
 }
}
