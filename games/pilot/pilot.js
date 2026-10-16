(()=>{'use strict';const {tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
let W,H,DPR,state='ready',t=0,last=0,score=0,plane,towers,parts,shake=0,speed,spawnX,clouds,hills,flash=0,raf=0;
function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',()=>{size();if(state!=='play')draw()});
const S=()=>Math.min(1.25,Math.max(.75,H/760)); // scale factor
function reset(){size();const s=S();plane={x:W*.28,y:H*.45,vy:0,r:11*s,rot:0,trail:[]};towers=[];parts=[];score=0;speed=150*s;spawnX=W+60;shake=0;t=0;
 clouds=[...Array(6)].map((_,i)=>({x:Math.random()*W,y:40+Math.random()*H*.4,s:.4+Math.random()*.6}));
 hills=[0,1].map(l=>[...Array(12)].map((_,i)=>({x:i*W/6,h:(l?60:110)*s+Math.random()*60*s,w:W/5+Math.random()*40})));upd()}
const gapFor=()=>Math.max(150,215-score*2.2)*S(),spacing=()=>Math.max(190,250-score*2)*S();
function spawn(){const g=gapFor(),m=90*S(),cy=m+g/2+Math.random()*(H-2*m-g-60*S());towers.push({x:spawnX,w:64*S(),gy:cy,g,passed:false,star:Math.random()<.35,got:false,win:[...Array(24)].map(()=>Math.random()<.55)});spawnX+=spacing()}
function flap(){if(state==='ready'){hide();state='play';last=performance.now();loop(last)}if(state!=='play')return;plane.vy=-330*S();tone(520,.07,'triangle',.07,760);buzz(6);
 for(let i=0;i<5;i++)parts.push({x:plane.x-10,y:plane.y+6,vx:-60-Math.random()*80,vy:(Math.random()-.5)*60,l:.35,c:'#fffdf9'})}
function upd(){$('#pause').hidden=state!=='play'}
function die(){if(state!=='play')return;state='dead';buzz([40,40,80]);tone(180,.35,'sawtooth',.1,60);if(!G.reduced)shake=14;flash=1;
 for(let i=0;i<26;i++){const a=Math.random()*6.28,v=80+Math.random()*220;parts.push({x:plane.x,y:plane.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.8,c:i%2?'#0b6e4f':'#d9b44a'})}
 const nb=setBest(score);upd();setTimeout(()=>overlay(nb?'New best!':'Crash landing',`Score ${score} · Best ${best()}`,'Fly again',()=>{reset();state='ready';draw();flap()},nb?'trophy':'restart'),G.reduced?200:700)}
function step(dt){t+=dt;const s=S(),p=plane;
 if(state==='play'){speed=Math.min(260*s,(150+score*3.5)*s);p.vy+=900*s*dt;p.vy=Math.min(p.vy,520*s);p.y+=p.vy*dt;p.rot=Math.max(-.5,Math.min(1.1,p.vy/500));
  towers.forEach(o=>o.x-=speed*dt);spawnX-=speed*dt;while(spawnX<W+80)spawn();towers=towers.filter(o=>o.x>-o.w-20);
  p.trail.push({x:p.x,y:p.y});if(p.trail.length>18)p.trail.shift();p.trail.forEach(q=>q.x-=speed*dt);
  for(const o of towers){if(!o.passed&&o.x+o.w<p.x){o.passed=true;score++;tone(880,.06,'sine',.08);tone(1320,.08,'sine',.06,0,.05);for(let i=0;i<8;i++)parts.push({x:p.x,y:p.y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,l:.5,c:'#d9b44a'})}
   if(o.star&&!o.got&&Math.hypot(o.x+o.w/2-p.x,o.gy-p.y)<p.r+14*s){o.got=true;score+=2;buzz(15);tone(990,.1,'triangle',.1,1480);for(let i=0;i<14;i++)parts.push({x:p.x,y:p.y,vx:(Math.random()-.5)*240,vy:(Math.random()-.5)*240,l:.6,c:'#ffd166'})}
   // fair hitbox: circle vs rounded tower rectangles, slightly forgiving radius
   const hr=p.r*.8,cx=Math.max(o.x,Math.min(p.x,o.x+o.w));for(const[y0,y1]of[[-9999,o.gy-o.g/2],[o.gy+o.g/2,9999]]){const cy=Math.max(y0,Math.min(p.y,y1));if((p.x-cx)**2+(p.y-cy)**2<hr*hr)die()}}
  if(p.y>H-36*s-p.r*.6||p.y<-40)die()}
 else if(state==='ready'){p.y=H*.45+Math.sin(t*3)*10}
 clouds.forEach(c=>{c.x-=(state==='play'?speed:60)*.15*c.s*dt;if(c.x<-120)c.x=W+60});
 hills.forEach((l,i)=>l.forEach(h=>{h.x-=(state==='play'?speed:60)*(i?.5:.25)*dt;if(h.x<-h.w)h.x+=W+h.w*2}));
 parts.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=200*dt;q.l-=dt});parts=parts.filter(q=>q.l>0);shake*=.88;flash=Math.max(0,flash-dt*3)}
function rr(X,Y,w,h,r){x.beginPath();x.roundRect?x.roundRect(X,Y,w,h,r):x.rect(X,Y,w,h);x.fill()}
function tower(o,top){const y=top?-10:o.gy+o.g/2,h=top?o.gy-o.g/2+10:H-y;x.fillStyle='#084a35';rr(o.x,y,o.w,h,8);x.fillStyle='#0b6e4f';rr(o.x+4,y,o.w-8,h,6);
 x.fillStyle='rgba(241,213,138,.9)';const cs=o.w/4;let k=0;for(let yy=top?y+h-cs*1.6:y+cs*.8;top?yy>y:yy<y+h-cs;yy+=top?-cs*1.3:cs*1.3)for(let i=0;i<2;i++){if(o.win[k++%24])x.fillRect(o.x+cs*(.8+i*1.6),yy,cs*.6,cs*.6)}
 x.fillStyle='#06301f';rr(o.x-4,top?o.gy-o.g/2-12:o.gy+o.g/2,o.w+8,12,4)}
function draw(){const s=S();x.save();if(shake>.5)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#fbf1d2');g.addColorStop(.55,'#f1d58a');g.addColorStop(1,'#d9a640');x.fillStyle=g;x.fillRect(-20,-20,W+40,H+40);
 x.fillStyle='rgba(255,246,216,.85)';x.beginPath();x.arc(W*.72,H*.58,70*s,0,7);x.fill();
 x.fillStyle='rgba(255,253,249,.8)';clouds.forEach(c=>{x.beginPath();x.ellipse(c.x,c.y,50*c.s,16*c.s,0,0,7);x.ellipse(c.x+24*c.s,c.y-8*c.s,30*c.s,14*c.s,0,0,7);x.fill()});
 ['rgba(11,110,79,.18)','rgba(8,60,42,.32)'].forEach((col,i)=>{x.fillStyle=col;hills[i].forEach(h=>rr(h.x,H-36*s-h.h,h.w,h.h+40,10))});
 towers.forEach(o=>{tower(o,true);tower(o,false);if(o.star&&!o.got){const cx=o.x+o.w/2,cy=o.gy,R=11*s;x.fillStyle='#c99a1e';x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2+t*2,r=i%2?R*.45:R;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.fill()}});
 x.fillStyle='#0a3a2a';x.fillRect(0,H-36*s,W,40*s);x.fillStyle='#d9b44a';for(let i=0;i<W/30+2;i++)x.fillRect(((i*30-(t*(state==='play'?speed:60))%30)+30)%(W+30)-30,H-36*s,14,4);
 const p=plane;x.strokeStyle='rgba(255,253,249,.7)';x.lineWidth=2;x.beginPath();p.trail.forEach((q,i)=>i?x.lineTo(q.x-10,q.y):x.moveTo(q.x-10,q.y));x.stroke();
 if(state!=='dead'||flash>0){x.save();x.translate(p.x,p.y);x.rotate(p.rot);const k=s*1.1;x.fillStyle='#fffdf9';x.strokeStyle='#0b2a1f';x.lineWidth=1.5;x.beginPath();x.moveTo(18*k,0);x.lineTo(-14*k,-10*k);x.lineTo(-8*k,0);x.lineTo(-14*k,9*k);x.closePath();x.fill();x.stroke();
  x.fillStyle='#0b6e4f';x.beginPath();x.moveTo(18*k,0);x.lineTo(-8*k,0);x.lineTo(-14*k,9*k);x.closePath();x.fill();x.restore()}
 parts.forEach(q=>{x.globalAlpha=Math.max(0,q.l*2);x.fillStyle=q.c;x.fillRect(q.x-2,q.y-2,4,4)});x.globalAlpha=1;
 if(flash>0){x.fillStyle=`rgba(255,253,249,${flash*.6})`;x.fillRect(0,0,W,H)}
 x.restore();x.fillStyle='#0b2a1f';x.font=`800 ${44*s}px system-ui,sans-serif`;x.textAlign='center';x.fillText(score,W/2,110*s);x.font=`600 ${13*s}px system-ui`;x.fillStyle='#4d5b53';x.fillText('BEST '+Math.max(best(),score),W/2,132*s)}
function loop(now){cancelAnimationFrame(raf);const dt=Math.min(.033,(now-last)/1000);last=now;step(dt);draw();if(state==='play'||parts.length||shake>.5||state==='ready')raf=requestAnimationFrame(loop)}
function pause(){if(state!=='play')return;state='paused';cancelAnimationFrame(raf);upd();overlay('Paused',`Score ${score}`,'Resume',()=>{state='play';upd();last=performance.now();setTimeout(()=>{last=performance.now();loop(last)},0)})}
$('#stage').addEventListener('pointerdown',e=>{if(e.target.closest('.overlay'))return;e.preventDefault();flap()});
addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if($('#ov').hidden)flap()}else if(e.code==='KeyP'||e.code==='Escape')pause()});
$('#pause').onclick=e=>{e.stopPropagation();pause()};
G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
window.__pilot={get state(){return state},get score(){return score},get plane(){return plane},get towers(){return towers},flap};
reset();last=performance.now();loop(last);overlay('Paper Pilot','Tap to climb. Thread the gaps between towers, grab gold stars for +2.','Tap to fly',()=>flap());
})();
