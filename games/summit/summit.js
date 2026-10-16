(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
let W,H,DPR,K,state='ready',last=0,raf=0,t=0,score=0,streak=0,stack,cur,debris,parts,rings,camY=0,camT=0,flashP=0,pops,speed,shake=0;
const SLAB=.22,TOL=.035,PENT=[0,2,4,7,9,12,14,16,19,21];
function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0);K=Math.min(W*.3,H*.21,200)}
addEventListener('resize',()=>{size();draw()});
const hue=i=>{const h=(150-i*4%360+360)%360;return h};const col=(i,l)=>`hsl(${(150+Math.sin(i*.12)*40+i*1.5)%360},${55+Math.sin(i*.3)*10}%,${l}%)`;
function reset(){size();stack=[{x:0,z:0,w:1,d:1,y:0,i:0}];score=0;streak=0;debris=[];parts=[];rings=[];pops=[];speed=1.15;camY=0;camT=0;newCur();ui()}
function newCur(){const top=stack[stack.length-1],axis=stack.length%2?'x':'z',i=stack.length;cur={x:top.x,z:top.z,w:top.w,d:top.d,y:i*SLAB,i,axis,dir:1,p:-1.55};cur[axis]=top[axis]-1.55}
function ui(){$('#sc').textContent=score;$('#st').textContent=streak}
function start(){hide();reset();state='play';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);$('#pause').hidden=false}
function drop(){if(state==='ready')return start();if(state!=='play')return;const top=stack[stack.length-1],a=cur.axis,sz=a==='x'?'w':'d',off=cur[a]-top[a],ov=top[sz]-Math.abs(off);
 if(ov<=0){debris.push({...cur,vy:0,vr:(Math.random()-.5)*2,r:0});tone(150,.4,'sawtooth',.08,60);buzz([40,40,90]);if(!G.reduced)shake=.4;return over()}
 let placed;if(Math.abs(off)<=TOL){streak++;placed={...cur,[a]:top[a]};const pitch=PENT[Math.min(streak-1,PENT.length-1)];tone(523.25*Math.pow(2,pitch/12),.18,'sine',.09);tone(523.25*Math.pow(2,(pitch+7)/12),.22,'triangle',.04,0,.05);buzz(12);
  rings.push({x:placed.x,z:placed.z,w:placed.w,d:placed.d,y:placed.y+SLAB,l:.6});if(streak>=3){const g=Math.min(1,placed[sz]+.06);if(g>placed[sz]){placed[sz]=g;pops.push({txt:'Grow!',l:1})}}
  pops.push({txt:streak>1?`Perfect x${streak}`:'Perfect',l:1});if(streak%5===0){score+=2;pops.push({txt:'+2 bonus',l:1.2})}flashP=.25;
  for(let i=0;i<(G.reduced?6:16);i++)parts.push({x:placed.x+(Math.random()-.5)*placed.w,z:placed.z+(Math.random()-.5)*placed.d,y:placed.y+SLAB,vy:1.5+Math.random(),vx:(Math.random()-.5),vz:(Math.random()-.5),l:.8,c:i%2?'#fbe9a6':'#7de0b5'})}
 else{streak=0;const cutSz=Math.abs(off),c=(cur[a]+top[a])/2;placed={...cur,[sz]:ov,[a]:c};const dc={...cur,[sz]:cutSz,[a]:off>0?c+ov/2+cutSz/2:c-ov/2-cutSz/2,vy:0,vr:(off>0?1:-1)*(1+Math.random()),r:0,axis:a};debris.push(dc);
  tone(330+Math.min(400,stack.length*6),.08,'triangle',.07,240);buzz(10)}
 stack.push(placed);score++;speed=Math.min(2.6,1.15+stack.length*.035);camT=Math.max(0,(stack.length-6)*SLAB);ui();newCur()}
function over(){state='over';$('#pause').hidden=true;const nb=setBest(score);setTimeout(()=>overlay(nb?'New best!':'Tower topped out',`Height ${score} · Best ${best()}`,'Build again',start,nb?'trophy':'restart'),G.reduced?200:900)}
// iso projection
const C30=Math.cos(Math.PI/6),S30=.5;function pr(px,py,pz){return[W/2+(px-pz)*C30*K,H*.62+(px+pz)*S30*K-(py-camY)*K]}
function slab(b,i,alpha=1){const y0=b.y,y1=b.y+SLAB,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;x.globalAlpha=alpha;
 const P=(a,c,d)=>pr(a,c,d),face=(pts,f)=>{x.fillStyle=f;x.beginPath();pts.forEach((p,j)=>j?x.lineTo(...p):x.moveTo(...p));x.closePath();x.fill()};
 face([P(x1,y0,z0),P(x1,y0,z1),P(x1,y1,z1),P(x1,y1,z0)],col(i,38));face([P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],col(i,30));face([P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],col(i,52));
 x.strokeStyle='rgba(251,233,166,.35)';x.lineWidth=1;x.beginPath();[P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)].forEach((p,j)=>j?x.lineTo(...p):x.moveTo(...p));x.closePath();x.stroke();x.globalAlpha=1}
function step(dt){t+=dt;if(state==='play'){cur.p+=cur.dir*speed*dt;if(cur.p>1.55){cur.p=1.55;cur.dir=-1}if(cur.p<-1.55){cur.p=-1.55;cur.dir=1}const top=stack[stack.length-1];cur[cur.axis]=top[cur.axis]+cur.p}
 camY+=(camT-camY)*Math.min(1,dt*4);for(const d of debris){d.vy-=9*dt;d.y+=d.vy*dt*SLAB*4;d.r+=d.vr*dt}debris=debris.filter(d=>d.y>camY-6);
 for(const p of parts){p.vy-=4*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt*.6;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const r of rings)r.l-=dt;rings=rings.filter(r=>r.l>0);for(const p of pops)p.l-=dt;pops=pops.filter(p=>p.l>0);
 flashP=Math.max(0,flashP-dt);shake=Math.max(0,shake-dt)}
function draw(){const hgt=stack?stack.length:0,k=Math.min(1,hgt/60);const sk=x.createLinearGradient(0,0,0,H);sk.addColorStop(0,mix('#f6e7b8','#0b1f2a',k));sk.addColorStop(1,mix('#d8efe2','#183a2e',k));x.fillStyle=sk;x.fillRect(0,0,W,H);
 if(k>.4){x.fillStyle=`rgba(251,233,166,${(k-.4)*1.4})`;for(let i=0;i<40;i++){const sx=(i*137.5)%W,sy=(i*73.3)%(H*.6);x.fillRect(sx,sy,1.5,1.5)}}
 x.fillStyle=mix('rgba(11,110,79,.25)','rgba(10,40,30,.6)',k);x.beginPath();x.moveTo(0,H);for(let i=0;i<=8;i++)x.lineTo(i*W/8,H*.78-Math.sin(i*1.7)*30-(i%2)*20+camY*K*.15);x.lineTo(W,H);x.fill();
 x.save();if(shake>0)x.translate((Math.random()-.5)*16*shake,(Math.random()-.5)*16*shake);
 if(stack){const g=pr(0,-.02,0);x.fillStyle='rgba(0,0,0,.12)';x.beginPath();x.ellipse(g[0],g[1]+K*.35,K*1.05,K*.5,0,0,7);x.fill();
  const base={x:0,z:0,w:1.15,d:1.15,y:-SLAB*3};x.save();slabBase(base);x.restore();
  for(let i=Math.max(0,stack.length-40);i<stack.length;i++)slab(stack[i],stack[i].i);for(const r of rings){const s=1+(.6-r.l)*.6,b={...r,w:r.w*s,d:r.d*s,y:r.y-SLAB};ring(b,r.l/.6)}
  if(state==='play'||state==='ready')slab(cur,cur.i);for(const d of debris){x.save();const c=pr(d.x,d.y+SLAB/2,d.z);x.translate(c[0],c[1]);x.rotate(d.r*.6);x.translate(-c[0],-c[1]);slab(d,d.i,.9);x.restore()}
  for(const p of parts){const c=pr(p.x,p.y,p.z);x.globalAlpha=p.l;x.fillStyle=p.c;x.fillRect(c[0]-2,c[1]-2,4,4)}x.globalAlpha=1}
 x.restore();if(flashP>0){x.fillStyle=`rgba(251,233,166,${flashP*.5})`;x.fillRect(0,0,W,H)}
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${26}px system-ui,sans-serif`;x.fillStyle='#7a5a00';x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=5;const y=H*.22-(1-p.l)*30;x.strokeText(p.txt,W/2,y);x.fillText(p.txt,W/2,y)}x.globalAlpha=1;
 if(state==='play'&&score===0){x.font='600 15px system-ui,sans-serif';x.fillStyle=k>.5?'#ecf2ee':'#16241d';x.fillText('Tap anywhere to drop',W/2,H-30)}}
function slabBase(b){const y0=b.y,y1=b.y+SLAB*3,x0=-b.w/2,x1=b.w/2,z0=-b.d/2,z1=b.d/2,P=pr,face=(pts,f)=>{x.fillStyle=f;x.beginPath();pts.forEach((p,j)=>j?x.lineTo(...p):x.moveTo(...p));x.closePath();x.fill()};
 face([P(x1,y0,z0),P(x1,y0,z1),P(x1,y1,z1),P(x1,y1,z0)],'#5a4a2a');face([P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],'#46391f');face([P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],'#8c7440')}
function ring(b,a){const y=b.y+SLAB,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;x.strokeStyle=`rgba(251,233,166,${a})`;x.lineWidth=3;x.beginPath();[pr(x0,y,z0),pr(x1,y,z0),pr(x1,y,z1),pr(x0,y,z1)].forEach((p,j)=>j?x.lineTo(...p):x.moveTo(...p));x.closePath();x.stroke()}
function mix(a,b,k){const p=s=>s.startsWith('#')?[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16),1]:s.match(/[\d.]+/g).map(Number);const A=p(a),B=p(b);return`rgba(${A.map((v,i)=>i<3?Math.round(v+(B[i]-v)*k):(v+((B[i]??1)-v)*k)).join(',')})`}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;step(dt);draw();if(state==='paused')cancelAnimationFrame(raf)}
cv.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play'||state==='ready')drop()});addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&state==='play'&&!e.target.closest?.('button')){e.preventDefault();drop()}});
function pause(){if(state!=='play')return;state='paused';overlay('Paused',`Height ${score}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();for(let i=0;i<5;i++){cur.p=0;cur[cur.axis]=0;stack.push({...cur});newCur()}cur.p=-.5;cur[cur.axis]=-.5;draw();raf=requestAnimationFrame(loop);
overlay('Summit Stack','Tap to drop each sliding slab onto the tower. Overhangs are trimmed; perfect drops chain and grow your slab back.','Build',start,'play');
window.__summit={get state(){return state},get score(){return score},get streak(){return streak},get cur(){return cur},get stack(){return stack},drop,perfect(){const top=stack[stack.length-1];cur[cur.axis]=top[cur.axis];cur.p=0;drop()}};
})();
