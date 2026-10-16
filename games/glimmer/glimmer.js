// Glimmer Guard: hand-rolled WebGL first-person arena game (no external libraries).
(()=>{'use strict';const{tone,buzz,best,setBest,$}=G;
const cv=$('#cv'),rc=$('#radar'),rx=rc.getContext('2d'),touch=matchMedia('(pointer:coarse)').matches;if(touch)document.body.classList.add('touch');
const SK='dash-games-glimmer-settings',set=Object.assign({sens:1,inv:false,auto:touch},JSON.parse(localStorage.getItem(SK)||'{}')),saveSet=()=>localStorage.setItem(SK,JSON.stringify(set));
const gl=cv.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'})||cv.getContext('experimental-webgl');
if(!gl){$('#mText').textContent='Your browser could not start WebGL, which this game needs. Try another browser or device.';$('#mGo').hidden=true;return}
// ---------- renderer ----------
const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 M,V,P;varying vec3 vn,vw;varying float vd;
void main(){vec4 w=M*vec4(p,1.0);vw=w.xyz;vn=(M*vec4(n,0.0)).xyz;vec4 e=V*w;vd=-e.z;gl_Position=P*e;}`;
const FS=`precision mediump float;uniform vec3 C,E,L,F;uniform float D,K;varying vec3 vn,vw;varying float vd;
void main(){vec3 N=normalize(vn);float d=max(dot(N,L),0.0);vec3 amb=mix(vec3(.16,.21,.19),vec3(.44,.52,.48),N.y*.5+.5);vec3 col=C;
if(K>.5){vec2 g=abs(fract(vw.xz*.25)-.5);float ln=smoothstep(.465,.5,max(g.x,g.y));col=mix(C,vec3(.85,.68,.28),ln*.7);float r=length(vw.xz);col+=vec3(.02,.06,.04)*smoothstep(18.0,0.0,r);}
vec3 c=col*(amb+d*vec3(1.0,.93,.8)*.9)+E;float f=clamp(1.0-exp(-vd*D),0.0,1.0);gl_FragColor=vec4(mix(c,F,f),1.0);}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
const AP=gl.getAttribLocation(pr,'p'),AN=gl.getAttribLocation(pr,'n'),U={};'M V P C E L F D K'.split(' ').forEach(k=>U[k]=gl.getUniformLocation(pr,k));
gl.enableVertexAttribArray(AP);gl.enableVertexAttribArray(AN);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
const FOG=[.07,.15,.13];gl.clearColor(...FOG,1);gl.uniform3fv(U.F,FOG);gl.uniform1f(U.D,.032);const Ld=[.35,.85,.4],ll=Math.hypot(...Ld);gl.uniform3fv(U.L,Ld.map(v=>v/ll));
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function mesh(tris){const d=[];for(let[a,b,c]of tris){let n=cross(sub(b,a),sub(c,a));const ce=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];if(dot(n,ce)<0){[b,c]=[c,b];n=n.map(v=>-v)}const l=Math.hypot(...n)||1;n=n.map(v=>v/l);for(const v of[a,b,c])d.push(...v,...n)}
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);return{buf,n:d.length/6}}
const CUBE=(()=>{const t=[],v=(x,y,z)=>[x,y,z];[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];const P=[-.5,.5],q=[];
 for(const ax of[0,1,2])for(const s of P){const u=(ax+1)%3,w=(ax+2)%3,c=(i,j)=>{const r=[0,0,0];r[ax]=s;r[u]=i;r[w]=j;return r};q.push([c(-.5,-.5),c(.5,-.5),c(.5,.5)],[c(-.5,-.5),c(.5,.5),c(-.5,.5)])}return mesh(q)})();
const OCTA=mesh((()=>{const X=[[1,0,0],[-1,0,0]],Y=[[0,1,0],[0,-1,0]],Z=[[0,0,1],[0,0,-1]],t=[];for(const x of X)for(const y of Y)for(const z of Z)t.push([x,y,z]);return t})());
const FLOOR=(()=>{const d=new Float32Array([-1,0,-1,0,1,0,-1,0,1,0,1,0,1,0,1,0,1,0,-1,0,-1,0,1,0,1,0,1,0,1,0,1,0,-1,0,1,0]);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);return{buf,n:6}})();
let bound=null;const Mm=new Float32Array(16),Vm=new Float32Array(16),Pm=new Float32Array(16),I4=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function draw(m,x,y,z,a,b,sx,sy,sz,col,em=[0,0,0],floor=0){if(bound!==m){gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.vertexAttribPointer(AP,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(AN,3,gl.FLOAT,false,24,12);bound=m}
 const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);Mm[0]=ca*sx;Mm[1]=0;Mm[2]=-sa*sx;Mm[3]=0;Mm[4]=sa*sb*sy;Mm[5]=cb*sy;Mm[6]=ca*sb*sy;Mm[7]=0;Mm[8]=sa*cb*sz;Mm[9]=-sb*sz;Mm[10]=ca*cb*sz;Mm[11]=0;Mm[12]=x;Mm[13]=y;Mm[14]=z;Mm[15]=1;
 gl.uniformMatrix4fv(U.M,false,Mm);gl.uniform3fv(U.C,col);gl.uniform3fv(U.E,em);gl.uniform1f(U.K,floor);gl.drawArrays(gl.TRIANGLES,0,m.n)}
function view(e,a,b){const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),r0=[ca,0,-sa],r1=[sa*sb,cb,ca*sb],r2=[sa*cb,-sb,ca*cb];
 Vm.set([r0[0],r1[0],r2[0],0,r0[1],r1[1],r2[1],0,r0[2],r1[2],r2[2],0,-dot(r0,e),-dot(r1,e),-dot(r2,e),1])}
function persp(fy,asp,n,f){const t=1/Math.tan(fy/2);Pm.set([t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0])}
// ---------- world ----------
const HALF=18,OBS=[];const box=(x,z,hw,hd,h,col,lamp)=>OBS.push({x,z,hw,hd,h,col,lamp});
[[0,-HALF-.5,HALF+1,.5],[0,HALF+.5,HALF+1,.5],[-HALF-.5,0,.5,HALF+1],[HALF+.5,0,.5,HALF+1]].forEach(([x,z,hw,hd])=>box(x,z,hw,hd,3.2,[.13,.32,.25],2));
[[-7,-7],[7,-7],[-7,7],[7,7]].forEach(([x,z])=>box(x,z,.45,.45,5,[.12,.26,.2],1));
[[0,-10,2.6,.8],[0,10,2.6,.8],[-11,0,.8,2.6],[11,0,.8,2.6],[-4,3,1,1],[4,-3,1,1],[-13,-12,1.2,1.2],[13,12,1.2,1.2],[13,-12,1,1.6],[-13,12,1.6,1]].forEach(([x,z,hw,hd])=>box(x,z,hw,hd,1.1,[.42,.3,.16]));
const LEAF=[.14,.48,.3];
// ---------- state ----------
const ETYPE={buzz:{hp:1,sp:3.4,r:.38,dmg:10,pts:100,col:[.85,.68,.2],eye:[.2,1,.6]},bulb:{hp:3,sp:1.7,r:.62,dmg:18,pts:250,col:[.18,.62,.42],eye:[1,.85,.3]},spit:{hp:2,sp:2.4,r:.46,dmg:0,pts:200,col:[.2,.55,.65],eye:[1,.5,.3]}};
let state='menu',W=1,H=1,DPR=1,last=0,pl,ens,orbs,parts,traces,pick,score,combo,comboT,wave,queue,spawnT,interT,hp,ammo,reloadT,fireCd,odT,shake,hurtT,banT,frames=0,fpsT=0,fps=0,kills,shots,hits;
const keys={},inp={mx:0,my:0,fire:false};
function size(){DPR=Math.min(touch?1.5:2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);gl.viewport(0,0,cv.width,cv.height);const r=rc.clientWidth||96;rc.width=rc.height=Math.round(r*DPR);$('#rot').hidden=!(touch&&H>W)}
addEventListener('resize',size);size();
function reset(){pl={x:0,z:14,yaw:0,pitch:0,bob:0,kick:0};ens=[];orbs=[];parts=[];traces=[];pick=[];score=0;combo=1;comboT=0;wave=0;queue=[];spawnT=0;interT=1.2;hp=100;ammo=16;reloadT=0;fireCd=0;odT=0;shake=0;hurtT=0;kills=0;shots=0;hits=0;banner('Get ready','Wave 1 incoming');hud(true)}
function nextWave(){wave++;const n=wave,q=[];for(let i=0;i<3+n;i++)q.push('buzz');for(let i=0;i<Math.floor(n/2);i++)q.push('spit');for(let i=0;i<Math.floor((n-1)/2);i++)q.push('bulb');q.sort(()=>Math.random()-.5);queue=q;spawnT=.5;
 banner(`Wave ${n}`,n===1?'Tag every glow-drone':n%3===0?'Bulbs are tougher: 3 hits':'Faster drones');tone(440,.15,'triangle',.08,660);if(Math.random()<.7||n%2===0)spawnPick()}
function spawnEnemy(t){const T=ETYPE[t],m=1+Math.min(.8,(wave-1)*.07);let x,z,g=0;do{const s=Math.floor(Math.random()*4),u=(Math.random()*2-1)*(HALF-2);[x,z]=[[u,-HALF+1.5],[u,HALF-1.5],[-HALF+1.5,u],[HALF-1.5,u]][s];g++}while(Math.hypot(x-pl.x,z-pl.z)<10&&g<20);
 ens.push({t,x,z,y:1.4+Math.random()*.8,hp:T.hp,sp:T.sp*m,r:T.r,ph:Math.random()*6,flash:0,cd:0,shoot:1.5+Math.random()*2,spin:0,born:0})}
function spawnPick(x,z,kind){if(x===undefined){let g=0;do{x=(Math.random()*2-1)*(HALF-3);z=(Math.random()*2-1)*(HALF-3);g++}while((blocked(x,z,.6)||Math.hypot(x-pl.x,z-pl.z)<5)&&g<30)}
 kind=kind||(['shield','shield','over','star'][Math.floor(Math.random()*4)]);pick.push({x,z,kind,t:0,life:18})}
function blocked(x,z,r){return OBS.some(o=>Math.abs(x-o.x)<o.hw+r&&Math.abs(z-o.z)<o.hd+r)}
function collide(e,r,yb){for(const o of OBS){if(yb!==undefined&&yb>o.h+.1)continue;const dx=e.x-o.x,dz=e.z-o.z,px=o.hw+r-Math.abs(dx),pz=o.hd+r-Math.abs(dz);if(px>0&&pz>0){if(px<pz)e.x+=Math.sign(dx||1)*px;else e.z+=Math.sign(dz||1)*pz}}
 e.x=Math.max(-HALF+r,Math.min(HALF-r,e.x));e.z=Math.max(-HALF+r,Math.min(HALF-r,e.z))}
const eye=()=>[pl.x,1.6+Math.sin(pl.bob)*.04,pl.z],fwd=()=>{const cb=Math.cos(pl.pitch);return[-Math.sin(pl.yaw)*cb,Math.sin(pl.pitch),-Math.cos(pl.yaw)*cb]};
function rayBox(o,d,b){let t0=0,t1=1e9;const mn=[b.x-b.hw,0,b.z-b.hd],mx=[b.x+b.hw,b.h,b.z+b.hd];for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-6){if(o[i]<mn[i]||o[i]>mx[i])return 1e9;continue}let a=(mn[i]-o[i])/d[i],c=(mx[i]-o[i])/d[i];if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return 1e9}return t0}
function raySph(o,d,c,r){const oc=sub(o,c),b=dot(oc,d),cc=dot(oc,oc)-r*r,D=b*b-cc;if(D<0)return 1e9;const t=-b-Math.sqrt(D);return t>0?t:1e9}
function cast(){const o=eye(),d=fwd();let tw=d[1]<0?-o[1]/d[1]:60,hit=null;for(const b of OBS){const t=rayBox(o,d,b);if(t<tw)tw=t}
 let te=1e9;for(const e of ens){const t=raySph(o,d,[e.x,e.y,e.z],e.r*1.15);if(t<te){te=t;hit=e}}return te<tw?{e:hit,t:te,o,d}:{e:null,t:Math.min(tw,60),o,d}}
function fire(){if(state!=='play'||fireCd>0||reloadT>0)return;if(ammo<=0&&odT<=0){reload();return}fireCd=odT>0?.085:.17;if(odT<=0)ammo--;shots++;pl.kick=1;
 const c=cast(),end=[c.o[0]+c.d[0]*c.t,c.o[1]+c.d[1]*c.t,c.o[2]+c.d[2]*c.t];const r=[Math.cos(pl.yaw),0,-Math.sin(pl.yaw)],mz=[c.o[0]+r[0]*.22+c.d[0]*.7,c.o[1]-.2+c.d[1]*.7,c.o[2]+r[2]*.22+c.d[2]*.7];traces.push({a:mz,b:end,l:.09});
 tone(odT>0?1200:900,.06,'square',.035,odT>0?1800:300);if(c.e)hitEnemy(c.e,end);else for(let i=0;i<4;i++)parts.push(P(end,[.9,.8,.5],2,.25));if(ammo<=0&&odT<=0)setTimeout(reload,120)}
function reload(){if(reloadT>0||ammo===16||state!=='play')return;reloadT=1.05;tone(300,.12,'triangle',.05,520);tone(520,.1,'triangle',.05,780,.9)}
const P=(p,col,v,l)=>({x:p[0],y:p[1],z:p[2],vx:(Math.random()-.5)*v,vy:Math.random()*v*.8,vz:(Math.random()-.5)*v,l,m:l,col,s:.06+Math.random()*.08});
function hitEnemy(e,at){hits++;e.hp--;e.flash=.12;markHit(false);buzz(8);if(e.hp>0){tone(700,.05,'sine',.06,500);for(let i=0;i<6;i++)parts.push(P(at,ETYPE[e.t].eye,3,.3));return}
 const T=ETYPE[e.t];kills++;score+=T.pts*combo;combo=Math.min(10,combo+1);comboT=2.6;markHit(true);tone(520,.09,'triangle',.08,1040);tone(1040,.12,'sine',.06,1560,.06);
 for(let i=0;i<(G.reduced?10:24);i++)parts.push(P([e.x,e.y,e.z],i%3?[.98,.82,.35]:T.eye,6,.7));if(Math.random()<.16)spawnPick(e.x,e.z);ens.splice(ens.indexOf(e),1);hud(true)}
let hmT=0;function markHit(k){const m=$('#hitm');m.className='on'+(k?' kill':'');hmT=k?.22:.12}
function hurt(d){if(state!=='play')return;hp=Math.max(0,hp-d);hurtT=.45;combo=1;comboT=0;if(!G.reduced)shake=.25;buzz([20,30,20]);tone(160,.18,'sawtooth',.07,90);hud(true);if(hp<=0)over()}
function banner(a,b){const e=$('#banner');e.innerHTML=`${a}${b?`<small>${b}</small>`:''}`;e.classList.add('on');banT=1.8}
// ---------- loop ----------
function step(dt){const t=performance.now()/1000;
 // look + move
 const ms=6*(odT>0?1.1:1);let mx=0,mz=0;if(keys.KeyW||keys.ArrowUp)mz+=1;if(keys.KeyS||keys.ArrowDown)mz-=1;if(keys.KeyA||keys.ArrowLeft)mx-=1;if(keys.KeyD||keys.ArrowRight)mx+=1;
 if(joy.on){mx+=joy.dx;mz-=joy.dy}const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}
 const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),rx_=Math.cos(pl.yaw),rz=-Math.sin(pl.yaw);pl.x+=(fx*mz+rx_*mx)*ms*dt;pl.z+=(fz*mz+rz*mx)*ms*dt;collide(pl,.35);if(ml>.1)pl.bob+=dt*9;
 // timers
 fireCd-=dt;pl.kick=Math.max(0,pl.kick-dt*8);if(reloadT>0){reloadT-=dt;if(reloadT<=0){ammo=16;reloadT=0}}if(odT>0)odT-=dt;if(comboT>0){comboT-=dt;if(comboT<=0)combo=1}
 if(hmT>0){hmT-=dt;if(hmT<=0)$('#hitm').className=''}if(banT>0){banT-=dt;if(banT<=0)$('#banner').classList.remove('on')}shake=Math.max(0,shake-dt);hurtT=Math.max(0,hurtT-dt);
 if(inp.fire)fire();else if(set.auto&&fireCd<=0&&reloadT<=0){const c=cast();if(c.e&&c.t<28)fire()}
 // waves
 if(queue.length){spawnT-=dt;if(spawnT<=0&&ens.length<10){spawnEnemy(queue.shift());spawnT=Math.max(.35,1-wave*.05)}}
 else if(!ens.length){if(interT>0){interT-=dt;if(interT<=0)nextWave()}else if(wave>0){const bonus=150*wave+Math.round(hp)*2;score+=bonus;banner(`Wave ${wave} cleared`,`+${bonus} bonus`);tone(660,.15,'triangle',.08,990);tone(990,.2,'triangle',.06,1320,.12);interT=2.6;hud(true)}}
 // enemies
 for(const e of ens){const T=ETYPE[e.t];e.ph+=dt;e.born=Math.min(1,e.born+dt*2);e.flash=Math.max(0,e.flash-dt);e.cd=Math.max(0,e.cd-dt);e.spin+=dt*(e.t==='buzz'?14:6);
  let dx=pl.x-e.x,dz=pl.z-e.z;const dist=Math.hypot(dx,dz)||1;dx/=dist;dz/=dist;let vx=dx,vz=dz;
  if(e.t==='buzz'){const w=Math.sin(e.ph*3)*.7;vx+=-dz*w;vz+=dx*w}
  else if(e.t==='spit'){const k=dist<7?-1:dist>11?1:0,st=Math.sin(e.ph*.8)>0?1:-1;vx=dx*k+(-dz)*st*.8;vz=dz*k+dx*st*.8;e.shoot-=dt;
   if(e.shoot<=0&&dist<22){e.shoot=Math.max(1.3,3.2-wave*.12)+Math.random();const o=[e.x,e.y,e.z],tg=[pl.x,1.3,pl.z],d=sub(tg,o),l=Math.hypot(...d);orbs.push({x:e.x,y:e.y,z:e.z,v:d.map(q=>q/l*(6+wave*.25)),l:5});tone(330,.12,'sine',.04,220)}}
  for(const o of ens)if(o!==e){const ox=e.x-o.x,oz=e.z-o.z,od=Math.hypot(ox,oz);if(od<e.r+o.r&&od>0){vx+=ox/od*.8;vz+=oz/od*.8}}
  e.x+=vx*e.sp*dt;e.z+=vz*e.sp*dt;e.y+=((1.3+Math.sin(e.ph*1.7)*.4+(e.t==='bulb'?.3:0))-e.y)*dt*2;collide(e,e.r,e.y-e.r);
  if(T.dmg&&e.cd<=0&&Math.hypot(pl.x-e.x,pl.z-e.z)<e.r+.45&&Math.abs(e.y-1.3)<1){hurt(T.dmg);e.cd=1.1;e.x-=dx*2;e.z-=dz*2;collide(e,e.r,e.y-e.r)}}
 for(const o of orbs){o.x+=o.v[0]*dt;o.y+=o.v[1]*dt;o.z+=o.v[2]*dt;o.l-=dt;if(blocked(o.x,o.z,0)&&o.y<1.2||Math.abs(o.x)>HALF||Math.abs(o.z)>HALF)o.l=0;
  if(o.l>0&&Math.hypot(o.x-pl.x,o.z-pl.z)<.55&&o.y>.4&&o.y<2.1){o.l=0;hurt(12)}}orbs=orbs.filter(o=>o.l>0);
 for(const k of pick){k.t+=dt;k.life-=dt;if(Math.hypot(k.x-pl.x,k.z-pl.z)<.9){k.life=0;if(k.kind==='shield'){hp=Math.min(100,hp+30);banner('Shield +30')}else if(k.kind==='over'){odT=7;ammo=16;reloadT=0;banner('Overdrive','Rapid fire, no reload')}else{score+=500*combo;banner(`+${500*combo}`)}tone(880,.1,'triangle',.07,1320);tone(1320,.14,'sine',.05,1760,.08);buzz(15);hud(true)}}pick=pick.filter(k=>k.life>0);
 for(const p of parts){p.l-=dt;p.vy-=6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.03){p.y=.03;p.vy*=-.4}}parts=parts.filter(p=>p.l>0).slice(-180);
 for(const tr of traces)tr.l-=dt;traces=traces.filter(t=>t.l>0);hud()}
function render(){const t=performance.now()/1000,asp=W/H,hf=asp>=1?95:72,vf=Math.min(100,2*Math.atan(Math.tan(hf*Math.PI/360)/asp)*180/Math.PI);persp(vf*Math.PI/180,asp,.05,80);
 const e=eye();let yaw=pl.yaw,pit=pl.pitch;if(shake>0){yaw+=(Math.random()-.5)*shake*.08;pit+=(Math.random()-.5)*shake*.08}view(e,yaw,pit);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(U.P,false,Pm);gl.uniformMatrix4fv(U.V,false,Vm);
 draw(FLOOR,0,0,0,0,0,HALF,1,HALF,[.07,.2,.15],[0,0,0],1);
 for(const o of OBS){draw(CUBE,o.x,o.h/2,o.z,0,0,o.hw*2,o.h,o.hd*2,o.col);if(o.h<2){draw(CUBE,o.x,o.h+.12,o.z,0,0,o.hw*2-.2,.24,o.hd*2-.2,LEAF);draw(OCTA,o.x,o.h+.45,o.z,t*.3,0,.3,.3,.3,[.3,.7,.4],[.05,.12,.05])}
  if(o.lamp===1){draw(OCTA,o.x,o.h+.3,o.z,t,0,.35,.35,.35,[.9,.8,.4],[.8,.65,.25])}else if(o.lamp===2){draw(CUBE,o.x,o.h+.04,o.z,0,0,o.hw*2,.08,o.hd*2,[.9,.75,.35],[.7,.55,.2]);draw(CUBE,o.x,.9,o.z,0,0,o.hw*2+.02,.06,o.hd*2+.02,[.3,.8,.55],[.15,.45,.3])}}
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;draw(CUBE,Math.cos(a)*(HALF+.4),6,Math.sin(a)*(HALF+.4),-a,0,.25,12,.25,[.1,.24,.19])}
 for(const k of pick){const c=k.kind==='shield'?[.2,.9,.6]:k.kind==='over'?[1,.75,.2]:[1,.95,.6],bl=k.life<4&&Math.sin(t*20)>0;if(!bl){draw(CUBE,k.x,.7+Math.sin(k.t*3)*.12,k.z,k.t*2,.6,.42,.42,.42,c,c.map(v=>v*.55));draw(OCTA,k.x,.08,k.z,0,0,.5,.02,.5,c,c.map(v=>v*.4))}}
 for(const en of ens){const T=ETYPE[en.t],s=en.r*en.born,f=en.flash>0;const body=f?[1,1,1]:T.col,em=f?[.6,.6,.6]:[0,0,0];const a=Math.atan2(en.x-pl.x,en.z-pl.z);
  draw(OCTA,en.x,en.y,en.z,a,0,s,s*(en.t==='bulb'?1.1:.8),s,body,em);draw(CUBE,en.x-Math.sin(a)*s*.75,en.y+s*.1,en.z-Math.cos(a)*s*.75,a,0,s*.5,s*.28,s*.2,T.eye,T.eye.map(v=>v*.9));
  draw(CUBE,en.x,en.y+s*.85,en.z,en.spin,0,s*2.6,.04,.12,[.85,.85,.8],[.2,.2,.18]);draw(CUBE,en.x,en.y+s*.85,en.z,en.spin+1.57,0,s*2.6,.04,.12,[.85,.85,.8],[.2,.2,.18]);
  draw(OCTA,en.x,.03,en.z,0,0,s*.9,.01,s*.9,[0,0,0],[0,0,0])}
 for(const o of orbs)draw(OCTA,o.x,o.y,o.z,t*6,t*4,.16,.16,.16,[1,.55,.3],[1,.45,.2]);
 for(const p of parts){const s=p.s*(p.l/p.m+.2);draw(CUBE,p.x,p.y,p.z,p.l*9,p.l*7,s,s,s,p.col,p.col.map(v=>v*.8))}
 for(const tr of traces){const d=sub(tr.b,tr.a),l=Math.hypot(...d),n=d.map(v=>v/l),k=tr.l/.09;draw(CUBE,(tr.a[0]+tr.b[0])/2,(tr.a[1]+tr.b[1])/2,(tr.a[2]+tr.b[2])/2,Math.atan2(n[0],n[2]),-Math.asin(n[1]),.035*k+.01,.035*k+.01,l,[1,.9,.55],odT>0?[1,.7,.25]:[.95,.85,.5])}
 // view model
 gl.clear(gl.DEPTH_BUFFER_BIT);persp(Math.PI/3,asp,.02,5);gl.uniformMatrix4fv(U.P,false,Pm);gl.uniformMatrix4fv(U.V,false,I4);const k=pl.kick,vs=Math.min(1,Math.max(.8,asp)),bx=(asp<1?.075:.15)+Math.sin(pl.bob*.5)*.006,by=-.12+Math.abs(Math.cos(pl.bob*.5))*.005-k*.01,bz=-.42+k*.03;
 const q=k*.12;draw(CUBE,bx,by,bz,0,q,.05,.056,.26,[.14,.36,.28]);draw(CUBE,bx,by+.04,bz-.02,0,q,.026,.02,.19,[.88,.7,.28],[.18,.12,0]);draw(CUBE,bx,by-.055,bz+.08,0,.3,.036,.08,.045,[.1,.24,.19]);
 const glow=odT>0?[1,.6,.2]:reloadT>0?[.3,.3,.3]:[.95,.85,.45];draw(CUBE,bx,by,bz-.14,0,q,.036,.036,.025,glow,glow);if(k>.6)draw(OCTA,bx,by+.005,bz-.19,Math.random()*3,0,.04*k,.04*k,.04*k,[1,.95,.7],[1,.9,.6]);
 radar()}
function radar(){const s=rc.width,c=s/2,R=c-3;rx.clearRect(0,0,s,s);rx.fillStyle='rgba(9,30,23,.6)';rx.strokeStyle='rgba(233,200,106,.5)';rx.lineWidth=1.5*DPR;rx.beginPath();rx.arc(c,c,R,0,7);rx.fill();rx.stroke();
 rx.strokeStyle='rgba(233,200,106,.18)';rx.beginPath();rx.arc(c,c,R/2,0,7);rx.stroke();const sc=R/20,cs=Math.cos(pl.yaw),sn=Math.sin(pl.yaw);
 const pt=(x,z)=>{const dx=x-pl.x,dz=z-pl.z,u=dx*cs-dz*sn,v=dx*sn+dz*cs;return[c+u*sc,c+v*sc]};
 rx.save();rx.beginPath();rx.arc(c,c,R-1,0,7);rx.clip();rx.fillStyle='rgba(120,90,40,.55)';for(const o of OBS){if(o.hw>HALF)continue;const[a,b]=pt(o.x,o.z);rx.fillRect(a-2*DPR,b-2*DPR,4*DPR,4*DPR)}
 for(const k of pick){const[a,b]=pt(k.x,k.z);rx.fillStyle=k.kind==='shield'?'#5fe0a8':'#e9c86a';rx.fillRect(a-2.5*DPR,b-2.5*DPR,5*DPR,5*DPR)}
 for(const e of ens){const[a,b]=pt(e.x,e.z);rx.fillStyle=e.t==='buzz'?'#f3d36b':e.t==='bulb'?'#4fd6a0':'#ff9a66';rx.beginPath();rx.arc(a,b,(e.t==='bulb'?3.6:2.8)*DPR,0,7);rx.fill()}rx.restore();
 rx.fillStyle='#fbe9a6';rx.beginPath();rx.moveTo(c,c-6*DPR);rx.lineTo(c-4*DPR,c+4*DPR);rx.lineTo(c+4*DPR,c+4*DPR);rx.fill()}
let hudC={};function hud(force){const v={s:score.toLocaleString(),c:'x'+combo,w:String(wave||1),hp:Math.round(hp),a:odT>0?'Overdrive':reloadT>0?'Reloading…':`Charge ${ammo}/16`,aw:odT>0?odT/7:reloadT>0?1-reloadT/1.05:ammo/16};
 if(force||v.s!==hudC.s)$('#hScore').textContent=v.s;if(force||v.c!==hudC.c)$('#hCombo').textContent=v.c;if(force||v.w!==hudC.w)$('#hWave').textContent=v.w;if(force||v.hp!==hudC.hp)$('#hHp').style.width=v.hp+'%';
 if(force||v.a!==hudC.a)$('#hAmmoL').textContent=v.a;$('#hAmmo').style.width=Math.round(v.aw*100)+'%';$('#vign').style.opacity=hurtT>0?hurtT*1.6:hp<30?.25+.1*Math.sin(performance.now()/200):0;hudC=v}
let raf=0;function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000||0);last=now;frames++;fpsT+=dt;if(fpsT>=1){fps=frames/fpsT;frames=0;fpsT=0}if(state==='play')step(dt);render()}
// ---------- input ----------
const joy={on:false,id:null,cx:0,cy:0,dx:0,dy:0},look={id:null,x:0,y:0};const tl=$('#touch'),jy=$('#joy');
const lookBy=(dx,dy,k)=>{pl.yaw-=dx*k*set.sens;pl.pitch=Math.max(-1.3,Math.min(1.3,pl.pitch-(set.inv?-dy:dy)*k*set.sens))};
tl.addEventListener('pointerdown',e=>{if(state!=='play'||e.pointerType==='mouse')return;e.preventDefault();if(e.clientX<W*.45&&joy.id===null){joy.id=e.pointerId;joy.on=true;joy.cx=e.clientX;joy.cy=e.clientY;joy.dx=joy.dy=0;jy.style.left=e.clientX+'px';jy.style.top=e.clientY+'px';jy.classList.add('on');jy.firstChild.style.transform=''}
 else if(look.id===null){look.id=e.pointerId;look.x=e.clientX;look.y=e.clientY}});
tl.addEventListener('pointermove',e=>{if(e.pointerId===joy.id){let dx=e.clientX-joy.cx,dy=e.clientY-joy.cy;const l=Math.hypot(dx,dy),m=48;if(l>m){dx*=m/l;dy*=m/l}joy.dx=dx/m;joy.dy=dy/m;jy.firstChild.style.transform=`translate(${dx}px,${dy}px)`}
 else if(e.pointerId===look.id){lookBy(e.clientX-look.x,e.clientY-look.y,.0055);look.x=e.clientX;look.y=e.clientY}});
const up=e=>{if(e.pointerId===joy.id){joy.id=null;joy.on=false;joy.dx=joy.dy=0;jy.classList.remove('on')}if(e.pointerId===look.id)look.id=null};tl.addEventListener('pointerup',up);tl.addEventListener('pointercancel',up);
const fb=$('#fireB');fb.addEventListener('pointerdown',e=>{e.preventDefault();inp.fire=true;fb.classList.add('on');fire()});['pointerup','pointercancel','pointerleave'].forEach(n=>fb.addEventListener(n,()=>{inp.fire=false;fb.classList.remove('on')}));
$('#reloadB').addEventListener('pointerdown',e=>{e.preventDefault();reload()});
// desktop: pointer lock
cv.addEventListener('click',()=>{if(state==='play'&&!touch&&document.pointerLockElement!==cv)cv.requestPointerLock?.()});tl.addEventListener('mousedown',e=>{if(state==='play'&&!touch){if(document.pointerLockElement!==cv)cv.requestPointerLock?.();else{inp.fire=true;fire()}}});
addEventListener('mouseup',()=>{if(!touch)inp.fire=false});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===cv&&state==='play')lookBy(e.movementX,e.movementY,.0025)});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='play'&&!touch)pause()});
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reload();if(e.code==='Escape'||e.code==='KeyP'){if(state==='play')pause()}if(e.code==='Space'&&state==='play'){inp.fire=true;e.preventDefault()}});addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')inp.fire=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;inp.fire=false});
// ---------- menu / flow ----------
const menu=$('#menu'),sens=$('#sens'),inv=$('#inv'),auto=$('#auto');sens.value=set.sens;$('#sensO').textContent=(+set.sens).toFixed(1);inv.checked=set.inv;auto.checked=set.auto;
sens.oninput=()=>{set.sens=+sens.value;$('#sensO').textContent=set.sens.toFixed(1);saveSet()};inv.onchange=()=>{set.inv=inv.checked;saveSet()};auto.onchange=()=>{set.auto=auto.checked;saveSet()};
const fsOK=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen),standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function goFull(){if(standalone||!fsOK||document.fullscreenElement||document.webkitFullscreenElement)return;const el=document.documentElement;try{const p=(el.requestFullscreen||el.webkitRequestFullscreen).call(el,{navigationUI:'hide'});p&&p.then&&p.then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}catch(e){}}
$('#fsB').hidden=!fsOK||standalone;$('#fsB').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else goFull()};
function showMenu(title,text,btn){$('#mTitle').textContent=title;$('#mText').textContent=text;$('#mGo').textContent=btn;$('#mBest').textContent=best()?`Best ${best().toLocaleString()}`:'';menu.hidden=false;inp.fire=false;joy.on=false;joy.id=look.id=null;jy.classList.remove('on');setTimeout(()=>$('#mGo').focus({preventScroll:true}),30)}
$('#mGo').onclick=()=>{if(state==='paused'){resume();return}reset();start()};
function start(){menu.hidden=true;state='play';last=performance.now();if(touch)goFull();else cv.requestPointerLock?.();$('#pause').hidden=false}
function pause(){if(state!=='play')return;state='paused';showMenu('Paused',`Wave ${wave} · Score ${score.toLocaleString()}`,'Resume')}
function resume(){menu.hidden=true;state='play';last=performance.now();if(!touch)cv.requestPointerLock?.()}
function over(){state='over';if(document.pointerLockElement)document.exitPointerLock();const nb=setBest(score);tone(300,.3,'triangle',.08,120);buzz([60,40,120]);
 const acc=shots?Math.round(hits/shots*100):0;setTimeout(()=>showMenu(nb?'New best!':'Shield down',`Score ${score.toLocaleString()} · Wave ${wave} · ${kills} drones tagged · ${acc}% accuracy`,'Play again'),G.reduced?150:600)}
$('#pause').onclick=()=>state==='play'?pause():null;$('#pause').hidden=true;
G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();state='menu';showMenu('Glimmer Guard','Rogue glow-drones have taken over the night greenhouse. Tag them with your light blaster before they drain your shield.','Start');raf=requestAnimationFrame(loop);
window.__glimmer={get state(){return state},get score(){return score},get wave(){return wave},get hp(){return hp},get ammo(){return ammo},get combo(){return combo},get ens(){return ens},get pl(){return pl},get fps(){return fps},get kills(){return kills},
 aim(i=0){const e=ens[i];if(!e)return false;const dx=e.x-pl.x,dz=e.z-pl.z,dy=e.y-1.6;pl.yaw=Math.atan2(-dx,-dz);pl.pitch=Math.atan2(dy,Math.hypot(dx,dz));return true},fire(){fireCd=0;fire()},hurt,set inpFire(v){inp.fire=v}};
})();
