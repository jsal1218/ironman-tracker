// Crestline Rally: run simulation (terrain, car physics, stunts, pickups) and rendering.
// Pure gameplay; menus, economy and persistence live in meta.js. Exposes window.CrestRun.
(()=>{'use strict';const C=window.CRESTLINE,P=C.physics,E=C.economy,{tone,buzz,$}=G,cv=$('#cv'),x=cv.getContext('2d');
const SEG=150,TAU=Math.PI*2,PX=P.pxPerMeter;
let W=0,H=0,top=0,bot=0,raf=0,last=0,t=0,state='idle',cb=null;
let pts=[],objs=[],seed=1,genX=0,canN=0,nextCanX=0;
let car,def,paint,run,cam={x:0,y:0,z:1},parts=[],pops=[],input={gas:false,brake:false},ptrs=new Map(),keys={gas:0,brake:0},bestM=0,shake=0,endT=0,lowBeep=0;
const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
// ---------- terrain ----------
function genTo(xmax){while(genX<xmax){const i=pts.length,xw=i*SEG;let h;
  if(xw<700)h=0;else{const prev=pts[i-1],amp=26+Math.min(xw/45,95),drift=-prev*.09;h=prev+drift+(rnd()-.5)*2*amp;
   // occasional kicker: steep lip then a drop for big air
   if(xw>1400&&rnd()<.11&&!pts.kick){pts.kick=3}if(pts.kick){const k=pts.kick--;h=k===3?prev-60:k===2?prev-95:prev+150}
   const d=h-prev,mx=SEG*(pts.kick?1.1:.62);h=prev+Math.max(-mx,Math.min(mx,d));h=Math.max(-700,Math.min(700,h))}
  pts.push(h);genX=xw;
  if(xw>900){ // objects for this segment
   if(rnd()<.22&&!pts.kick){const r=10+rnd()*13,bx=xw+rnd()*SEG*.6;objs.push({k:'rock',x:bx,y:null,r,passed:false})}
   if(rnd()<.42){const n=4+Math.floor(rnd()*3),cx=xw+SEG*.2;for(let j=0;j<n;j++){const ox=cx+j*28;objs.push({k:'coin',x:ox,y:0,lift:46+Math.sin(j/(n-1)*Math.PI)*34})}}}
  while(nextCanX<xw){objs.push({k:'fuel',x:nextCanX,y:0,lift:30});canN++;nextCanX+=(E.fuelCanFirstM+E.fuelCanStepM*canN)*PX}}}
const ry=o=>o.y==null?(o.y=hAt(o.x)+o.r*.55):o.y;
function hAt(xw){const i=Math.floor(xw/SEG),u=xw/SEG-i;if(i<1)return pts[0]||0;const L=pts.length-1,q=j=>pts[Math.min(j,L)];const p0=q(i-1),p1=q(i),p2=q(i+1),p3=q(i+2);
 return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)}
const slope=xw=>(hAt(xw+2)-hAt(xw-2))/4;
function ground(px,py){const s=slope(px),L=Math.hypot(1,s);let d=(hAt(px)-py)/L,nx=s/L,ny=-1/L,rock=null;
 for(const o of objs){if(o.k!=='rock'||Math.abs(o.x-px)>o.r+40)continue;const dx=px-o.x,dy=py-ry(o),dl=Math.hypot(dx,dy)||1,dd=dl-o.r;if(dd<d){d=dd;nx=dx/dl;ny=dy/dl;rock=o}}return{d,nx,ny,rock}}
// ---------- car ----------
function dims(d){const w=d.wheelbase+34,h=d.body==='truck'?30:d.body==='gt'?20:24;return{w,h}}
function newCar(px){const d=dims(def),gy=hAt(px);return{x:px,y:gy-def.wheelR-P.suspTravel-14,vx:0,vy:0,a:Math.atan(slope(px)),w:0,W:d.w,Hh:d.h,m:def.mass,I:def.mass*(d.w*d.w+d.h*d.h)/12*1.1,
 wheels:[{ox:-def.wheelbase/2,comp:0,spin:0,c:false},{ox:def.wheelbase/2,comp:0,spin:0,c:false}],air:0,airRot:0,grounded:true,upside:0,stall:0}}
function rot(a,px,py){const c=Math.cos(a),s=Math.sin(a);return[px*c-py*s,px*s+py*c]}
function physStep(dt){const c=car,m=c.m;let fx=0,fy=P.gravity*m,tq=0;const add=(px,py,Fx,Fy)=>{fx+=Fx;fy+=Fy;tq+=(px-c.x)*Fy-(py-c.y)*Fx};
 const gas=input.gas&&run.fuel>0,brk=input.brake,down=rot(c.a,0,1);let contacts=0;
 for(const wh of c.wheels){const[ax,ay]=rot(c.a,wh.ox,8),Ax=c.x+ax,Ay=c.y+ay,wx=Ax+down[0]*P.suspTravel,wy=Ay+down[1]*P.suspTravel,g=ground(wx,wy),r=def.wheelR;wh.c=false;
  if(g.d<r){contacts++;wh.c=true;const comp=r-g.d;wh.comp=Math.min(comp,P.suspTravel);const rx=wx-c.x,ry=wy-c.y,vpx=c.vx-c.w*ry,vpy=c.vy+c.w*rx,vn=vpx*g.nx+vpy*g.ny;
   let Fn=def.k*comp*m*5-def.c*m*vn*1.2;if(comp>P.suspTravel)Fn+=P.stopStiffness*m*(comp-P.suspTravel);Fn=Math.max(0,Fn);
   const tx=-g.ny,ty=g.nx,vt=vpx*tx+vpy*ty;let Ft;
   if(gas)Ft=def.power*m*.5*Math.max(0,1-Math.max(0,vt)/def.topSpeed);else if(brk)Ft=vt>25?-1000*m*.5:-def.power*.45*m*.5*Math.max(0,1-Math.max(0,-vt)/220);else Ft=-vt*.35*m*.5;
   const lim=def.grip*Fn;Ft=Math.max(-lim,Math.min(lim,Ft));
   add(wx,wy,g.nx*Fn,g.ny*Fn);add(Ax,Ay,tx*Ft,ty*Ft);wh.spin+=vt/r*dt;
   if(g.rock)g.rock.touched=true}else{wh.comp=Math.max(0,wh.comp-dt*60);if(gas)wh.spin+=.35;else if(brk)wh.spin*=.9}}
 // chassis points: top corners + helmet crash, bottom corners scrape
 const hw=c.W/2,hh=c.Hh,body=[[-hw,-hh*.2,0],[hw,-hh*.2,0],[-hw*.9,-hh,1],[hw*.9,-hh,1],[0,-hh-14,1],[-hw,6,0],[hw,6,0]];let scraping=0;
 for(const[bx,by,crash]of body){const[rx,ry]=rot(c.a,bx,by),px=c.x+rx,py=c.y+ry,g=ground(px,py);if(g.d<0){if(crash&&g.d<-1){run.crashInfo=[bx,+by.toFixed(1),g.rock?1:0,+c.a.toFixed(2),Math.round(c.vx),Math.round(c.vy)];return end('crash')}scraping++;
  const vpx=c.vx-c.w*ry,vpy=c.vy+c.w*rx,vn=vpx*g.nx+vpy*g.ny,Fn=Math.max(0,-g.d*P.bodyStiffness*m-vn*20*m),tx=-g.ny,ty=g.nx,vt=vpx*tx+vpy*ty,Ft=Math.max(-.6*Fn,Math.min(.6*Fn,-vt*8*m));add(px,py,g.nx*Fn+tx*Ft,g.ny*Fn+ty*Ft);
  if(Math.abs(vt)>120&&Math.random()<.08)spark(px,py)}}
 if(contacts===0){const dir=brk?1:gas?-1:0;if(dir){c.w+=dir*def.air*.75*dt;c.w=Math.max(-P.airTiltMax,Math.min(P.airTiltMax,c.w))}}else{const dir=brk?1:gas?-1:0;tq+=dir*def.air*c.I*.05;c.w*=Math.exp(-(contacts===1?2.5:1)*dt)}
 c.vx+=fx/m*dt;c.vy+=fy/m*dt;c.w+=tq/c.I*dt;c.w*=Math.exp(-P.angularDamping*dt);c.x+=c.vx*dt;c.y+=c.vy*dt;c.a+=c.w*dt;c.vx*=1-.015*dt;
 return{contacts,scraping}}
// ---------- run ----------
function start(o){def=o.car;paint=o.paint;bestM=o.bestM||0;cb=o.onEnd;seed=1+Math.floor(Math.random()*2147483646);pts=[];objs=[];genX=-SEG;canN=0;nextCanX=(E.fuelCanFirstM)*PX;pts.kick=0;genTo(4000);
 car=newCar(200);run={startX:200,maxX:200,fuel:def.fuel*(1+(o.boostPct||0)/100),tank:def.fuel*(1+(o.boostPct||0)/100),coins:0,stunt:0,flips:0,bestAir:0,closePasses:0,perfect:0,time:0,revived:false,why:''};
 cam={x:car.x,y:car.y,z:zoom()};parts=[];pops=[];ptrs.clear();input.gas=input.brake=false;state='run';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);engine(true)}
function revive(pct){if(!car)return;const px=car.x;objs=objs.filter(o=>!(o.k==='rock'&&Math.abs(o.x-px)<260));car=newCar(px);run.fuel=Math.max(run.fuel,run.tank*pct/100);run.revived=true;state='run';$('#pause').hidden=false;pops.push({txt:'Revived!',l:1.4,big:1});last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);engine(true)}
function end(why){if(state!=='run')return;state='ending';run.why=why;endT=G.reduced?.3:1.1;$('#pause').hidden=true;engine(false);if(why==='crash'){if(!G.reduced)shake=.5;tone(160,.4,'sawtooth',.07,60);tone(900,.06,'square',.04);buzz([50,30,120]);for(let i=0;i<24;i++)spark(car.x,car.y-10)}else{tone(300,.5,'sine',.06,120)}}
function result(){const distM=Math.floor((run.maxX-run.startX)/PX),score=distM+run.stunt,coins=run.coins+Math.floor(distM*E.coinsPerMeter)+Math.floor(run.stunt*E.coinsPerStuntPoint);
 return{why:run.why,distM,score,stunt:run.stunt,flips:run.flips,bestAir:Math.round(run.bestAir*10)/10,closePasses:run.closePasses,perfect:run.perfect,pickupCoins:run.coins,coins,time:Math.round(run.time),revived:run.revived,car:def.id}}
function pop(txt,big){pops.push({txt,l:1.3,big});if(pops.length>4)pops.shift()}
function step(dt){t+=dt;run.time+=dt;const n=P.substeps,h=dt/n;let st={contacts:0,scraping:0};
 input.gas=keys.gas||[...ptrs.values()].includes('gas');input.brake=keys.brake||[...ptrs.values()].includes('brake');
 for(let i=0;i<n;i++){st=physStep(h)||st;if(state!=='run')return}
 const c=car;run.fuel=Math.max(0,run.fuel-def.burn*(input.gas?1:.22)*dt);run.maxX=Math.max(run.maxX,c.x);genTo(c.x+3000);objs=objs.filter(o=>o.x>c.x-1400);
 // stunts
 if(st.contacts===0&&st.scraping===0){c.air+=dt;c.airRot+=c.w*dt}else{if(c.air>.15){const flips=Math.floor((Math.abs(c.airRot)+.7)/TAU);let pts2=0;
   if(flips>0){pts2+=flips*E.flipPoints+(flips-1)*E.multiFlipBonus;run.flips+=flips;pop(`${flips>1?flips+'x ':''}${c.airRot<0?'Backflip':'Frontflip'}  +${flips*E.flipPoints+(flips-1)*E.multiFlipBonus}`,1);tone(660,.12,'triangle',.07,990);tone(990,.16,'triangle',.05,1320,.08);buzz(20)}
   if(c.air>=E.airMinSec){const a=Math.round(c.air*E.airPointsPerSec);pts2+=a;pop(`Big air ${c.air.toFixed(1)}s  +${a}`);tone(520,.1,'sine',.05,780)}
   const sa=Math.atan(slope(c.x)),da=Math.abs(((c.a-sa)%TAU+TAU+Math.PI)%TAU-Math.PI);if(c.air>.6&&da<.22&&st.contacts===2){pts2+=E.perfectLandingPoints;run.perfect++;pop(`Clean landing  +${E.perfectLandingPoints}`);c.vx+=40*Math.cos(sa)}
   run.bestAir=Math.max(run.bestAir,c.air);run.stunt+=pts2;dust(c.x,c.y+20,10)}c.air=0;c.airRot=0}
 // close passes over rocks
 for(const o of objs){if(o.k!=='rock'||o.passed||c.x<o.x)continue;o.passed=true;const low=Math.max(...c.wheels.map(wh=>{const[ax,ay]=rot(c.a,wh.ox,8+P.suspTravel);return c.y+ay+def.wheelR})),clr=(ry(o)-o.r)-low;
  if(!o.touched&&clr>0&&clr<E.closePassClearancePx){run.closePasses++;run.stunt+=E.closePassPoints;pop(`Close pass  +${E.closePassPoints}`);tone(880,.06,'square',.03,1200)}}
 // pickups
 for(const o of objs){if(o.k==='rock'||o.got)continue;const oy=hAt(o.x)-o.lift;if(Math.hypot(o.x-c.x,oy-(c.y-6))<38){o.got=true;
  if(o.k==='coin'){run.coins+=E.coinValue;tone(1200+(run.coins%25)*12,.05,'sine',.04);for(let i=0;i<4;i++)parts.push({x:o.x,y:oy,vx:(Math.random()-.5)*120,vy:-Math.random()*120,l:.4,c:'#ffe08a',r:2})}
  else{run.fuel=run.tank;pop('Fuel refilled',1);tone(440,.1,'triangle',.06,880);tone(880,.12,'triangle',.05,1320,.1);buzz(15)}}}
 // end conditions
 const up=Math.abs(((c.a%TAU)+TAU+Math.PI)%TAU-Math.PI)>1.9;if(up&&st.scraping>0)c.upside+=dt;else c.upside=0;if(c.upside>P.crashUpsideSec)return end('crash');
 if(run.fuel<=0&&Math.hypot(c.vx,c.vy)<18)c.stall+=dt;else c.stall=0;if(c.stall>P.stallSec)return end('fuel');
 if(c.y>hAt(c.x)+600)return end('crash');
 if(run.fuel>0&&run.fuel<run.tank*.2){lowBeep-=dt;if(lowBeep<=0){tone(520,.06,'square',.02);lowBeep=1.2}}
 if(st.contacts&&Math.hypot(c.vx,c.vy)>120&&Math.random()<.35)dust(c.x-c.W*.4,c.y+20,1);
 ui()}
function ui(){$('#hDist').textContent=Math.floor((run.maxX-run.startX)/PX)+' m';$('#hCoins').textContent=run.coins}
function spark(px,py){parts.push({x:px,y:py,vx:(Math.random()-.5)*260,vy:-Math.random()*220,l:.5,c:'#ffd27a',r:1.6})}
function dust(px,py,n){for(let i=0;i<(G.reduced?Math.ceil(n/3):n);i++)parts.push({x:px+(Math.random()-.5)*20,y:py,vx:-40-Math.random()*80,vy:-20-Math.random()*60,l:.6,c:'rgba(214,170,120,.8)',r:3+Math.random()*3})}
function fx(dt){for(const p of parts){p.vy+=300*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const p of pops)p.l-=dt;pops=pops.filter(p=>p.l>0);shake=Math.max(0,shake-dt)}
// ---------- engine sound (own context so it can hum continuously; silent when muted) ----------
let eng=null;function engine(on){try{if(on&&!G.muted){if(!eng){const ac=new(window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=600;g.gain.value=0;o.connect(f).connect(g).connect(ac.destination);o.start();eng={ac,o,g}}eng.ac.resume()}else if(eng){eng.g.gain.value=0;eng.ac.suspend()}}catch(e){}}
function engineTick(){if(!eng)return;if(G.muted||state!=='run'){eng.g.gain.value=0;return}const sp=Math.hypot(car.vx,car.vy);eng.o.frequency.value=50+sp*.12+(input.gas?25:0);eng.g.gain.value=input.gas&&run.fuel>0?.035:.015}
// ---------- render ----------
function zoom(){const z=Math.max(.5,Math.min(1.15,Math.min(W/600,(H-top)/350)));return z}
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot}
const SX=wx=>(wx-cam.x)*cam.z+W*.34,SY=wy=>(wy-cam.y)*cam.z+top+(H-top)*.56;
function sky(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1840');g.addColorStop(.45,'#9b3f8c');g.addColorStop(.8,'#ff8f5a');g.addColorStop(1,'#ffc46b');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='rgba(255,230,170,.9)';x.beginPath();x.arc(W*.78,H*.42,Math.min(W,H)*.09,0,TAU);x.fill();
 const layers=[['#7a3a7e',.12,.5,90],['#5a2a63',.25,.6,70],['#3d1c48',.45,.7,55]];for(const[col,par,base,amp]of layers){x.fillStyle=col;x.beginPath();x.moveTo(0,H);const off=cam.x*par*cam.z;
  for(let sx=0;sx<=W+20;sx+=20){const u=(sx+off)/180;x.lineTo(sx,H*base-amp*(Math.sin(u)*.6+Math.sin(u*2.3+1)*.3+Math.sin(u*.37+2)*.4)*Math.min(1.4,H/500))}x.lineTo(W,H);x.fill()}}
function terrain(){const x0=cam.x-(W*.34)/cam.z-40,x1=x0+W/cam.z+120,step=Math.max(6,10/cam.z);
 x.beginPath();x.moveTo(SX(x0),H+10);for(let wx=x0;wx<=x1;wx+=step)x.lineTo(SX(wx),SY(hAt(wx)));x.lineTo(SX(x1),H+10);x.closePath();
 const g=x.createLinearGradient(0,SY(cam.y),0,H+200);g.addColorStop(0,'#8a4a2e');g.addColorStop(1,'#3a1c22');x.fillStyle=g;x.fill();
 x.lineJoin='round';x.strokeStyle='#3fd17a';x.lineWidth=9*cam.z;x.beginPath();for(let wx=x0;wx<=x1;wx+=step){const sx=SX(wx),sy=SY(hAt(wx))+3*cam.z;wx===x0?x.moveTo(sx,sy):x.lineTo(sx,sy)}x.stroke();
 x.strokeStyle='rgba(30,120,70,.7)';x.lineWidth=3*cam.z;x.beginPath();for(let wx=x0;wx<=x1;wx+=step){const sx=SX(wx),sy=SY(hAt(wx))+8*cam.z;wx===x0?x.moveTo(sx,sy):x.lineTo(sx,sy)}x.stroke();
 // distance posts + best marker
 const m0=Math.ceil((x0-(run?run.startX:200))/(PX*100))*100;for(let m=Math.max(100,m0);m*PX+(run?run.startX:200)<x1;m+=100){const wx=(run?run.startX:200)+m*PX,sx=SX(wx),sy=SY(hAt(wx));x.fillStyle='#f6f1ff';x.fillRect(sx-1.5,sy-34*cam.z,3,34*cam.z);x.font=`800 ${11*cam.z+3}px system-ui,sans-serif`;x.textAlign='center';x.fillText(m+' m',sx,sy-38*cam.z)}
 if(bestM>50&&run){const wx=run.startX+bestM*PX;if(wx>x0&&wx<x1){const sx=SX(wx),sy=SY(hAt(wx));x.fillStyle='#ffe08a';x.fillRect(sx-2,sy-60*cam.z,4,60*cam.z);x.beginPath();x.moveTo(sx+2,sy-60*cam.z);x.lineTo(sx+30*cam.z,sy-52*cam.z);x.lineTo(sx+2,sy-44*cam.z);x.fill();x.font=`800 ${10*cam.z+3}px system-ui,sans-serif`;x.fillText('BEST',sx,sy-64*cam.z)}}}
function objects(){for(const o of objs){const sx=SX(o.x);if(sx<-60||sx>W+60||o.got)continue;
 if(o.k==='rock'){const sy=SY(ry(o)),r=o.r*cam.z;const g=x.createRadialGradient(sx-r*.35,sy-r*.4,1,sx,sy,r);g.addColorStop(0,'#b9a7c9');g.addColorStop(1,'#5b4a6b');x.fillStyle=g;x.beginPath();x.ellipse(sx,sy,r,r*.92,0,0,TAU);x.fill()}
 else if(o.k==='coin'){const sy=SY(hAt(o.x)-o.lift),sc=G.reduced?1:Math.abs(Math.cos(t*4+o.x*.01)),r=9*cam.z+2;x.fillStyle='#f2c94c';x.beginPath();x.ellipse(sx,sy,r*Math.max(.2,sc),r,0,0,TAU);x.fill();x.fillStyle='#fff6c8';x.beginPath();x.ellipse(sx-r*.2*sc,sy-r*.25,r*.35*Math.max(.2,sc),r*.35,0,0,TAU);x.fill()}
 else{const sy=SY(hAt(o.x)-o.lift),s=cam.z*1.1+.3,b=G.reduced?0:Math.sin(t*3)*3;x.save();x.translate(sx,sy+b);x.scale(s,s);x.fillStyle='rgba(255,90,70,.25)';x.beginPath();x.arc(0,0,22,0,TAU);x.fill();x.fillStyle='#e8402e';x.beginPath();x.roundRect?x.roundRect(-11,-14,22,28,4):x.rect(-11,-14,22,28);x.fill();x.fillStyle='#a8241a';x.fillRect(-7,-19,10,6);x.fillStyle='#fff';x.beginPath();x.moveTo(0,-7);x.quadraticCurveTo(7,2,0,8);x.quadraticCurveTo(-7,2,0,-7);x.fill();x.restore()}}}
function paintFill(ctx,pt,x0,y0,w,h){if(!pt)return'#ff7a3d';if(pt.pattern==='gradient'||pt.pattern==='gold'){const g=ctx.createLinearGradient(x0,y0,x0+w,y0+h);g.addColorStop(0,pt.a);g.addColorStop(pt.pattern==='gold'?.5:1,pt.b);if(pt.pattern==='gold'){g.addColorStop(.75,pt.a);g.addColorStop(1,pt.b)}return g}const g=ctx.createLinearGradient(0,y0,0,y0+h);g.addColorStop(0,pt.a);g.addColorStop(1,pt.pattern?pt.a:pt.b);return g}
// draws a car in local coords (origin = chassis center, y down); used by the run and the garage/menu previews
function drawCar(ctx,d,pt,wheels,s=1){const{w,h}=dims(d),hw=w/2,R=d.wheelR,fill=paintFill(ctx,pt,-hw,-h,w,h),dark=pt&&pt.b||'#c94a1a';ctx.save();ctx.scale(s,s);ctx.lineJoin='round';
 const path=()=>{ctx.beginPath();if(d.body==='truck'){ctx.moveTo(-hw,4);ctx.lineTo(-hw,-h*.45);ctx.lineTo(hw*.05,-h*.45);ctx.lineTo(hw*.15,-h);ctx.lineTo(hw*.7,-h);ctx.lineTo(hw,-h*.35);ctx.lineTo(hw,4)}
  else if(d.body==='gt'){ctx.moveTo(-hw,2);ctx.lineTo(-hw,-h*.5);ctx.lineTo(-hw*.4,-h*.65);ctx.lineTo(-hw*.05,-h*1.25);ctx.lineTo(hw*.45,-h*1.2);ctx.lineTo(hw,-h*.35);ctx.lineTo(hw,2)}
  else if(d.body==='rover'){ctx.moveTo(-hw,2);ctx.lineTo(-hw,-h*.55);ctx.lineTo(hw,-h*.55);ctx.lineTo(hw,2)}
  else if(d.body==='hopper'){ctx.moveTo(-hw,2);ctx.quadraticCurveTo(-hw,-h,0,-h);ctx.quadraticCurveTo(hw,-h,hw,2)}
  else{ctx.moveTo(-hw,2);ctx.lineTo(-hw*.85,-h*.55);ctx.lineTo(hw*.6,-h*.55);ctx.lineTo(hw,-h*.1);ctx.lineTo(hw,2)}ctx.closePath()};
 // suspension struts
 ctx.strokeStyle='#2a2230';ctx.lineWidth=4;for(const wh of wheels){ctx.beginPath();ctx.moveTo(wh.ox,0);ctx.lineTo(wh.ox,8+P.suspTravel-wh.comp);ctx.stroke()}
 path();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.stroke();
 if(pt&&pt.pattern==='stripe'){ctx.save();path();ctx.clip();ctx.fillStyle=pt.b;ctx.fillRect(-hw,-h*.42,w,h*.18);ctx.restore()}
 if(pt&&pt.pattern==='checker'){ctx.save();path();ctx.clip();ctx.fillStyle=pt.b;for(let i=-hw;i<hw;i+=8)for(let j=-h*1.3;j<6;j+=8)if(((i+hw)/8+(j+h*1.3)/8|0)%2)ctx.fillRect(i,j,8,8);ctx.restore()}
 if(pt&&pt.pattern==='gold'){ctx.save();path();ctx.clip();ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(-hw*.2,-h*1.3);ctx.lineTo(hw*.05,-h*1.3);ctx.lineTo(-hw*.15,6);ctx.lineTo(-hw*.4,6);ctx.fill();ctx.restore()}
 // cabin / cage + driver helmet (the crash point)
 ctx.strokeStyle='#2a2230';ctx.lineWidth=3;if(d.body==='buggy'||d.body==='hopper'||d.body==='rover'){ctx.beginPath();ctx.moveTo(-hw*.35,-h*.5);ctx.lineTo(-hw*.2,-h-6);ctx.lineTo(hw*.25,-h-6);ctx.lineTo(hw*.4,-h*.5);ctx.stroke()}
 if(d.body==='truck'||d.body==='gt'){ctx.fillStyle='rgba(180,230,255,.75)';ctx.beginPath();if(d.body==='truck'){ctx.moveTo(hw*.22,-h*.9);ctx.lineTo(hw*.62,-h*.9);ctx.lineTo(hw*.85,-h*.45);ctx.lineTo(hw*.2,-h*.45)}else{ctx.moveTo(-hw*.02,-h*1.12);ctx.lineTo(hw*.4,-h*1.08);ctx.lineTo(hw*.7,-h*.6);ctx.lineTo(-hw*.25,-h*.62)}ctx.fill()}
 const hx=d.body==='truck'?hw*.42:d.body==='gt'?hw*.18:0,hy=d.body==='truck'?-h*.72:d.body==='gt'?-h*.86:-h-1;ctx.fillStyle='#f6f1ff';ctx.beginPath();ctx.arc(hx,hy,7,0,TAU);ctx.fill();ctx.fillStyle='#2a1840';ctx.beginPath();ctx.ellipse(hx+3.5,hy,3.2,4.2,0,0,TAU);ctx.fill();
 if(d.body==='rover'){ctx.strokeStyle='#d9cdf0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-hw*.8,-h*.55);ctx.lineTo(-hw*.9,-h*1.8);ctx.stroke();ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(-hw*.9,-h*1.8,3,0,TAU);ctx.fill();ctx.fillStyle='#3a5fd9';ctx.fillRect(hw*.45,-h*.95,hw*.45,h*.35)}
 ctx.fillStyle=dark;ctx.fillRect(hw-5,-h*.3,5,5);
 // wheels
 for(const wh of wheels){const wy=8+P.suspTravel-wh.comp;ctx.fillStyle='#1d1820';ctx.beginPath();ctx.arc(wh.ox,wy,R,0,TAU);ctx.fill();ctx.fillStyle='#cfc6d8';ctx.beginPath();ctx.arc(wh.ox,wy,R*.55,0,TAU);ctx.fill();ctx.strokeStyle='#6e6478';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<5;k++){const a=wh.spin+k*TAU/5;ctx.moveTo(wh.ox,wy);ctx.lineTo(wh.ox+Math.cos(a)*R*.55,wy+Math.sin(a)*R*.55)}ctx.stroke()}
 ctx.restore()}
function hudCanvas(){if(!run)return;const fx0=12,fy0=top+6,fw=Math.min(180,W*.42),pct=run.fuel/run.tank,low=pct<.2;
 x.fillStyle='rgba(26,14,40,.6)';x.beginPath();x.roundRect?x.roundRect(fx0,fy0,fw+44,30,10):x.rect(fx0,fy0,fw+44,30);x.fill();
 x.fillStyle='#e8402e';x.fillRect(fx0+10,fy0+8,12,15);x.fillStyle='#fff';x.font='800 9px system-ui,sans-serif';x.textAlign='center';x.fillText('F',fx0+16,fy0+19);
 x.fillStyle='rgba(255,255,255,.18)';x.fillRect(fx0+32,fy0+10,fw,10);x.fillStyle=low?(Math.sin(t*10)>0?'#ff5a4a':'#ffb0a0'):pct<.45?'#ffd25a':'#5fe0ad';x.fillRect(fx0+32,fy0+10,fw*pct,10);
 if(low&&state==='run'){x.fillStyle='#ffd0c8';x.font='800 12px system-ui,sans-serif';x.textAlign='left';x.fillText(run.fuel>0?'Low fuel':'Out of fuel',fx0+32,fy0+46)}
 // pedals
 const pr=Math.min(46,W*.1),py=H-bot-pr-14;for(const[side,lab]of[['brake','BRAKE'],['gas','GAS']]){const cx=side==='brake'?pr+18:W-pr-18,on=input[side];x.globalAlpha=on?.85:.35;x.fillStyle=side==='gas'?'#1fa774':'#c9453a';x.beginPath();x.roundRect?x.roundRect(cx-pr*.7,py-pr,pr*1.4,pr*2,14):x.rect(cx-pr*.7,py-pr,pr*1.4,pr*2);x.fill();x.fillStyle='#fff';x.font=`800 ${Math.round(pr*.28)}px system-ui,sans-serif`;x.textAlign='center';x.fillText(lab,cx,py+pr*.1);x.globalAlpha=1}
 x.textAlign='center';pops.forEach((p,i)=>{x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${p.big?24:18}px system-ui,sans-serif`;x.lineWidth=5;x.strokeStyle='rgba(26,14,40,.7)';const yy=top+64+i*28;x.strokeText(p.txt,W/2,yy);x.fillStyle=p.big?'#ffe08a':'#fff';x.fillText(p.txt,W/2,yy)});x.globalAlpha=1}
function draw(){if(!W)size();sky();if(!car){return}
 const sp=Math.hypot(car.vx,car.vy),tz=zoom()*(1-Math.min(.22,sp/3500));cam.z+=(tz-cam.z)*.05;const look=Math.max(-60,Math.min(W*.22/cam.z,car.vx*.35));cam.x+=(car.x+look-cam.x)*.12;cam.y+=(car.y-cam.y)*.1;
 x.save();if(shake>0)x.translate((Math.random()-.5)*12*shake,(Math.random()-.5)*12*shake);terrain();objects();
 x.save();x.translate(SX(car.x),SY(car.y));x.rotate(car.a);drawCar(x,def,paint,car.wheels,cam.z);x.restore();
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*2);x.fillStyle=p.c;x.beginPath();x.arc(SX(p.x),SY(p.y),p.r*cam.z+.5,0,TAU);x.fill()}x.globalAlpha=1;x.restore();
 if(state==='run'||state==='paused'||state==='ending')hudCanvas()}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;
 if(state==='run'){step(dt);engineTick()}else if(state==='ending'){const n=P.substeps;for(let i=0;i<n;i++){car.vx*=.995;car.vy+=P.gravity*dt/n*.5;car.x+=car.vx*dt/n*.4;car.y+=Math.min(car.vy,200)*dt/n*.2;car.a+=car.w*dt/n*.4}endT-=dt;if(endT<=0){state='done';cancelAnimationFrame(raf);draw();cb&&cb(result());return}}
 fx(dt);draw();if(state==='paused'||state==='idle')cancelAnimationFrame(raf)}
// attract scene for menus: parked car on the opening hills
function scene(d,pt){def=d;paint=pt;if(state==='run'||state==='paused'||state==='ending')return;seed=7;pts=[];objs=[];genX=-SEG;canN=0;nextCanX=1e9;pts.kick=0;genTo(3000);car=newCar(260);run=null;size();cam={x:car.x+40,y:car.y-20,z:zoom()};for(let i=0;i<120;i++){input.gas=input.brake=false;physStep(1/240)}state='idle';parts=[];pops=[];draw()}
function pause(){if(state!=='run')return false;state='paused';ptrs.clear();keys.gas=keys.brake=0;engine(false);draw();return true}
function resume(){if(state!=='paused')return;state='run';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);engine(true)}
// input
cv.addEventListener('pointerdown',e=>{if(state!=='run')return;e.preventDefault();cv.setPointerCapture?.(e.pointerId);const r=cv.getBoundingClientRect();ptrs.set(e.pointerId,e.clientX-r.left<r.width/2?'brake':'gas')});
const up=e=>ptrs.delete(e.pointerId);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('lostpointercapture',up);
addEventListener('keydown',e=>{const k=e.code;if(['ArrowRight','KeyD','ArrowUp','KeyW'].includes(k)){keys.gas=1;if(state==='run')e.preventDefault()}else if(['ArrowLeft','KeyA','ArrowDown','KeyS'].includes(k)){keys.brake=1;if(state==='run')e.preventDefault()}});
addEventListener('keyup',e=>{const k=e.code;if(['ArrowRight','KeyD','ArrowUp','KeyW'].includes(k))keys.gas=0;else if(['ArrowLeft','KeyA','ArrowDown','KeyS'].includes(k))keys.brake=0});
addEventListener('resize',()=>{size();if(state!=='run')draw()});
window.CrestRun={start,revive,pause,resume,scene,drawCar,get state(){return state},get run(){return run},get car(){return car},
 // test helpers
 debug:{launch(vy,w){car.y-=60;car.vy=vy;car.w=w},fuel(v){run.fuel=v},crash(){end('crash')},hold(side,on){if(on)ptrs.set('t'+side,side);else ptrs.delete('t'+side)},rocks(){return objs.filter(o=>o.k==='rock').map(o=>({x:o.x,y:ry(o),r:o.r}))}}};
})();
