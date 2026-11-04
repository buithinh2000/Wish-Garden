import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const garden=document.querySelector('.garden');
const oldCanvas=document.getElementById('visitor3d');
if(garden&&oldCanvas){
 const canvas=document.createElement('canvas');
 canvas.id='visitorRig';
 canvas.className='visitor3d visitor-rig';
 canvas.setAttribute('aria-hidden','true');
 oldCanvas.insertAdjacentElement('afterend',canvas);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let renderer;
 try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'}); }
 catch {canvas.remove();}
 if(renderer){
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
   renderer.setClearColor(0x000000,0);
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   const scene=new THREE.Scene();
   const camera=new THREE.OrthographicCamera(-1.2,1.2,1.95,-1.95,.1,100);
   camera.position.set(0,1.65,6);
   camera.lookAt(0,1.35,0);
   scene.add(new THREE.HemisphereLight(0xb2d9ff,0x695037,2.3));
   const lamp=new THREE.DirectionalLight(0xffc27b,2.5);
   lamp.position.set(-3,6,5);scene.add(lamp);
   const rim=new THREE.DirectionalLight(0x8fd6fa,1.25);
   rim.position.set(3,4,-5);scene.add(rim);
   let mixer=null,model=null,current='idle',active=null,raf=0,last=performance.now(),walkUntil=0,theme='night';
   const clips=new Map();
   const clock=new THREE.Clock();
   const setPose=(pose)=>{
     current=pose;
     if(!mixer)return;
     const desired=clips.get(pose==='walk'?'walk':'idle')||clips.get('idle')||[...clips.values()][0];
     if(desired&&active!==desired){
       const next=mixer.clipAction(desired);
       if(active)active.fadeOut(.25);
       next.reset().fadeIn(.25).play();active=desired;
     }
     if(pose==='pray'&&model){model.rotation.y=Math.PI;model.rotation.z=-.035;}
     else if(model){model.rotation.y=Math.PI;model.rotation.z=0;}
     renderOnce();
   };
   function size(){
     const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
     if(w!==canvas.width||h!==canvas.height){
       renderer.setSize(w,h,false);
       camera.left=-1.3*w/h;camera.right=1.3*w/h;
       camera.top=1.3;camera.bottom=-1.3;
       camera.updateProjectionMatrix();
     }
   }
   function frame(){
      raf=0;
      if(document.hidden||!model)return;
      size();
      const dt=Math.min(.07,clock.getDelta());
      if(mixer)mixer.update(dt);
      if(current==='pray'&&model){model.rotation.x=-.04;}
      renderer.render(scene,camera);
      if(!reduced.matches||current==='walk'||performance.now()<walkUntil)raf=requestAnimationFrame(frame);
   }
   function renderOnce(){if(model&&!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
   const controller={
      setPose(p){if(p==='walk')walkUntil=performance.now()+1450;setPose(p);},
      getPose(){return current;},
      setLook(v){theme=v;if(model)model.traverse(o=>{if(o.isMesh&&o.material?.color&&o.userData.originalColor){o.material.color.copy(o.userData.originalColor).multiplyScalar(v==='light'?1.25:v==='warm'?.92:1);}});renderOnce();},
      getLook(){return theme;},
      setReduced(){renderOnce();}
   };
   const loader=new GLTFLoader();
   loader.load('assets/visitor-rig.glb',gltf=>{
     model=gltf.scene;
     model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material?.color){o.material=o.material.clone();o.userData.originalColor=o.material.color.clone();}}});
     const bounds=new THREE.Box3().setFromObject(model);
     const box=new THREE.Vector3();bounds.getSize(box);
     const center=new THREE.Vector3();bounds.getCenter(center);
     model.position.sub(center);
     const scale=2.9/Math.max(box.y,.001);
     model.scale.setScalar(scale);
     model.position.y+=box.y*scale/2-1.35;
     model.rotation.y=Math.PI;
     scene.add(model);
     mixer=new THREE.AnimationMixer(model);
     for(const clip of gltf.animations){clips.set(clip.name.toLowerCase(),clip); }
     if(!clips.has('idle')||!clips.has('walk')){console.warn('Wish Garden rig lacks idle/walk clips; fallback active');canvas.remove();renderer.dispose();return;}
     window.WishAvatar3D=controller;
     garden.classList.add('rig-ready');
     setPose(garden.classList.contains('arrived')?'pray':garden.classList.contains('walking')?'walk':'idle');
     renderOnce();
   },undefined,err=>{console.warn('Wish Garden rig fallback',err);canvas.remove();renderer.dispose();});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock.getDelta();renderOnce();}});
   reduced.addEventListener?.('change',renderOnce);
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();garden.classList.remove('rig-ready');cancelAnimationFrame(raf);raf=0;});
 }
}
