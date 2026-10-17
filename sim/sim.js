// Promenade: 3D human simulation. three.js r180 (vendored), CC0 character + animations by Quaternius.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const $=s=>document.querySelector(s);
const pause=()=>new Promise(r=>setTimeout(r,0));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CFG={height:1.66,loopR:3.1,post:{r:.5},world:42,turnRate:3.2,speed:1.15,
 skin:0xc08a62,fabric:0x85898e,hair:0x22160f,sun:{elev:6.5,azim:-128}};
const S={mode:'loop',cam:'orbit',playing:true,speed:CFG.speed,pos:new THREE.Vector3(CFG.loopR,0,0),head:0,vel:0,walkW:0,theta:0,joy:{x:0,y:0,on:false},keys:{},lastUser:-9,ready:false,t:0,fps:0,dist:0};

// ---------- renderer / scene ----------
const cv=$('#cv');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'})}
catch(e){$('#lmsg').textContent='WebGL is not available on this device.';throw e}
let dpr=Math.min(devicePixelRatio||1,2);renderer.setPixelRatio(dpr);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.62;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const loader=new GLTFLoader();const files=['models/body.glb','models/hair.glb','models/anims.glb'],sizes=[888584,251840,251792],got=[0,0,0];
function prog(i,e){got[i]=e.loaded;const p=Math.min(99,Math.round(got.reduce((a,b)=>a+b,0)/sizes.reduce((a,b)=>a+b,0)*100));$('#lbar').style.width=p+'%';$('#lpct').textContent=p+'%';$('.bar').setAttribute('aria-valuenow',p)}
const load=(u,i)=>new Promise((res,rej)=>loader.load(u,res,e=>prog(i,e),rej));
const modelsP=Promise.all(files.map(load));modelsP.catch(()=>{});
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,1,.1,500);camera.position.set(0,2.3,7.6);
const controls=new OrbitControls(camera,cv);controls.target.set(0,1.05,0);controls.enableDamping=true;controls.dampingFactor=.08;
controls.minDistance=1.6;controls.maxDistance=24;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=false;controls.autoRotate=!reduced;controls.autoRotateSpeed=.7;controls.rotateSpeed=.7;
controls.addEventListener('start',()=>{S.lastUser=performance.now();S.drag=true});controls.addEventListener('end',()=>{S.lastUser=performance.now();S.drag=false});
controls.addEventListener('change',()=>{if(!S.playing)wantFrame=true});

// sky + sun + environment
const sun=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-CFG.sun.elev),THREE.MathUtils.degToRad(CFG.sun.azim));
const sky=new Sky();sky.scale.setScalar(450);const su=sky.material.uniforms;
su.turbidity.value=9;su.rayleigh.value=3.4;su.mieCoefficient.value=.009;su.mieDirectionalG.value=.9;su.sunPosition.value.copy(sun);scene.add(sky);
{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene(),s2=new Sky();s2.scale.setScalar(100);Object.assign(s2.material.uniforms.sunPosition.value,sun);
 for(const k of['turbidity','rayleigh','mieCoefficient','mieDirectionalG'])s2.material.uniforms[k].value=su[k].value;es.add(s2);
 scene.environment=pm.fromScene(es,0,.1,200).texture;scene.environmentIntensity=.55;pm.dispose()}
scene.fog=new THREE.Fog(0xe2ad7c,35,170);
const hemi=new THREE.HemisphereLight(0xffe2bd,0x4a5a32,.55);scene.add(hemi);
const sunL=new THREE.DirectionalLight(0xffcf96,3.1);sunL.position.copy(sun).multiplyScalar(30);sunL.castShadow=true;
sunL.shadow.mapSize.set(1024,1024);const sc=sunL.shadow.camera;sc.left=-11;sc.right=11;sc.top=11;sc.bottom=-11;sc.near=1;sc.far=80;
sunL.shadow.bias=-.0004;sunL.shadow.normalBias=.03;sunL.shadow.radius=3;scene.add(sunL,sunL.target);

await pause();
// ---------- procedural textures ----------
function canvasTex(size,draw,rep,srgb=true){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const paverTex=canvasTex(512,(g,n)=>{g.fillStyle='#8f8676';g.fillRect(0,0,n,n);const cell=n/8;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const off=(y%2)*cell/2,l=58+rnd()*14,h=30+rnd()*12;g.fillStyle=`hsl(${h},${12+rnd()*10}%,${l}%)`;
  for(const dx of[0,-n])g.fillRect(x*cell+off+3+dx,y*cell+3,cell-6,cell-6)}
 for(let i=0;i<5000;i++){g.fillStyle=`rgba(${rnd()>.5?255:40},${rnd()>.5?240:35},220,${rnd()*.06})`;g.fillRect(rnd()*n,rnd()*n,2,2)}},10);
const grassTex=canvasTex(512,(g,n)=>{g.fillStyle='#66733a';g.fillRect(0,0,n,n);for(let i=0;i<40;i++){g.fillStyle=`hsla(${70+rnd()*20},30%,${30+rnd()*14}%,.18)`;g.beginPath();g.arc(rnd()*n,rnd()*n,20+rnd()*60,0,6.3);g.fill()}for(let i=0;i<26000;i++){const l=24+rnd()*24;g.fillStyle=`hsla(${66+rnd()*30},${30+rnd()*22}%,${l}%,.5)`;g.fillRect(rnd()*n,rnd()*n,1,2+rnd()*4)}},40);
const knit=canvasTex(128,(g,n)=>{g.fillStyle='#808080';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=2){g.fillStyle=`rgba(${y%4?255:0},${y%4?255:0},${y%4?255:0},.12)`;g.fillRect(0,y,n,1)}
 for(let i=0;i<1600;i++){const v=rnd()>.5?255:0;g.fillStyle=`rgba(${v},${v},${v},.05)`;g.fillRect(rnd()*n,rnd()*n,1,1)}},14,false);

await pause();
// ---------- world ----------
const W=new THREE.Group();scene.add(W);const colliders=[];
const mat=(c,r=.8,m=0,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m},o));
const grass=new THREE.Mesh(new THREE.CircleGeometry(170,48),mat(0xffffff,.95,0,{map:grassTex}));grass.rotation.x=-Math.PI/2;grass.receiveShadow=true;W.add(grass);
const plaza=new THREE.Mesh(new THREE.CircleGeometry(9.2,72),mat(0xffffff,.88,0,{map:paverTex}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.012;plaza.receiveShadow=true;W.add(plaza);
const kerb=new THREE.Mesh(new THREE.TorusGeometry(9.25,.09,6,96),mat(0xb8ad98,.8));kerb.rotation.x=Math.PI/2;kerb.position.y=.03;kerb.receiveShadow=true;W.add(kerb);
const ring=new THREE.Mesh(new THREE.RingGeometry(1.2,1.45,64),mat(0x6f665a,.9));ring.rotation.x=-Math.PI/2;ring.position.y=.016;ring.receiveShadow=true;W.add(ring);
await pause();
// lamppost
{const iron=mat(0x1d2422,.45,.85),g=new THREE.Group();
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.2,.27,.42,20),iron);base.position.y=.21;
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.35,18),iron);plinth.position.y=.58;
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,3.4,16),iron);pole.position.y=2.4;
 const collar=new THREE.Mesh(new THREE.TorusGeometry(.075,.02,8,20),iron);collar.rotation.x=Math.PI/2;collar.position.y=1.4;
 const cap=new THREE.Mesh(new THREE.ConeGeometry(.3,.28,6),iron);cap.position.y=4.62;
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(.24,.16,.48,6,1,true),mat(0xfff1c8,.2,0,{emissive:0xffc770,emissiveIntensity:1.6,side:THREE.DoubleSide}));glass.position.y=4.25;
 const fin=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),iron);fin.position.y=4.8;
 const bottom=new THREE.Mesh(new THREE.CylinderGeometry(.16,.1,.08,6),iron);bottom.position.y=3.98;
 for(const m of[base,plinth,pole,collar,cap,glass,fin,bottom]){m.castShadow=true;m.receiveShadow=true;g.add(m)}
 W.add(g);colliders.push({x:0,z:0,r:CFG.post.r})}
// benches
function bench(){const g=new THREE.Group(),wood=mat(0x8a5a34,.7),iron=mat(0x232826,.5,.7);
 for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(1.7,.045,.11),wood);s.position.set(0,.45,-.2+i*.13);g.add(s)}
 for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(1.7,.1,.035),wood);s.position.set(0,.62+i*.14,-.29);s.rotation.x=-.18;g.add(s)}
 for(const x of[-.72,.72]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.45,.5),iron);l.position.set(x,.225,-.05);g.add(l);const b=new THREE.Mesh(new THREE.BoxGeometry(.05,.5,.05),iron);b.position.set(x,.68,-.32);b.rotation.x=-.18;g.add(b);
  const a=new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.46),iron);a.position.set(x,.66,-.08);g.add(a)}
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return g}
for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,b=bench(),r=7.3;b.position.set(Math.cos(a)*r,0,Math.sin(a)*r);b.lookAt(0,0,0);W.add(b);colliders.push({x:b.position.x,z:b.position.z,r:1})}
// planters with shrubs
const leafMats=[0x55702f,0x617d35,0x4a662c,0x6b8439].map(c=>mat(c,.85));
function shrub(r){const g=new THREE.Group();for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r*(.55+rnd()*.35),1),leafMats[i%4]);m.position.set((rnd()-.5)*r,r*.6+rnd()*r*.4,(rnd()-.5)*r);m.castShadow=true;g.add(m)}return g}
for(let i=0;i<4;i++){const a=i*Math.PI/2,r=7.6,p=new THREE.Group();const box=new THREE.Mesh(new THREE.CylinderGeometry(.55,.48,.5,20),mat(0xb3a58c,.85));box.position.y=.25;box.castShadow=box.receiveShadow=true;p.add(box);
 const soil=new THREE.Mesh(new THREE.CircleGeometry(.5,20),mat(0x3b2a1c,1));soil.rotation.x=-Math.PI/2;soil.position.y=.49;p.add(soil);const s=shrub(.42);s.position.y=.45;p.add(s);
 p.position.set(Math.cos(a)*r,0,Math.sin(a)*r);W.add(p);colliders.push({x:p.position.x,z:p.position.z,r:.75})}
await pause();
// trees: tapered trunk + alpha-tested leaf cards with spherical normals (soft, natural canopies)
const leafTex=canvasTex(256,(g,n)=>{g.clearRect(0,0,n,n);for(let i=0;i<190;i++){const x=rnd()*n,y=rnd()*n,r=6+rnd()*9,a=rnd()*6.28;g.save();g.translate(x,y);g.rotate(a);
 g.fillStyle=`hsl(${80+rnd()*30},${35+rnd()*25}%,${22+rnd()*22}%)`;g.beginPath();g.ellipse(0,0,r,r*.45,0,0,6.28);g.fill();g.restore()}},1);
leafTex.repeat.set(1,1);leafTex.wrapS=leafTex.wrapT=THREE.ClampToEdgeWrapping;
const barkM=mat(0x5b4434,.95),leafM=new THREE.MeshStandardMaterial({map:leafTex,alphaTest:.45,side:THREE.DoubleSide,roughness:.85,color:0xd9e6b8});
function canopyGeo(s,clumps,cards){const pos=[],nor=[],uv=[],idx=[];const C=new THREE.Vector3(0,3.4*s,0),v=new THREE.Vector3(),q=new THREE.Quaternion(),e=new THREE.Euler();
 for(let c=0;c<clumps;c++){const cc=new THREE.Vector3((rnd()-.5)*2.2*s,(2.7+rnd()*1.6)*s,(rnd()-.5)*2.2*s),cr=(.7+rnd()*.5)*s;
  for(let k=0;k<cards;k++){const p=new THREE.Vector3().randomDirection().multiplyScalar(cr*Math.cbrt(rnd())).add(cc),w=(.9+rnd()*.6)*s;q.setFromEuler(e.set(rnd()*6.28,rnd()*6.28,rnd()*6.28));
   const n0=pos.length/3;for(const[dx,dy,u,vv]of[[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]]){v.set(dx*w/2,dy*w/2,0).applyQuaternion(q).add(p);pos.push(v.x,v.y,v.z);
    const nn=v.clone().sub(C).normalize();nor.push(nn.x,nn.y,nn.z);uv.push(u,vv)}idx.push(n0,n0+1,n0+2,n0,n0+2,n0+3)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
const protos=[1,1.15,1.3].map(s=>{const parts=[];const tr=new THREE.CylinderGeometry(.11*s,.2*s,3*s,9);tr.translate(0,1.5*s,0);parts.push(tr);
 for(let i=0;i<3;i++){const o=new THREE.Object3D();o.position.set(0,2.4*s,0);o.rotation.set((rnd()-.5)*1.4,rnd()*6,.6+rnd()*.4);o.translateY(.5*s);o.updateMatrix();const br=new THREE.CylinderGeometry(.04*s,.08*s,1.3*s,6);br.applyMatrix4(o.matrix);parts.push(br)}
 return{trunk:mergeGeometries(parts),canopy:canopyGeo(s,7,26),list:[]}});
for(let i=0;i<11;i++){const a=i/11*Math.PI*2+.31+rnd()*.2,r=12.5+rnd()*3.5,s=.9+rnd()*.3,x=Math.cos(a)*r,z=Math.sin(a)*r;protos[i%3].list.push([x,z,s,rnd()*6]);colliders.push({x,z,r:.45*s})}
for(let i=0;i<34;i++){const a=i/34*Math.PI*2+rnd()*.15,r=24+rnd()*24;protos[i%3].list.push([Math.cos(a)*r,Math.sin(a)*r,1.2+rnd()*.7,rnd()*6])}
for(const p of protos){const n=p.list.length,t=new THREE.InstancedMesh(p.trunk,barkM,n),c=new THREE.InstancedMesh(p.canopy,leafM,n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 p.list.forEach(([x,z,s,r],i)=>{m4.compose(new THREE.Vector3(x,0,z),q.setFromAxisAngle(up,r),new THREE.Vector3(s,s,s));t.setMatrixAt(i,m4);c.setMatrixAt(i,m4)});
 t.castShadow=c.castShadow=true;c.receiveShadow=true;W.add(t,c)}
await pause();
// far hills: low, hazed by fog
{const n=26,geo=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),im=new THREE.InstancedMesh(geo,mat(0x58703a,.95),n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd()*.1,r=110+rnd()*30,s=20+rnd()*16;m4.compose(new THREE.Vector3(Math.cos(a)*r,-2,Math.sin(a)*r),q,new THREE.Vector3(s,5+rnd()*7,s));im.setMatrixAt(i,m4);im.setColorAt(i,c.setHSL(.22+rnd()*.05,.28,.26+rnd()*.06))}
 W.add(im)}
// path from plaza
{const p=new THREE.Mesh(new THREE.PlaneGeometry(2.4,60),mat(0xffffff,.9,0,{map:paverTex.clone()}));p.material.map.repeat.set(1.2,30);p.rotation.x=-Math.PI/2;p.position.set(0,.011,-39);p.receiveShadow=true;W.add(p)}

await pause();
// ---------- character ----------
const char=new THREE.Group();scene.add(char);
let mixer,walkA,idleA,natSpeed=1.2,body,skeleton;


function buildCharacter([gB,gH,gA]){
 const rig=gB.scene;rig.updateMatrixWorld(true);
 rig.traverse(o=>{if(o.isSkinnedMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;if(/Superhero/.test(o.name))body=o}});
 skeleton=body.skeleton;const bone=n=>skeleton.bones.find(b=>b.name===n);
 // vertex positions in model space (rest pose) for measuring and clothing
 const g=body.geometry,P=g.attributes.position,N=g.attributes.normal,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,v=new THREE.Vector3(),wp=new Float32Array(P.count*3);
 let y0=1e9,y1=-1e9;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(body.matrixWorld);wp.set([v.x,v.y,v.z],i*3);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y)}
 const H=y1-y0,scale=CFG.height/H;
 // forward direction from heel to toe
 const fw=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();bone('ball_l').getWorldPosition(a);bone('foot_l').getWorldPosition(b);fw.subVectors(a,b).setY(0).normalize();
 const pivot=new THREE.Group();pivot.add(rig);pivot.rotation.y=Math.atan2(-fw.x,fw.z)+0;pivot.scale.setScalar(scale);pivot.position.y=-y0*scale;char.add(pivot);
 // material tuning to match reference: warm medium skin
 const bm=body.material;bm.color.setHex(0xf2d3bd);bm.roughness=.62;if(bm.metalnessMap)bm.metalness=0;bm.envMapIntensity=.9;
 rig.traverse(o=>{if(o.isMesh&&o!==body&&/Eyebrow/.test(o.name)){o.material=o.material.clone();o.material.color.setHex(0x2a1a12)}});
 // ---- clothing: re-use the body's own skinned surface, offset along normals, hide the covered skin ----
 const names=skeleton.bones.map(b=>b.name);const dom=i=>{let m=0,k=0;for(let j=0;j<4;j++){const w=SW.getComponent(i,j);if(w>m){m=w;k=SI.getComponent(i,j)}}return names[k]};
 const hOf=i=>(wp[i*3+1]-y0)/H,xOf=i=>Math.abs(wp[i*3])/H,army=/arm|hand|neck|Head|index|middle|ring|pinky|thumb/;
 const C={top:{lo:.645,hi:.838,bones:d=>!army.test(d)},sh:{lo:.452,hi:.594,bones:d=>/pelvis|thigh|spine_01|root/.test(d)}};
 const loose=(i,c)=>{const h=hOf(i);return h>c.lo-.02&&h<c.hi+.02&&c.bones(dom(i))&&(c!==C.top||xOf(i)<.2)};
 const strict=(i,c)=>{const h=hOf(i);return h>c.lo+.012&&h<c.hi-.012&&c.bones(dom(i))&&(c!==C.top||xOf(i)<xw(h)-.01)};
 function xw(h){const t=Math.min(1,Math.max(0,(h-.738)/(.778-.738)));return .2+(.064-.2)*t*t*(3-2*t)}
 const idx=g.index.array,keepB=[],top=[],sh=[];
 for(let t=0;t<idx.length;t+=3){const T=[idx[t],idx[t+1],idx[t+2]];
  if(T.some(i=>loose(i,C.top)))top.push(...T);if(T.some(i=>loose(i,C.sh)))sh.push(...T);
  if(!(T.every(i=>strict(i,C.top))||T.every(i=>strict(i,C.sh))))keepB.push(...T)}
 const unit=H/CFG.height/body.matrixWorld.getMaxScaleOnAxis();// mesh units per metre
 const rest=new Float32Array(P.count*2);for(let i=0;i<P.count;i++){rest[i*2]=hOf(i);rest[i*2+1]=xOf(i)}
 const fabricMat=(c,isTop)=>{const m=new THREE.MeshStandardMaterial({color:CFG.fabric,roughness:.9,metalness:0,roughnessMap:knit,bumpMap:knit,bumpScale:.5,side:THREE.DoubleSide});
  m.onBeforeCompile=sh=>{sh.vertexShader='attribute vec2 rest;\nvarying vec2 vRest;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRest=rest;');
   sh.fragmentShader='varying vec2 vRest;\n'+sh.fragmentShader.replace('void main() {',`void main() {
    if(vRest.x<${c.lo.toFixed(3)}||vRest.x>${c.hi.toFixed(3)})discard;
    ${isTop?'float xw=mix(.2,.064,smoothstep(.738,.778,vRest.x));if(vRest.y>xw)discard;':''}`)};
  m.customProgramCacheKey=()=>'cloth'+(isTop?1:0);return m};
 const cloth=(tris,off,name,m)=>{const ng=new THREE.BufferGeometry(),pos=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){pos[i*3]=P.getX(i)+N.getX(i)*off*unit;pos[i*3+1]=P.getY(i)+N.getY(i)*off*unit;pos[i*3+2]=P.getZ(i)+N.getZ(i)*off*unit}
  ng.setAttribute('position',new THREE.BufferAttribute(pos,3));for(const k of['normal','uv','skinIndex','skinWeight'])ng.setAttribute(k,g.attributes[k]);ng.setAttribute('rest',new THREE.BufferAttribute(rest,2));ng.setIndex(tris);
  const sm=new THREE.SkinnedMesh(ng,m);sm.name=name;sm.castShadow=sm.receiveShadow=true;sm.frustumCulled=false;body.parent.add(sm);sm.bind(skeleton,body.bindMatrix);return sm};
 cloth(top,.0055,'TankTop',fabricMat(C.top,true));cloth(sh,.0065,'Shorts',fabricMat(C.sh,false));
 const bg=g.clone();bg.setIndex(keepB);body.geometry=bg;
 // ---- hair: rebind the CC0 long hair mesh to this skeleton, recolour dark brown ----
 gH.scene.updateMatrixWorld(true);let hair;gH.scene.traverse(o=>{if(o.isSkinnedMesh)hair=o});
 if(hair){const bones=hair.skeleton.bones.map(x=>bone(x.name)||x);const sk=new THREE.Skeleton(bones,hair.skeleton.boneInverses);const bm2=hair.bindMatrix.clone();
  body.parent.add(hair);hair.bind(sk,bm2);hair.frustumCulled=false;hair.castShadow=true;hair.receiveShadow=true;
  const hm=hair.material;hm.color.setHex(CFG.hair);hm.roughness=.5;hm.envMapIntensity=.8;hm.alphaTest=hm.alphaTest||0;
  S.hairMesh=hair}
 // ---- jewellery ----
 char.updateMatrixWorld(true);
 const black=new THREE.MeshStandardMaterial({color:0x111111,roughness:.35,metalness:.2}),chain=new THREE.MeshStandardMaterial({color:0x1a1715,roughness:.4,metalness:.6}),silver=new THREE.MeshStandardMaterial({color:0xcfc8bd,roughness:.25,metalness:1});
 const nk=bone('neck_01'),sp=bone('spine_03'),np=new THREE.Vector3(),cp=new THREE.Vector3();nk.getWorldPosition(np);sp.getWorldPosition(cp);
 const fwd=new THREE.Vector3(0,0,1);
 const choker=new THREE.Mesh(new THREE.TorusGeometry(.062,.0016,6,40),chain);choker.position.copy(np).addScaledVector(fwd,.006).y-=.035;choker.rotation.x=Math.PI/2-.42;choker.scale.set(1,1.12,1);
 const longN=new THREE.Mesh(new THREE.TorusGeometry(.075,.0016,6,48),chain);longN.position.copy(np).addScaledVector(fwd,.02).y-=.07;longN.rotation.x=Math.PI/2-.95;longN.scale.set(1,1.35,1);
 const pend=new THREE.Mesh(new THREE.TorusGeometry(.009,.0035,8,18),silver);pend.position.copy(np).addScaledVector(fwd,.1).y-=.115;
 const pend2=new THREE.Mesh(new THREE.SphereGeometry(.0055,10,8),silver);pend2.position.copy(np).addScaledVector(fwd,.085).y-=.06;
 for(const m of[choker,longN,pend,pend2]){scene.add(m);m.updateMatrixWorld(true);sp.attach(m);m.castShadow=true}
 S.jewel={choker,longN,pend,pend2};
 if(S.hairMesh)curls(S.hairMesh,bone('Head'),scale,body,sp,np);
 for(const s of['l','r']){const hb=bone('hand_'+s),la=bone('lowerarm_'+s),hp=new THREE.Vector3(),lp=new THREE.Vector3();hb.getWorldPosition(hp);la.getWorldPosition(lp);
  const d=hp.clone().sub(lp).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),d);
  for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(.036+k*.001,.0042,8,28),black);r.position.copy(hp).addScaledVector(d,-.028-k*.011);r.quaternion.copy(q);r.rotateZ(k);scene.add(r);r.updateMatrixWorld(true);la.attach(r);r.castShadow=true}}
 // ---- animation retarget (same humanoid rig, matched by bone name) ----
 mixer=new THREE.AnimationMixer(rig);
 const aP=gA.scene.getObjectByName('pelvis'),bP=bone('pelvis'),ratio=aP&&bP?bP.position.length()/aP.position.length():1;
 const clip=n=>{const c=gA.animations.find(x=>x.name===n);if(!c)return null;const k=c.clone();
  k.tracks=k.tracks.filter(t=>{const[node,prop]=t.name.split('.');if(!bone(node))return false;if(prop==='scale')return false;if(prop==='position'&&node!=='pelvis')return false;return true});
  for(const t of k.tracks)if(t.name==='pelvis.position')for(let i=0;i<t.values.length;i++)t.values[i]*=ratio;return k};
 walkA=mixer.clipAction(clip('Walk_Loop'));idleA=mixer.clipAction(clip('Idle_Loop'));
 // measure natural walk speed from foot contact so feet don't slide
 natSpeed=measureWalk(walkA,bone('ball_l'),bone('ball_r'));
 walkA.play();idleA.play();walkA.setEffectiveWeight(1);idleA.setEffectiveWeight(0);
}
function measureWalk(act,fl,fr){act.reset().play();act.setEffectiveWeight(1);const dur=act.getClip().duration,n=90,feet=[fl,fr],v=new THREE.Vector3(),rec=feet.map(()=>[]);
 for(let i=0;i<=n;i++){mixer.setTime(dur*i/n);char.updateMatrixWorld(true);feet.forEach((f,j)=>{f.getWorldPosition(v);char.worldToLocal(v);rec[j].push([v.y,v.z])})}
 let sum=0,cnt=0;for(const r of rec){const mn=Math.min(...r.map(x=>x[0]));for(let i=1;i<r.length;i++)if(r[i][0]<mn+.025&&r[i-1][0]<mn+.025){sum+=Math.abs(r[i][1]-r[i-1][1])/(dur/n);cnt++}}
 act.stop();const s=cnt?sum/cnt:1.2;return s>.4&&s<3?s:1.2}
// curly volume: small spiral curls over the hair shell (head bone) and draped over the upper back (spine bone)
let curlGeo;function curlGeometry(){if(curlGeo)return curlGeo;const pts=[];for(let i=0;i<=24;i++){const t=i/24,a=t*Math.PI*4;pts.push(new THREE.Vector3(Math.cos(a)*.0075,Math.sin(a)*.0075,(t-.5)*.05))}
 return curlGeo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.0026,3,false)}
const curlMat=()=>new THREE.MeshStandardMaterial({color:0x1c120b,roughness:.5,metalness:0});
function scatter(src,bone,n,offA,offB,filter,lenScale=1){const g=src.geometry,P=g.attributes.position,N=g.attributes.normal;
 src.updateMatrixWorld(true);bone.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(bone.matrixWorld).invert(),nm=new THREE.Matrix3().getNormalMatrix(src.matrixWorld),bs=new THREE.Vector3();
 bone.matrixWorld.decompose(new THREE.Vector3(),new THREE.Quaternion(),bs);const v=new THREE.Vector3(),nn=new THREE.Vector3(),q=new THREE.Quaternion(),q2=new THREE.Quaternion(),m4=new THREE.Matrix4(),z=new THREE.Vector3(0,0,1),down=new THREE.Vector3(0,-1,0),cand=[];
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(src.matrixWorld);nn.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();if(!filter||filter(v,nn))cand.push(i)}
 if(!cand.length)return;const im=new THREE.InstancedMesh(curlGeometry(),curlMat(),n);
 for(let k=0;k<n;k++){const i=cand[Math.floor(rnd()*cand.length)];v.fromBufferAttribute(P,i).applyMatrix4(src.matrixWorld);nn.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();
  v.addScaledVector(nn,offA+rnd()*(offB-offA));v.x+=(rnd()-.5)*.012;v.y+=(rnd()-.5)*.012;v.z+=(rnd()-.5)*.012;
  // curls hang mostly downward, tilted along the surface
  const dirW=down.clone().addScaledVector(nn,.35).addScaledVector(new THREE.Vector3(rnd()-.5,0,rnd()-.5),.6).normalize();
  const lp=v.clone().applyMatrix4(inv),ld=dirW.transformDirection(inv);q.setFromUnitVectors(z,ld);q2.setFromAxisAngle(z,rnd()*6.28);q.multiply(q2);
  const s=(.75+rnd()*.6)/bs.x;m4.compose(lp,q,new THREE.Vector3(s,s,s*lenScale*(.8+rnd()*.6)));im.setMatrixAt(k,m4)}
 im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;bone.add(im);return im}
function curls(hair,head,scale,body,spine,neckW){
 scatter(hair,head,620,.002,.008,null);
 const back=new THREE.Vector3(0,0,-1);
 scatter(body,spine,560,.012,.04,(v,n)=>{const dy=neckW.y-v.y,dx=Math.abs(v.x-neckW.x);return dy>.02&&dy<.33&&dx<.13-dy*.12&&(v.z-neckW.z)<-.015&&n.dot(back)>.15},1.3);
 scatter(body,spine,160,.01,.03,(v,n)=>{const dy=neckW.y-v.y,dx=Math.abs(v.x-neckW.x);return dy>-.02&&dy<.09&&dx>.04&&dx<.15&&n.y>.25},1.1)}

// ---------- simulation ----------
const tmp=new THREE.Vector3(),camF=new THREE.Vector3();
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d}
function step(dt){
 let want=0,dir=null;
 if(S.mode==='loop'){const r=Math.hypot(S.pos.x,S.pos.z)||.01,cx=S.pos.x/r,cz=S.pos.z/r,e=Math.max(-1.6,Math.min(1.6,(r-CFG.loopR)*1.3));// clockwise tangent + radial correction
  dir=Math.atan2(cz-e*cx,-cx-e*cz);want=S.speed}
 else if(S.mode==='roam'){let jx=S.joy.x,jy=S.joy.y;const k=S.keys;if(k.w||k.arrowup)jy=-1;if(k.s||k.arrowdown)jy=1;if(k.a||k.arrowleft)jx=-1;if(k.d||k.arrowright)jx=1;
  const m=Math.min(1,Math.hypot(jx,jy));if(m>.12){camera.getWorldDirection(camF);const ca=Math.atan2(camF.x,camF.z);dir=ca+Math.atan2(-jx,-jy);want=S.speed*Math.max(.45,m)}}
 if(dir!==null){const d=angDiff(S.head,dir);S.head+=Math.sign(d)*Math.min(Math.abs(d),CFG.turnRate*dt*(S.vel>.2?1:1.6))}
 const acc=want>S.vel?1.6:2.4;S.vel+=Math.sign(want-S.vel)*Math.min(Math.abs(want-S.vel),acc*dt);
 S.pos.x+=Math.sin(S.head)*S.vel*dt;S.pos.z+=Math.cos(S.head)*S.vel*dt;S.dist+=S.vel*dt;
 for(const c of colliders){const dx=S.pos.x-c.x,dz=S.pos.z-c.z,d=Math.hypot(dx,dz),r=c.r+.28;if(d<r&&d>1e-4){S.pos.x=c.x+dx/d*r;S.pos.z=c.z+dz/d*r}}
 const R=Math.hypot(S.pos.x,S.pos.z);if(R>CFG.world){S.pos.x*=CFG.world/R;S.pos.z*=CFG.world/R}
 char.position.copy(S.pos);char.rotation.y=S.head;
 if(mixer){const moving=Math.min(1,S.vel/.35);S.walkW+=(moving-S.walkW)*Math.min(1,dt*6);walkA.setEffectiveWeight(S.walkW);idleA.setEffectiveWeight(1-S.walkW);
  walkA.timeScale=Math.max(.45,S.vel/natSpeed);mixer.update(dt)}
}
let followYaw=null;
function camUpdate(dt){
 if(S.cam==='follow'){const tgt=tmp.copy(S.pos).setY(1.15),d=tgt.clone().sub(controls.target);controls.target.add(d);camera.position.add(d);
  if(!S.drag&&performance.now()-S.lastUser>1800&&S.vel>.2){const off=camera.position.clone().sub(controls.target),cur=Math.atan2(off.x,off.z),want=S.head+Math.PI,rate=1.2*dt;
   const nd=angDiff(cur,want);const a=cur+Math.sign(nd)*Math.min(Math.abs(nd),rate);const hd=Math.hypot(off.x,off.z);camera.position.set(controls.target.x+Math.sin(a)*hd,camera.position.y,controls.target.z+Math.cos(a)*hd)}}
 else{const k=S.mode==='roam'?.9:.55;controls.target.lerp(tmp.set(S.pos.x*k,1.05,S.pos.z*k),Math.min(1,dt*2.5))}
 sunL.target.position.set(S.cam==='follow'||S.mode==='roam'?S.pos.x:0,0,S.cam==='follow'||S.mode==='roam'?S.pos.z:0);sunL.position.copy(sun).multiplyScalar(30).add(sunL.target.position);
 controls.update(dt)}

// ---------- loop / lifecycle ----------
const clock=new THREE.Clock();let wantFrame=true,frames=0,acc=0,lowT=0;
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?Math.min(62,45/Math.max(.6,w/h*1.25)):42;camera.updateProjectionMatrix();
 const pr=$('.panel').getBoundingClientRect();document.documentElement.style.setProperty('--ph',pr.height+'px');
 // keep the subject clear of the control panel: shift the projection away from it
 const side=pr.left>w*.4&&pr.top<h*.5;if(side)camera.setViewOffset(w,h,Math.round((w-pr.left)*.42),0,w,h);else camera.setViewOffset(w,h,0,Math.round(pr.height*.32),w,h);
 wantFrame=true}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
function frame(){const dt=Math.min(.05,clock.getDelta());S.frames=(S.frames||0)+1;
 if(S.ready&&S.playing)step(dt);controls.autoRotate=S.cam==='orbit'&&S.playing&&!reduced;
 if(S.playing||wantFrame||controls.autoRotate){camUpdate(dt);renderer.render(scene,camera);wantFrame=false}
 else if(controls.enableDamping){controls.update(dt)}
 frames++;acc+=dt;if(acc>=1){S.fps=Math.round(frames/acc);frames=0;acc=0;
  if(S.fps<40&&dpr>1.25&&S.ready){lowT++;if(lowT>=2){dpr=Math.max(1.25,dpr-.25);renderer.setPixelRatio(dpr);resize();lowT=0}}else lowT=0}}
function run(on){renderer.setAnimationLoop(on?frame:null);if(on)clock.getDelta()}
document.addEventListener('visibilitychange',()=>run(document.visibilityState==='visible'));
addEventListener('pagehide',()=>run(false));addEventListener('pageshow',()=>run(document.visibilityState==='visible'));

// ---------- UI ----------
const status=()=>{$('#status').textContent=!S.playing?'Paused':S.mode==='loop'?'Walking around the post':S.mode==='roam'?(S.vel>.15?'Free roam: walking':'Free roam: use the joystick'):'Idle'};
const bPlay=$('#bPlay');bPlay.onclick=()=>{S.playing=!S.playing;bPlay.classList.toggle('paused',!S.playing);bPlay.setAttribute('aria-label',S.playing?'Pause':'Play');status();wantFrame=true};
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function setMode(m){S.mode=m;document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.mode===m)));$('#joy').hidden=m!=='roam';
 const h=$('#hint');if(m==='roam'){h.textContent=matchMedia('(pointer:coarse)').matches?'Drag the joystick to walk':'Drag the joystick or use WASD';h.hidden=false;clearTimeout(h._t);h._t=setTimeout(()=>h.hidden=true,3500)}else h.hidden=true;
 if(!S.playing)bPlay.click();status()}
const bCam=$('#bCam');bCam.onclick=()=>setCam(S.cam==='orbit'?'follow':'orbit');
function setCam(c){S.cam=c;bCam.setAttribute('aria-pressed',String(c==='follow'));$('#camL').textContent=c==='follow'?'Follow':'Orbit';bCam.setAttribute('aria-label',c==='follow'?'Camera: follow. Tap for auto orbit':'Camera: auto orbit. Tap for follow camera');
 if(c==='follow'){const off=camera.position.clone().sub(controls.target);off.setLength(Math.min(off.length(),5.2));controls.target.copy(S.pos).setY(1.15);camera.position.copy(controls.target).add(off).setY(Math.max(1.6,controls.target.y+off.y))}
 wantFrame=true}
const spd=$('#spd'),spdV=$('#spdV');const setSpd=()=>{S.speed=+spd.value;spdV.textContent=S.speed.toFixed(2)+' m/s';spd.style.setProperty('--p',((S.speed-.5)/1*100)+'%')};spd.oninput=setSpd;setSpd();
$('#bInfo').onclick=()=>$('#info').showModal();
// joystick
{const j=$('#joy'),k=j.querySelector('.knob');let id=null,cx=0,cy=0;const R=50;
 j.addEventListener('pointerdown',e=>{id=e.pointerId;j.setPointerCapture(id);const r=j.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(e);S.joy.on=true});
 const mv=e=>{if(e.pointerId!==id)return;let dx=e.clientX-cx,dy=e.clientY-cy;const d=Math.hypot(dx,dy);if(d>R){dx*=R/d;dy*=R/d}k.style.transform=`translate(${dx}px,${dy}px)`;S.joy.x=dx/R;S.joy.y=dy/R};
 j.addEventListener('pointermove',mv);const up=e=>{if(e.pointerId!==id)return;id=null;k.style.transform='';S.joy.x=S.joy.y=0;S.joy.on=false};j.addEventListener('pointerup',up);j.addEventListener('pointercancel',up)}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(/^(w|a|s|d|arrow(up|down|left|right))$/.test(k)&&S.mode==='roam'){S.keys[k]=true;e.preventDefault()}if(k===' '&&e.target===document.body){bPlay.click();e.preventDefault()}});
addEventListener('keyup',e=>{S.keys[e.key.toLowerCase()]=false});

// ---------- boot ----------
resize();run(true);
modelsP.then(async r=>{await pause();buildCharacter(r);await pause();renderer.compile(scene,camera);
 S.ready=true;S.head=Math.PI;controls.target.set(S.pos.x*.55,1.05,S.pos.z*.55);
 $('#lbar').style.width='100%';$('#lpct').textContent='100%';$('#load').classList.add('done');setTimeout(()=>$('#load').remove(),700);status();
}).catch(e=>{console.warn(e);$('#lmsg').textContent='Could not load the 3D model. Check your connection and reload.'});
window.__sim={tick(n=30,dt=1/30){for(let i=0;i<n;i++){if(S.playing)step(dt);camUpdate(dt)}renderer.render(scene,camera);return{pos:S.pos.toArray(),vel:S.vel,head:S.head,walkW:S.walkW}},S,controls,setMode,setCam,get natSpeed(){return natSpeed},get dpr(){return dpr},renderer,camera,char,scene,info:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,fps:S.fps})};
