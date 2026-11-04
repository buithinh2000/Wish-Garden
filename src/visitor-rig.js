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
 let userReduced=reduced.matches;
 let renderer;
 try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'}); }
 catch {canvas.remove();}
 if(renderer){
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
   renderer.setClearColor(0x000000,0);
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   const scene=new THREE.Scene();
   const camera=new THREE.OrthographicCamera(-1.2,1.2,1.95,-1.95,.1,100);
   camera.position.set(0,1.5,6);
   camera.lookAt(0,1.5,0);
   scene.add(new THREE.HemisphereLight(0xb2d9ff,0x695037,2.3));
   const lamp=new THREE.DirectionalLight(0xffc27b,2.5);
   lamp.position.set(-3,6,5);scene.add(lamp);
   const rim=new THREE.DirectionalLight(0x8fd6fa,1.25);
   rim.position.set(3,4,-5);scene.add(rim);
   let mixer=null,model=null,current='idle',active=null,raf=0,last=performance.now(),walkUntil=0,theme='night',limbs=null,hands=null,prayerSolved=false,prayerDistance=null;
   const clips=new Map();
   const clock=new THREE.Clock();
   const setPose=(pose)=>{
     current=pose;prayerSolved=false;
     if(!mixer)return;
     const desired=pose==='walk'?([...clips].find(([name])=>name.includes('walk'))?.[1]||clips.get('idle')):([...clips].find(([name])=>name.includes('idle'))?.[1]||clips.get('idle')||[...clips.values()][0]);
     if(desired&&active?.getClip()!==desired){
       const next=mixer.clipAction(desired);
       if(active)active.fadeOut(.25);
       next.reset().fadeIn(.25).play();active=next;
     }
     if(pose==='pray'&&model){model.rotation.y=Math.PI-.26;model.rotation.z=-.035;}
     else if(model){model.rotation.y=Math.PI;model.rotation.z=0;}
     renderOnce();
   };
   function size(){
     const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
     if(w!==canvas.width||h!==canvas.height){
       renderer.setSize(w,h,false);
       camera.left=-1.75*w/h;camera.right=1.75*w/h;
       camera.top=1.75;camera.bottom=-1.75;
       camera.updateProjectionMatrix();
     }
   }
   function frame(){
      raf=0;
      if(document.hidden||!model)return;
      size();
      const dt=Math.min(.07,clock.getDelta());
      if(mixer&&current!=='pray')mixer.update(dt);
      else if(mixer&&!prayerSolved)mixer.update(0);
      // The original idle pose is a wide-arm game stance. Correct shoulders and
      // elbows AFTER animation sampling so the visitor rests arms at their side.
      if(limbs){
        const walking=current==='walk'&&!userReduced?Math.sin(performance.now()*.008)*.18:0;
        const praying=current==='pray';
        if(limbs.rightShoulder.name==='upperarm_r'){
          // MakeHuman arm bones extend along local +Y: neutral shoulders hang down.
          limbs.rightShoulder.rotation.z=praying?.98:1.04+walking;
          limbs.leftShoulder.rotation.z=praying?-.98:-1.04-walking;
          limbs.rightElbow.rotation.x=praying?-1.3:.03;
          limbs.leftElbow.rotation.x=praying?-1.3:.03;
          limbs.rightElbow.rotation.z=praying?1.05:0;
          limbs.leftElbow.rotation.z=praying?-1.05:0;
        }else{
          limbs.rightShoulder.rotation.z=praying?-.38:-1.18+walking;
          limbs.leftShoulder.rotation.z=praying?.38:1.18-walking;
          limbs.rightElbow.rotation.z=praying?2.45:.16;
          limbs.leftElbow.rotation.z=praying?-2.45:-.16;
        }
      }
      if(model)model.rotation.x=current==='pray'?.09:0;
      if(current==='pray'&&!prayerSolved){
        prayerSolved=true;
        if(limbs&&hands){
          // Two-arm inverse kinematics: measure the actual hand bones, not guessed
          // shoulder angles. A shared point just in front of the chest receives
          // both palms. This happens once on entering prayer, so mobile browsers
          // do not solve a skeleton on every animation frame.
          model.updateMatrixWorld(true);
          const l=limbs.leftShoulder.getWorldPosition(new THREE.Vector3());
          const r=limbs.rightShoulder.getWorldPosition(new THREE.Vector3());
          const chest=l.clone().add(r).multiplyScalar(.5);
          const forward=new THREE.Vector3(0,0,1).applyQuaternion(model.getWorldQuaternion(new THREE.Quaternion()));
          chest.y-=.25;
          chest.addScaledVector(forward,.26);
          function turn(joint,hand,target){
            model.updateMatrixWorld(true);
            const pivot=joint.getWorldPosition(new THREE.Vector3());
            const tip=hand.getWorldPosition(new THREE.Vector3()).sub(pivot);
            const goal=target.clone().sub(pivot);
            if(tip.lengthSq()<1e-8||goal.lengthSq()<1e-8)return;
            const delta=new THREE.Quaternion().setFromUnitVectors(tip.normalize(),goal.normalize());
            const parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());
            const local=parent.clone().invert().multiply(delta).multiply(parent);
            joint.quaternion.premultiply(local).normalize();
          }
          // CCD reaches the same chest-height target with both hands.
          const leftTarget=chest.clone().add(new THREE.Vector3(-.025,0,0));
          const rightTarget=chest.clone().add(new THREE.Vector3(.025,0,0));
          for(let i=0;i<12;i++){
            turn(limbs.leftElbow,hands.left,leftTarget);
            turn(limbs.leftShoulder,hands.left,leftTarget);
            turn(limbs.rightElbow,hands.right,rightTarget);
            turn(limbs.rightShoulder,hands.right,rightTarget);
          }
          model.updateMatrixWorld(true);
          prayerDistance=hands.left.getWorldPosition(new THREE.Vector3()).distanceTo(hands.right.getWorldPosition(new THREE.Vector3()));
          canvas.dataset.handsDistance=prayerDistance.toFixed(4);
        }
      }
      renderer.render(scene,camera);
      if(!userReduced)raf=requestAnimationFrame(frame);
   }
   function renderOnce(){if(model&&!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
   const controller={
      setPose(p){if(p==='walk')walkUntil=performance.now()+1450;setPose(p);},
      getPose(){return current;},
      getBoneNames(){const arr=[];model?.traverse(o=>{if(o.isBone)arr.push(o.name)});return arr;},
      getPrayerDistance(){return prayerDistance;},
      setLook(v){theme=v;if(model)model.traverse(o=>{if(o.isMesh&&o.material?.color&&o.userData.originalColor){o.material.color.copy(o.userData.originalColor).multiplyScalar(v==='light'?1.25:v==='warm'?.92:1);}});renderOnce();},
      getLook(){return theme;},
      setReduced(value){userReduced=Boolean(value);renderOnce();}
   };
   const loader=new GLTFLoader();
   function loadVisitor(url,isFallback=false){loader.load(url,gltf=>{
     model=gltf.scene;
     model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material?.color){o.material=o.material.clone();o.userData.originalColor=o.material.color.clone();}}});
     const bounds=new THREE.Box3().setFromObject(model);
     const box=new THREE.Vector3();bounds.getSize(box);
     const center=new THREE.Vector3();bounds.getCenter(center);
     const scale=2.9/Math.max(box.y,.001);
     model.scale.setScalar(scale);
     model.position.set(-center.x*scale,-bounds.min.y*scale+0.06,-center.z*scale);
     model.rotation.y=Math.PI;
     const rightShoulder=model.getObjectByName('upperarm_r')||model.getObjectByName('wx9ery');
     const leftShoulder=model.getObjectByName('upperarm_l')||model.getObjectByName('tuy4up');
     const rightElbow=model.getObjectByName('lowerarm_r')||model.getObjectByName('vsfhv4');
     const leftElbow=model.getObjectByName('lowerarm_l')||model.getObjectByName('deh583');
     if(rightShoulder&&leftShoulder&&rightElbow&&leftElbow)limbs={rightShoulder,leftShoulder,rightElbow,leftElbow};
     const leftHand=model.getObjectByName('hand_l');
     const rightHand=model.getObjectByName('hand_r');
     if(leftHand&&rightHand)hands={left:leftHand,right:rightHand};

     scene.add(model);
     mixer=new THREE.AnimationMixer(model);
     for(const clip of gltf.animations){clips.set(clip.name.toLowerCase(),clip); }
     if(![...clips.keys()].some(n=>n.includes('idle'))||![...clips.keys()].some(n=>n.includes('walk'))){console.warn('Wish Garden rig lacks suitable idle/walk clips');if(!isFallback){scene.remove(model);mixer=null;clips.clear();loadVisitor('assets/visitor-rig.glb',true);return;}canvas.remove();renderer.dispose();return;}
     canvas.dataset.avatarSource=isFallback?'fantasy-fallback':'civilian-maya';
     window.WishAvatar3D=controller;
     garden.classList.add('rig-ready');
     setPose(garden.classList.contains('arrived')?'pray':garden.classList.contains('walking')?'walk':'idle');
     renderOnce();
   },undefined,err=>{console.warn('Wish Garden rig source unavailable',url,err);if(!isFallback)loadVisitor('assets/visitor-rig.glb',true);else{canvas.remove();renderer.dispose();}});}
   loadVisitor('assets/visitor-human.glb');
   document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock.getDelta();renderOnce();}});
   reduced.addEventListener?.('change',()=>{userReduced=reduced.matches;renderOnce();});
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();garden.classList.remove('rig-ready');cancelAnimationFrame(raf);raf=0;});
 }
}
