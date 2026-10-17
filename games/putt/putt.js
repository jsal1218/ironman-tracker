// Pebble Putt: relaxing nine-hole mini golf. Drag back from anywhere to aim (with a trajectory preview), release to putt.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
const R2=(a,b,w,h)=>[a,b,w,h],rectP=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
const HOLES=[
 {par:2,poly:rectP(22,12,78,150),tee:[50,136],cup:[50,32]},
 {par:3,poly:[[15,150],[45,150],[45,60],[85,60],[85,14],[15,14]],tee:[30,136],cup:[72,36],sand:[R2(15,14,16,18)]},
 {par:3,poly:rectP(15,10,85,150),tee:[50,138],cup:[50,24],bump:[[35,82,6],[65,82,6],[50,58,6],[50,106,6],[28,40,4],[72,40,4]]},
 {par:3,poly:rectP(20,10,80,150),tee:[50,136],cup:[50,26],sand:[R2(20,66,60,22),R2(56,18,16,12)]},
 {par:3,poly:rectP(10,10,90,150),tee:[28,136],cup:[30,28],water:[R2(10,64,58,30)],bump:[[80,79,4]]},
 {par:3,poly:rectP(15,10,85,150),tee:[25,136],cup:[70,26],walls:[[15,106,60,106],[40,60,85,60]],sand:[R2(62,112,23,14)]},
 {par:2,poly:rectP(25,10,75,150),tee:[50,138],cup:[50,28],wheel:{x:50,y:86,len:22,w:1.4}},
 {par:3,poly:rectP(10,10,90,150),tee:[50,136],cup:[50,24],water:[R2(10,72,33,20),R2(57,72,33,20)],bump:[[50,46,4]]},
 {par:4,poly:[[10,150],[40,150],[40,48],[60,48],[60,150],[90,150],[90,10],[10,10]],tee:[25,136],cup:[75,134],bump:[[50,27,5]],sand:[R2(60,92,30,14)],wheel:{x:75,y:66,len:13,w:-1.8}}];
const BR=2.2,CR=3.6,MAXS=8;
let W,H,top,bot,k=3,ox=0,oy=0,state='ready',raf=0,last=0,t=0,score=0,hole=0,strokes=0,totalStrokes=0,ball,rest,hd,segs,phase='aim',drag=null,parts=[],pops=[],trees=[],wheelA=0,splash=0,sinkT=0,results=[];
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot;k=Math.min((W-20)/100,(H-top-bot-40)/160);ox=(W-100*k)/2;oy=top+Math.max(6,(H-top-bot-40-160*k)/2);
 trees=[];let s=7;const rnd=()=>(s=(s*9301+49297)%233280)/233280;for(let i=0;i<46;i++)trees.push({x:rnd()*W,y:rnd()*H,r:14+rnd()*26,h:rnd()})}
addEventListener('resize',()=>{size();draw()});
const S=(u,v)=>[ox+u*k,oy+v*k];
function loadHole(i){hole=i;hd=HOLES[i];strokes=0;segs=[];const p=hd.poly;for(let j=0;j<p.length;j++){const a=p[j],b=p[(j+1)%p.length];segs.push([a[0],a[1],b[0],b[1]])}for(const w of hd.walls||[])segs.push(w);ball={x:hd.tee[0],y:hd.tee[1],vx:0,vy:0,z:1};rest={x:ball.x,y:ball.y};phase='aim';wheelA=0;ui()}
function ui(){$('#sc').textContent=score.toLocaleString();$('#ho').textContent=`${hole+1}/9`;$('#st').textContent=`${strokes}/${hd?hd.par:0}`}
function reset(){size();score=0;totalStrokes=0;results=[];parts=[];pops=[];loadHole(0)}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
const inR=(p,r)=>p.x>=r[0]&&p.x<=r[0]+r[2]&&p.y>=r[1]&&p.y<=r[1]+r[3];
function wheelSeg(a){const w=hd.wheel;if(!w)return null;const c=Math.cos(a)*w.len,s=Math.sin(a)*w.len;return[w.x-c,w.y-s,w.x+c,w.y+s]}
function collideSeg(b,sg,e=.72,mv){const[x1,y1,x2,y2]=sg,dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;let u=((b.x-x1)*dx+(b.y-y1)*dy)/l2;u=Math.max(0,Math.min(1,u));const px=x1+dx*u,py=y1+dy*u;let nx=b.x-px,ny=b.y-py;const d=Math.hypot(nx,ny);const rr=BR+(mv?1:0);if(d>=rr||d===0)return false;nx/=d;ny/=d;b.x=px+nx*rr;b.y=py+ny*rr;
 let rvx=b.vx,rvy=b.vy,wx=0,wy=0;if(mv){const w=hd.wheel,rx=px-w.x,ry=py-w.y;wx=-w.w*ry;wy=w.w*rx;rvx-=wx;rvy-=wy}const vn=rvx*nx+rvy*ny;if(vn<0){rvx-=(1+e)*vn*nx;rvy-=(1+e)*vn*ny;b.vx=rvx+wx;b.vy=rvy+wy;return Math.abs(vn)}return false}
function physics(b,dt,sim){const sand=(hd.sand||[]).some(r=>inR(b,r)),fr=sand?3.4:.9,dec=sand?30:8;let sp=Math.hypot(b.vx,b.vy);
 // gentle pull toward the cup when close and slow
 const cdx=hd.cup[0]-b.x,cdy=hd.cup[1]-b.y,cd=Math.hypot(cdx,cdy);if(cd<CR*1.6&&sp<40&&cd>0){b.vx+=cdx/cd*30*dt;b.vy+=cdy/cd*30*dt}
 const ns=Math.max(0,sp-(sp*fr+dec)*dt);if(sp>0){b.vx*=ns/sp;b.vy*=ns/sp}b.x+=b.vx*dt;b.y+=b.vy*dt;let hit=0;
 for(const sg of segs){const h=collideSeg(b,sg);if(h)hit=Math.max(hit,h)}const ws=wheelSeg(sim?sim.a:wheelA);if(ws){const h=collideSeg(b,ws,.9,true);if(h)hit=Math.max(hit,h)}
 for(const[bx,by,br]of hd.bump||[]){const dx=b.x-bx,dy=b.y-by,d=Math.hypot(dx,dy);if(d<br+BR&&d>0){const nx=dx/d,ny=dy/d;b.x=bx+nx*(br+BR);b.y=by+ny*(br+BR);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=2.1*vn*nx;b.vy-=2.1*vn*ny;hit=Math.max(hit,Math.abs(vn)+30)}}}
 return{hit,sand}}
function shoot(a,p){if(state!=='play'||phase!=='aim')return;p=Math.max(.05,Math.min(1,p));ball.vx=Math.cos(a)*p*140;ball.vy=Math.sin(a)*p*140;rest={x:ball.x,y:ball.y};strokes++;totalStrokes++;phase='roll';ui();tone(240+p*200,.08,'triangle',.08,120);buzz(10)}
function holeDone(sunk){phase='done';const d=strokes-hd.par,name=!sunk?'Picked up':strokes===1?'Hole in one!':['Albatross!','Eagle!','Birdie!','Par','Bogey','Double bogey'][Math.max(0,Math.min(5,d+3))]||`+${d}`;
 const pts=sunk?Math.max(50,300-d*100)+(strokes===1?500:0):0;score+=pts;results.push(strokes);ui();pops.push({x:W/2,y:oy+60*k,txt:name,l:1.8,big:1},{x:W/2,y:oy+60*k+30,txt:pts?'+'+pts:'Max strokes',l:1.8});
 if(sunk){[523,659,784,1046].forEach((f,i)=>tone(f,.25,'sine',.06,0,i*.09));buzz([20,40,20]);const[cx,cy]=S(...hd.cup);for(let i=0;i<(G.reduced?8:30);i++){const a=Math.random()*6.28,v=60+Math.random()*160;parts.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,l:1.1,c:i%2?'#fbe9a6':'#ffffff'})}}
 setTimeout(()=>{if(state!=='play'&&state!=='paused')return;const go=()=>{if(hole>=8)return end();loadHole(hole+1)};if(state==='paused'){pendingNext=go}else go()},G.reduced?700:1700)}
let pendingNext=null;
function end(){state='over';$('#pause').hidden=true;const nb=setBest(score),par=HOLES.reduce((s,h)=>s+h.par,0),rel=totalStrokes-par;
 overlay(nb?'New best!':'Course complete',`Score ${score.toLocaleString()} · ${totalStrokes} strokes (${rel===0?'even par':rel>0?'+'+rel:rel}) · Best ${best().toLocaleString()}`,'Play again',start,nb?'trophy':'restart')}
function step(dt){t+=dt;if(hd.wheel)wheelA+=hd.wheel.w*dt;
 if(phase==='roll'){const n=Math.ceil(Math.hypot(ball.vx,ball.vy)*dt/1)+1;let hit=0;for(let i=0;i<n;i++){const r=physics(ball,dt/n);hit=Math.max(hit,r.hit);
   if((hd.water||[]).some(w=>inR(ball,w))){phase='splash';splash=.9;strokes++;totalStrokes++;ui();const[cx,cy]=S(ball.x,ball.y);for(let j=0;j<(G.reduced?5:16);j++){const a=Math.random()*6.28;parts.push({x:cx,y:cy,vx:Math.cos(a)*90,vy:Math.sin(a)*90-40,l:.7,c:'#bfe6ff'})}tone(180,.3,'sine',.07,60);pops.push({x:cx,y:cy-16,txt:'Splash +1',l:1.1});break}
   const cd=Math.hypot(ball.x-hd.cup[0],ball.y-hd.cup[1]),sp=Math.hypot(ball.vx,ball.vy);if(cd<CR-.6&&sp<62){phase='sink';sinkT=0;ball.vx=ball.vy=0;break}
   if(cd<CR*.55&&sp>=62){const a=Math.atan2(ball.vy,ball.vx)+(Math.random()-.5)*.8;ball.vx=Math.cos(a)*sp*.6;ball.vy=Math.sin(a)*sp*.6;tone(900,.04,'sine',.04)}}
  if(hit>12)tone(300+Math.min(hit,120)*3,.04,'square',.025);
  if(phase==='roll'&&Math.hypot(ball.vx,ball.vy)<1.2){ball.vx=ball.vy=0;if(strokes>=MAXS)holeDone(false);else phase='aim'}}
 else if(phase==='splash'){splash-=dt;if(splash<=0){ball.x=rest.x;ball.y=rest.y;ball.vx=ball.vy=0;if(strokes>=MAXS)holeDone(false);else phase='aim'}}
 else if(phase==='sink'){sinkT+=dt*3;ball.x+=(hd.cup[0]-ball.x)*Math.min(1,dt*12);ball.y+=(hd.cup[1]-ball.y)*Math.min(1,dt*12);if(sinkT>=1){holeDone(true)}}
 for(const p of parts){p.vy+=300*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const p of pops){p.l-=dt;p.y-=14*dt}pops=pops.filter(p=>p.l>0)}
function aimInfo(){if(!drag)return null;const dx=drag.sx-drag.x,dy=drag.sy-drag.y,d=Math.hypot(dx,dy);if(d<8)return null;return{a:Math.atan2(dy,dx),p:Math.min(1,d/(Math.min(W,H)*.36))}}
function path(){const ai=aimInfo();if(!ai)return[];const b={x:ball.x,y:ball.y,vx:Math.cos(ai.a)*ai.p*140,vy:Math.sin(ai.a)*ai.p*140},pts=[],dt=1/60,sim={a:wheelA};for(let i=0;i<70;i++){for(let j=0;j<3;j++)physics(b,dt/3,sim);if(i%4===0)pts.push([b.x,b.y]);if(Math.hypot(b.vx,b.vy)<1.2||(hd.water||[]).some(w=>inR(b,w)))break}return pts}
function poly(p){x.beginPath();p.forEach((q,i)=>{const[a,b]=S(...q);i?x.lineTo(a,b):x.moveTo(a,b)});x.closePath()}
function draw(){x.fillStyle='#16402c';x.fillRect(0,0,W,H);for(const tr of trees){x.fillStyle=tr.h>.5?'#0f3322':'#1a4a31';x.beginPath();x.arc(tr.x,tr.y,tr.r,0,7);x.fill()}
 if(!hd)return;
 x.lineJoin='round';poly(hd.poly);x.strokeStyle='#c9a46a';x.lineWidth=Math.max(5,3*k);x.stroke();x.fillStyle='#4fae5c';x.fill();
 x.save();poly(hd.poly);x.clip();x.fillStyle='rgba(255,255,255,.06)';for(let b=0;b<160;b+=12){const[a1,b1]=S(0,b);x.fillRect(0,b1,W,6*k)}
 for(const r of hd.sand||[]){const[a,b]=S(r[0],r[1]);x.fillStyle='#e8d29a';x.beginPath();x.roundRect?x.roundRect(a,b,r[2]*k,r[3]*k,4*k):x.rect(a,b,r[2]*k,r[3]*k);x.fill();x.fillStyle='rgba(160,120,60,.35)';for(let i=0;i<r[2]*r[3]/18;i++){x.fillRect(a+((i*37)%r[2])*k,b+((i*53)%r[3])*k,1.5,1.5)}}
 for(const r of hd.water||[]){const[a,b]=S(r[0],r[1]);x.fillStyle='#3d8fc4';x.fillRect(a,b,r[2]*k,r[3]*k);x.strokeStyle='rgba(220,240,255,.45)';x.lineWidth=1.5;for(let i=1;i<4;i++){x.beginPath();const yy=b+r[3]*k*i/4;for(let xx=0;xx<=r[2]*k;xx+=6)x.lineTo(a+xx,yy+Math.sin(xx*.08+t*(G.reduced?0:2)+i)*2);x.stroke()}}
 x.restore();
 x.strokeStyle='#c9a46a';x.lineWidth=Math.max(4,2.4*k);x.lineCap='round';for(const w of hd.walls||[]){const[a,b]=S(w[0],w[1]),[c,d]=S(w[2],w[3]);x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()}
 for(const[bx,by,br]of hd.bump||[]){const[a,b]=S(bx,by);x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(a+2,b+3,br*k,br*k*.85,0,0,7);x.fill();const g=x.createRadialGradient(a-br*k*.3,b-br*k*.4,1,a,b,br*k);g.addColorStop(0,'#c8cfc6');g.addColorStop(1,'#77827a');x.fillStyle=g;x.beginPath();x.ellipse(a,b,br*k,br*k*.88,.3,0,7);x.fill()}
 const ws=wheelSeg(wheelA);if(ws){const[a,b]=S(ws[0],ws[1]),[c,d]=S(ws[2],ws[3]);x.strokeStyle='#7a4f2a';x.lineWidth=2.6*k;x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke();const[hx,hy]=S(hd.wheel.x,hd.wheel.y);x.fillStyle='#d9b44a';x.beginPath();x.arc(hx,hy,2.2*k,0,7);x.fill()}
 const[cx,cy]=S(...hd.cup);x.fillStyle='#173b24';x.beginPath();x.arc(cx,cy,CR*k,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=1.5;x.stroke();
 const[tx,ty]=S(...hd.tee);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(tx-5*k,ty-1.2*k,10*k,2.4*k);
 if(phase==='aim'&&drag){const pts=path(),ai=aimInfo();if(ai){pts.forEach((q,i)=>{const[a,b]=S(q[0],q[1]);x.globalAlpha=1-i/pts.length*.8;x.fillStyle=ai.p>.85?'#ffb08f':'#fbe9a6';x.beginPath();x.arc(a,b,Math.max(2,k*.8),0,7);x.fill()});x.globalAlpha=1;
  const[bx,by]=S(ball.x,ball.y);x.strokeStyle='rgba(251,233,166,.8)';x.lineWidth=3;x.beginPath();x.arc(bx,by,BR*k+8,-Math.PI/2,-Math.PI/2+ai.p*6.283);x.stroke()}}
 const sc=phase==='sink'?Math.max(.2,1-sinkT):phase==='splash'?Math.max(0,splash):1;if(phase!=='done'){const[bx,by]=S(ball.x,ball.y);x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(bx+1.5,by+2.2,BR*k*sc,BR*k*.8*sc,0,0,7);x.fill();x.fillStyle='#ffffff';x.beginPath();x.arc(bx,by,BR*k*sc,0,7);x.fill();x.fillStyle='rgba(0,0,0,.08)';x.beginPath();x.arc(bx+BR*k*.3*sc,by+BR*k*.3*sc,BR*k*.55*sc,0,7);x.fill()}
 const fl=G.reduced?0:Math.sin(t*3)*2;x.strokeStyle='#f3f0e6';x.lineWidth=2;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx,cy-16*k*.6-14);x.stroke();x.fillStyle='#d9b44a';x.beginPath();x.moveTo(cx,cy-16*k*.6-14);x.lineTo(cx+16+fl,cy-16*k*.6-9);x.lineTo(cx,cy-16*k*.6-4);x.fill();
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*1.4);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,2.4,0,7);x.fill()}x.globalAlpha=1;
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${p.big?28:18}px system-ui,sans-serif`;x.lineWidth=5;x.strokeStyle='rgba(0,0,0,.45)';x.strokeText(p.txt,p.x,p.y);x.fillStyle=p.big?'#fbe9a6':'#fff';x.fillText(p.txt,p.x,p.y)}x.globalAlpha=1;
 x.font='600 13px system-ui,sans-serif';x.fillStyle='rgba(236,242,238,.85)';x.fillText(phase==='aim'?(strokes?`Par ${hd.par} · drag back and release`:`Hole ${hole+1} · Par ${hd.par} · drag back anywhere to aim`):'',W/2,Math.min(H-bot-12,oy+160*k+26))}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;if(state==='play')step(dt);draw();if(state!=='play')cancelAnimationFrame(raf)}
cv.addEventListener('pointerdown',e=>{if(state!=='play'||phase!=='aim')return;cv.setPointerCapture?.(e.pointerId);drag={sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY}});
cv.addEventListener('pointermove',e=>{if(drag){drag.x=e.clientX;drag.y=e.clientY}});
cv.addEventListener('pointerup',()=>{if(!drag)return;const ai=aimInfo();drag=null;if(ai&&phase==='aim')shoot(ai.a,ai.p)});cv.addEventListener('pointercancel',()=>drag=null);
function pause(){if(state!=='play')return;state='paused';drag=null;overlay('Paused',`Hole ${hole+1} of 9 · Score ${score.toLocaleString()}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop);if(pendingNext){const f=pendingNext;pendingNext=null;f()}},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();draw();overlay('Pebble Putt','A calm nine-hole course. Drag back from anywhere to aim, watch the dotted path, release to putt. Under par scores more; ponds cost a stroke.','Tee off',start,'play');
window.__putt={get state(){return state},get score(){return score},get hole(){return hole},get strokes(){return strokes},get phase(){return phase},get ball(){return{...ball}},get cup(){return hd.cup},get k(){return k},toScreen(u,v){const R=cv.getBoundingClientRect(),[a,b]=S(u,v);return[R.left+a,R.top+b]},shoot};
})();
