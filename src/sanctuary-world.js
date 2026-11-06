/* Wish Garden: actual navigable 3D sanctuary. Three.js meshes, not a painted scene.
 * Local first-party bundle; no external runtime calls, telemetry, or private data.
 * Canvas and controls are progressive: photographic scene remains if WebGL fails.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const garden=document.querySelector('.garden');
if(garden){
 const canvas=document.createElement('canvas');
 canvas.id='sanctuary3d';
 canvas.setAttribute('aria-label','Interactive 3D sanctuary with pavilion, lake, forest and lantern path');
 canvas.setAttribute('role','img');
 canvas.style.touchAction='pan-y';
 garden.prepend(canvas);
 let renderer;
 // A high-performance GPU preference can reject otherwise viable Mac/Chrome contexts.
 // Try a reduced-cost context before using the independent Canvas2D fallback.
 const attempts=[
   {antialias:true,powerPreference:'default'},
   {antialias:false,powerPreference:'low-power',precision:'mediump'}
 ];
 for(const config of attempts){
   try{
     renderer=new THREE.WebGLRenderer({canvas,alpha:false,...config,failIfMajorPerformanceCaveat:false});
     break;
   }catch(error){
     window.WishWorldWebGLError=String(error?.message||'WebGL context unavailable').slice(0,180);
   }
 }
 if(!renderer){canvas.remove();}
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
  const ground=mesh(new THREE.PlaneGeometry(170,170),earth);ground.rotation.x=-Math.PI/2;ground.position.y=-.10;
  const walkway=mesh(new THREE.PlaneGeometry(3.3,33),path);walkway.rotation.x=-Math.PI/2;walkway.position.set(0,.018,3);
  for(let i=0;i<15;i++){box(3.4,.055,.105,stone,0,.048,17-i*1.75);}
  // A reflective, three-dimensional lake with individual bank stones and islands.
  const lake=mesh(new THREE.CircleGeometry(17,64),water);lake.rotation.x=-Math.PI/2;lake.scale.set(1.25,.65,1);lake.position.set(12,.005,-20);
  const island=cylinder(6.0,6.4,.35,earth,9,.10,-18);island.scale.z=.65;
  for(let i=0;i<30;i++){
    const a=i*Math.PI*2/30,r=11+(i%3)*1.2;
    const pebble=mesh(new THREE.DodecahedronGeometry(.45+(i%4)*.13,0),stone);
    pebble.position.set(12+Math.cos(a)*r,.12,-20+Math.sin(a)*r*.7);
    pebble.rotation.y=a;
  }
  // Pavilion: elevated platform, load-bearing pillars, roof with deep eaves.
  const pavilion=new THREE.Group();scene.add(pavilion);pavilion.position.set(-29,0,-49);pavilion.scale.setScalar(.40);
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
  // The focal sanctuary is an authored CC0 lotus garden GLB, not a
  // procedural roof. The original lightweight pavilion is only a fallback.
  let sanctuarySource='fallback',sanctuaryVisible=false;
  const sanctuaryLoader=new GLTFLoader();
  sanctuaryLoader.load('assets/sanctuary/lotus-pond-pavilion.glb',gltf=>{
    const lotus=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(lotus);
    const dimensions=bounds.getSize(new THREE.Vector3());
    if(!Number.isFinite(dimensions.x)||!Number.isFinite(dimensions.y)||dimensions.x<.5||dimensions.y<.5)throw Error('Invalid pavilion dimensions');
    const center=bounds.getCenter(new THREE.Vector3());
    const scale=Math.min(.52,9/Math.max(dimensions.x,dimensions.z));
    lotus.scale.setScalar(scale);
    lotus.position.set(-29-center.x*scale,-bounds.min.y*scale,-49-center.z*scale);
    scene.add(lotus);
    scene.remove(pavilion);
    sanctuarySource='cc0-lotus-glb';sanctuaryVisible=true;
    schedule();
  },undefined,()=>{sanctuarySource='fallback';schedule();});
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
  function tree(x,z,scale,seed,hero=false){
    const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group);
    cylinder(.39,.57,6.5,bark,0,3.10,0,group);
    for(let j=0;j<4;j++){
      const a=seed+j*2.1,rad=2.2+j*.22;
      const branch=cylinder(.12,.20,3.3,bark,Math.cos(a)*1.1,5.9,Math.sin(a)*1.1,group);
      branch.rotation.z=Math.sin(a)*.6;branch.rotation.x=Math.cos(a)*.6;
      const canopyMaterial=hero?new THREE.MeshStandardMaterial({color:0x367853,emissive:0x1f5c42,emissiveIntensity:.28,roughness:1}):leaf;
      const canopy=mesh(new THREE.IcosahedronGeometry(rad,hero?2:1),canopyMaterial,group);
      canopy.position.set(Math.cos(a)*2.1,7.1+(j%2)*.9,Math.sin(a)*2.1);
      canopy.scale.set(hero?1.25:1,hero?.78:.56,hero?1.13:.90);
    }
    if(hero){
      for(let k=0;k<9;k++){
        const angle=k*2.39996,r=1.4+(k%3)*.58;
        const cluster=mesh(new THREE.IcosahedronGeometry(1.1+(k%3)*.28,1),
          new THREE.MeshStandardMaterial({color:k%2?0x427e5d:0x58906b,emissive:0x24513b,emissiveIntensity:.32,roughness:1}),group);
        cluster.position.set(Math.sin(angle)*r,7.9+(k%4)*.69,Math.cos(angle)*r);
      }
    }
  }
  const trees=[[-13,-9,1.3],[15,-9,1.2],[-20,-22,1.55],[22,-30,1.5],[-11,16,1.1],[12,19,1.4],[-24,6,1.5],[27,10,1.4],[-31,-31,1.7],[32,-43,1.8],[-24,32,1.4],[24,35,1.4]];
  const proceduralTrees=[];
  function addFallbackTree(x,z,scale,seed){
    const before=scene.children.length;
    tree(x,z,scale,seed);
    proceduralTrees.push(scene.children[before]);
  }
  trees.forEach(([x,z,scale],i)=>addFallbackTree(x,z,scale,i*.93));
  // Kenney Nature Kit 2.1, CC0: load real authored GLB trees rather than
  // generating canopy meshes. Keep the local procedural trees only on errors.
  let natureSource='fallback',natureTreeCount=0;
  const natureLoader=new GLTFLoader();
  Promise.all(['tree_default','tree_oak'].map(name=>new Promise((resolve,reject)=>{
    natureLoader.load('assets/nature/'+name+'.glb',gltf=>resolve(gltf.scene),undefined,reject);
  }))).then(models=>{
    const replacements=[];
    for(let i=0;i<trees.length;i++){
      const [x,z,scale]=trees[i],asset=models[i%models.length].clone(true);
      const box=new THREE.Box3().setFromObject(asset),height=box.max.y-box.min.y;
      if(!Number.isFinite(height)||height<=0)throw Error('Invalid nature GLB bounds');
      const finalScale=(7.5*scale)/height;
      asset.scale.multiplyScalar(finalScale);
      asset.position.set(x-(box.min.x+box.max.x)*.5*finalScale,-box.min.y*finalScale,z-(box.min.z+box.max.z)*.5*finalScale);
      asset.rotation.y=i*.43;replacements.push(asset);
    }
    for(const old of proceduralTrees)scene.remove(old);
    for(const replacement of replacements)scene.add(replacement);
    natureSource='kenney-cc0-glb';natureTreeCount=replacements.length;
    schedule();
  }).catch(()=>{natureSource='fallback';schedule();});
  
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
  // The Wishing Tree is the central place of reflection for every culture.
  // Use the existing light-weight tree geometry on the island, not an altar or shrine.
  tree(0,-18,2.15,2.3,true);
  const treeGround=mesh(new THREE.CircleGeometry(8,48),new THREE.MeshStandardMaterial({color:0x334f3d,roughness:1}));
  treeGround.rotation.x=-Math.PI/2;treeGround.position.set(0,.08,-18);
  const wishingTreeLight=new THREE.PointLight(0xffdda1,8,18,2);
  wishingTreeLight.position.set(0,11,-18);scene.add(wishingTreeLight);
  // Universal, non-religious tree-of-hopes: a small original constellation of
  // lights woven around the real 3D tree, activated by a visitor's wish.
  const hopeTreeLights=new THREE.Group();hopeTreeLights.position.set(0,0,-18);scene.add(hopeTreeLights);
  const hopeNodes=[];
  const hopeMat=new THREE.MeshBasicMaterial({color:0xffd789,transparent:true,opacity:.84,depthWrite:false});
  for(let i=0;i<64;i++){
    const theta=i*2.399963229728653;
    const radius=1.1+(i%4)*.37;
    const node=mesh(new THREE.SphereGeometry(.10+(i%3)*.045,8,6),hopeMat.clone(),hopeTreeLights);
    node.position.set(Math.cos(theta)*radius*2.7,10+(i%13)*.81,Math.sin(theta)*radius*2.5);
    hopeNodes.push(node);
  }
  let treeAwakeUntil=0,treeAwakenCount=0;
  function awakenTree(){
    treeAwakenCount++;treeAwakeUntil=performance.now()+2800;
    schedule();
  }
  // The tree never feels abandoned. These are intentionally stylised
  // AMBIENT FIGURES, NOT accounts, online players or simulated real users.
  // Static locally rendered figures cost zero network/API calls.
  const ambientCompanions=[];
  const companionColors=[0x637d84,0x8f7c87,0x657f69,0x9a846c];
  const companionSpots=[[-4.7,-13.8,0.1],[4.8,-14.2,-0.1],[-5.8,-20.4,0.18],[5.6,-21.4,-0.2]];
  for(let i=0;i<companionSpots.length;i++){
    const [x,z,angle]=companionSpots[i];
    const group=new THREE.Group();group.position.set(x,.30,z);group.rotation.y=angle;scene.add(group);
    const bodyMat=new THREE.MeshStandardMaterial({color:companionColors[i],roughness:1,transparent:true,opacity:.78});
    const headMat=new THREE.MeshStandardMaterial({color:0xb6a894,roughness:1,transparent:true,opacity:.78});
    const torso=mesh(new THREE.CapsuleGeometry(.28,.73,4,7),bodyMat,group);
    torso.position.set(0,1.32,0);
    const head=mesh(new THREE.SphereGeometry(.23,9,7),headMat,group);
    head.position.set(0,2.05,0);
    for(const side of [-1,1]){
      const arm=mesh(new THREE.CapsuleGeometry(.075,.57,4,6),bodyMat,group);
      arm.position.set(side*.37,1.30,.04);arm.rotation.z=side*.14;
      const leg=mesh(new THREE.CapsuleGeometry(.105,.64,4,6),bodyMat,group);
      leg.position.set(side*.15,.53,.01);
    }
    group.lookAt(new THREE.Vector3(0,.3,-18));
    ambientCompanions.push(group);
  }
  // A visitor can choose solitude. This preference is kept only in this
  // browser and is never treated as a real community presence metric.
  const companionsKey='wg-ambient-companions-v1';
  let companionsVisible=true;
  try{companionsVisible=localStorage.getItem(companionsKey)!=='hidden';}catch{}
  function setCompanionsVisible(visible){
    companionsVisible=!!visible;
    for(const figure of ambientCompanions)figure.visible=companionsVisible;
    try{localStorage.setItem(companionsKey,companionsVisible?'shown':'hidden');}catch{}
    schedule();
  }
  ambientCompanions.forEach(figure=>{figure.visible=companionsVisible;});
  // Distant ridge silhouettes stay physically in the scene while camera moves.
  const ridge=mat(0x253e44);
  for(let i=0;i<12;i++){
    const x=-55+i*10;
    const mountain=cone(9+(i%4)*3,20+(i%5)*5,5,ridge,x,8,-68);
    mountain.rotation.y=i*.47;
  }
  // The standalone world previously had no human at all. Reuse the first-party
  // bundled civilian visitor, with a lightweight mannequin only if asset fails.
  const visitorGroup=new THREE.Group();scene.add(visitorGroup);
  let visitorSource='loading',visitorModel=null,visitorMixer=null,visitorAnimationTime=0,walkAnimateUntil=0,lastRenderTime=0;
  function createVisitorFallback(){
    const clothing=mat(0x745a75),skin=mat(0xc79978),boots=mat(0x3b343e);
    const body=new THREE.Group();
    const torso=mesh(new THREE.CapsuleGeometry(.43,.93,5,9),clothing,body);torso.position.y=1.45;
    const head=mesh(new THREE.SphereGeometry(.31,14,10),skin,body);head.position.y=2.48;
    for(const x of [-.25,.25]){
      const leg=mesh(new THREE.CapsuleGeometry(.14,.72,4,8),boots,body);leg.position.set(x,.62,0);
      const arm=mesh(new THREE.CapsuleGeometry(.12,.66,4,8),clothing,body);arm.position.set(x*2,1.5,0);arm.rotation.z=x>0?.20:-.20;
    }
    visitorGroup.add(body);visitorModel=body;visitorSource='fallback';
  }
  const humanLoader=new GLTFLoader();
  humanLoader.load('assets/visitor-human.glb',gltf=>{
    const human=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(human);
    const height=Math.max(bounds.max.y-bounds.min.y,.01);
    const scale=2.65/height;
    const center=bounds.getCenter(new THREE.Vector3());
    human.scale.setScalar(scale);
    human.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
    human.rotation.y=Math.PI;
    visitorGroup.add(human);visitorModel=human;visitorSource='civilian-glb';
    if(gltf.animations.length){visitorMixer=new THREE.AnimationMixer(human);const clip=gltf.animations.find(a=>/walk/i.test(a.name))||gltf.animations[0];visitorMixer.clipAction(clip).play();visitorMixer.update(0);}
    schedule();
  },undefined,()=>{createVisitorFallback();schedule();});
  // Camera orbit plus a walkable, bounded path toward the pavilion.
  // The visitor moves within the lantern corridor, not through the building or lake.
  const showcase=document.body.classList.contains('world-showcase');
  let azimuth=0, radius=window.matchMedia('(max-width:650px)').matches?38:34, elevation=.08, targetZ=-18, dragging=false,lastX=0,ready=false,raf=0;
  let walkDistance=0, walkLateral=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function positionCamera(){
    const orbitPos=new THREE.Vector3(Math.sin(azimuth)*radius,7+radius*Math.sin(elevation)*.72,targetZ+Math.cos(azimuth)*radius);
    const eye=new THREE.Vector3(walkLateral,2.55+Math.sin(elevation)*1.8,12-walkDistance);
    const lookZ=-19;
    // Keep a visible third-person visitor between the player camera and pavilion.
    visitorGroup.position.set(walkLateral,0,(walkT>.5?8-walkDistance:-9));
    visitorGroup.rotation.y=azimuth*.22;
    camera.position.copy(orbitPos.lerp(eye,walkT));
    const lookAt=new THREE.Vector3(0,9,targetZ).lerp(new THREE.Vector3(walkLateral+Math.sin(azimuth)*3.5,3.15,lookZ-walkDistance*.24),walkT);
    camera.lookAt(lookAt);
  }
  const controls=document.createElement('div');controls.id='worldControls';
  controls.innerHTML='<span id="worldHint"></span><button type="button" id="worldForward" aria-label="Walk forward toward the pavilion" hidden>↑</button><button type="button" id="worldBack" aria-label="Walk backward along the lantern path" hidden>↓</button><button type="button" id="worldWalk" aria-label="Walk through the 3D garden">Explore</button><button type="button" id="worldLeft" aria-label="Rotate 3D view left">↶</button><button type="button" id="worldNear" aria-label="Move closer in 3D scene">＋</button><button type="button" id="worldFar" aria-label="Move back in 3D scene">－</button><button type="button" id="worldRight" aria-label="Rotate 3D view right">↷</button>';
  // The garden is a place for reflection, not a game dashboard.
  // Keep walking optional; hide technical orbit controls until requested.
  const viewBtn=document.createElement('button');
  viewBtn.type='button';viewBtn.id='worldOptions';
  viewBtn.textContent='View';viewBtn.setAttribute('aria-label','Show garden view controls');
  viewBtn.setAttribute('aria-expanded','false');
  controls.prepend(viewBtn);
  const hideStyle=document.createElement('style');
  hideStyle.textContent='#worldControls [hidden]{display:none!important}#worldOptions{font-size:12px!important;min-width:53px!important;letter-spacing:.01em}';
  document.head.append(hideStyle);
  garden.append(controls);
  const hint=controls.querySelector('#worldHint');
  let walkMode=false,walkT=0,transitionStart=0,transitionFrom=0,transitionTo=0,viewOptionsOpen=false;
  const walkBtn=controls.querySelector('#worldWalk');
  function setHint(){
    const vi=document.documentElement.lang==='vi';
    hint.textContent=walkMode?(vi?'↑ ↓ / W S ĐỂ ĐI':'↑ ↓ / W S TO WALK'):(vi?'KÉO ĐỂ XOAY CẢNH 3D':'DRAG TO ORBIT 3D');
    hint.hidden=!viewOptionsOpen;
    for(const id of ['worldLeft','worldRight','worldNear','worldFar'])
      controls.querySelector('#'+id).hidden=!viewOptionsOpen;
    controls.querySelector('#worldForward').hidden=!walkMode;
    controls.querySelector('#worldBack').hidden=!walkMode;
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
  viewBtn.addEventListener('click',()=>{
    viewOptionsOpen=!viewOptionsOpen;
    viewBtn.setAttribute('aria-expanded',String(viewOptionsOpen));
    viewBtn.textContent=viewOptionsOpen?'Hide':'View';
    setHint();
  });
  setHint();document.getElementById('lang')?.addEventListener('click',()=>queueMicrotask(setHint));
  // A symbolic wish becomes an actual light in the 3D sanctuary.
  // Small and cheap: no extra model, texture, service or particle engine.
  const wishLight=new THREE.Mesh(
    new THREE.SphereGeometry(.48,12,8),
    new THREE.MeshBasicMaterial({color:0xffe2a0,transparent:true,opacity:0})
  );
  wishLight.visible=false;scene.add(wishLight);
  let wishLightUntil=0,wishLightStart=0,wishReleaseCount=0;
  // Preserve the user's exploration point, but place the altar in view
  // during prayer. No teleport/game flow, GPS, tracking or scene reload.
  let ritualCamera=null;
  function focusShrine(){
    if(ritualCamera)return;
    ritualCamera={azimuth,radius,elevation,targetZ,walkMode,walkT,walkDistance,walkLateral};
    azimuth=.08;radius=window.matchMedia('(max-width:650px)').matches?38:30;elevation=.08;targetZ=-18;
    walkMode=false;walkT=0;transitionStart=0;
    setHint();schedule();
  }
  function restoreView(){
    if(!ritualCamera)return;
    ({azimuth,radius,elevation,targetZ,walkMode,walkT,walkDistance,walkLateral}=ritualCamera);
    ritualCamera=null;transitionStart=0;
    setHint();schedule();
  }
  function bless(){
    wishReleaseCount++;
    awakenTree();
    wishLightStart=performance.now();
    wishLightUntil=wishLightStart+2700;
    wishLight.visible=true;
    wishLight.material.opacity=.92;
    schedule();
  }
  function render(now=performance.now()){
    raf=0;if(!ready||document.hidden)return;
    const moving=walkMode&&now<walkAnimateUntil&&!motion.matches;
    if(visitorMixer&&moving){const elapsed=lastRenderTime?Math.min(.18,Math.max(.06,(now-lastRenderTime)/1000)):.12;visitorMixer.update(elapsed);visitorAnimationTime+=elapsed;}
    lastRenderTime=now;
    if(now<treeAwakeUntil){
      const t=(treeAwakeUntil-now)/2800;
      hopeNodes.forEach((node,i)=>{
        node.material.opacity=.58+Math.max(0,Math.sin(now*.004+i))*.40+.10*t;
        node.scale.setScalar(1+(.3*Math.sin(now*.003+i)));
      });
      wishingTreeLight.intensity=8+5*t;
    }else{
      hopeNodes.forEach(node=>{node.material.opacity=.78;node.scale.setScalar(1);});
      wishingTreeLight.intensity=8;
    }
    const width=Math.max(1,garden.clientWidth),height=Math.max(1,garden.clientHeight);
    if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio())){
      renderer.setSize(width,height,false);
      camera.aspect=width/height;camera.updateProjectionMatrix();
    }
    if(wishLight.visible){
      const progress=Math.min(1,(now-wishLightStart)/2700);
      // A private wish rises from the Wishing Tree, not from a temple altar.
      wishLight.position.set(Math.sin(progress*7)*.5,11+progress*19,-18);
      wishLight.scale.setScalar(.65+Math.sin(progress*Math.PI)*.8);
      wishLight.material.opacity=(1-progress)*.92;
      if(now>=wishLightUntil)wishLight.visible=false;
    }
    positionCamera();renderer.render(scene,camera);
    if(moving||wishLight.visible||now<treeAwakeUntil) schedule();
  }
  function schedule(){if(!raf&&ready&&!document.hidden)raf=requestAnimationFrame(render);}
  function orbit(delta){azimuth=clamp(azimuth+delta,-1.32,1.32);schedule();}
  function zoom(delta){if(walkMode){walkTo(false);}radius=clamp(radius+delta,17,47);schedule();}
  function moveOnPath(delta){if(!walkMode)return;const next=clamp(walkDistance+delta,0,23);if(next!==walkDistance){walkDistance=next;walkAnimateUntil=performance.now()+3200;lastRenderTime=0;}schedule();}
  function strafe(delta){if(!walkMode)return;walkLateral=clamp(walkLateral+delta,-1.15,1.15);schedule();}
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;orbit(dx*.006);});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  walkBtn.addEventListener('click',()=>walkTo(!walkMode));
  controls.querySelector('#worldForward').addEventListener('click',()=>moveOnPath(1.8));
  controls.querySelector('#worldBack').addEventListener('click',()=>moveOnPath(-1.8));
  window.addEventListener('keydown',event=>{
    if(!ready||!walkMode||event.repeat||event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
    const key=event.key.toLowerCase();
    if(key==='w'||key==='arrowup'){moveOnPath(1.8);event.preventDefault();}
    else if(key==='s'||key==='arrowdown'){moveOnPath(-1.8);event.preventDefault();}
    else if(key==='a'){strafe(-.4);event.preventDefault();}
    else if(key==='d'){strafe(.4);event.preventDefault();}
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.sign(e.deltaY)*2);},{passive:false});
  canvas.addEventListener('dblclick',()=>walkTo(!walkMode));
  controls.querySelector('#worldLeft').addEventListener('click',()=>orbit(-.24));
  controls.querySelector('#worldRight').addEventListener('click',()=>orbit(.24));
  controls.querySelector('#worldNear').addEventListener('click',()=>zoom(-3));
  controls.querySelector('#worldFar').addEventListener('click',()=>zoom(3));
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const ro=new ResizeObserver(schedule);ro.observe(garden);
  document.addEventListener('visibilitychange',schedule);
  // Change the 3D world with the viewer's actual device-local clock.
  // No location permission, paid weather API or user data transfer.
  function applyDaylight(){
    const daylight=window.WishDaylight?.getState();
    const phase=daylight?.phase||'night';
    const tones={
      night:{sky:0x101e2c,fog:0x122c39,ambient:2.1,moon:2.25,warm:52,exposure:1.12},
      dawn:{sky:0x947269,fog:0xac8876,ambient:2.6,moon:2.0,warm:32,exposure:1.22},
      day:{sky:0x79aec5,fog:0x9cc9cd,ambient:3.2,moon:3.0,warm:10,exposure:1.28},
      dusk:{sky:0xb16c6d,fog:0x8b636a,ambient:2.4,moon:1.8,warm:42,exposure:1.15}
    };
    const tone=tones[phase]||tones.night;
    scene.background.setHex(tone.sky);scene.fog.color.setHex(tone.fog);
    ambient.intensity=tone.ambient;moon.intensity=tone.moon;warm.intensity=tone.warm;
    renderer.toneMappingExposure=tone.exposure;schedule();
  }
  window.addEventListener('wish-daylight-change',applyDaylight);
  applyDaylight();
  // No false 3D success: ready only after a WebGL render has actually succeeded.
  try{
    ready=true;render();
    garden.classList.add('world-ready');
    canvas.dataset.rendered='true';
  }catch(error){
    ready=false;
    window.WishWorldWebGLError=String(error?.message||'WebGL scene initialization failed').slice(0,180);
    ro.disconnect();renderer.dispose();canvas.remove();controls.remove();
  }
  window.WishWorld3D={getState(){return {ready,azimuth,radius,elevation,walkMode,walkT,walkDistance,walkLateral,visitorSource,visitorVisible:!!visitorModel,visitorAnimated:!!visitorMixer,visitorAnimationTime,daylight:window.WishDaylight?.getState().phase||'night',natureSource,natureTreeCount,sanctuarySource,sanctuaryVisible,wishLightVisible:wishLight.visible,wishReleaseCount,ritualFocus:!!ritualCamera,treeAwakenCount,heroTreeCenter:[0,-18],heroTreeScale:2.15,ambientCompanionCount:ambientCompanions.length,ambientCompanionsVisible:companionsVisible,ambientCompanionsSimulated:true,meshes:scene.children.filter(x=>x.isMesh).length};},orbit,zoom,bless,focusShrine,restoreView,awakenTree,setCompanionsVisible};
 }
}
