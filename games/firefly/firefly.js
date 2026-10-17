// Firefly Trail: snake through a midnight meadow. Edges wrap; thistles sprout as the trail grows.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
let W,H,top,bot,cell=24,cols=15,rows=24,ox=0,oy=0,state='ready',raf=0,last=0,t=0,score=0,snake,prev,dir,queue,food,moth,thistles,eaten,acc=0,tick=.16,grow=0,parts=[],pops=[],dead=0,flash=0,grass=[];
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot;const aw=W-24,ah=H-top-bot-20;cell=Math.max(18,Math.floor(Math.min(aw/15,ah/15,40)));cols=Math.min(30,Math.floor(aw/cell));rows=Math.min(32,Math.floor(ah/cell));ox=Math.round((W-cols*cell)/2);oy=Math.round(top+(ah-rows*cell)/2+8);
 grass=[...Array(Math.ceil(W/7))].map((_,i)=>({x:i*7+Math.random()*4,h:10+Math.random()*26,b:Math.random()*6}))}
addEventListener('resize',()=>{if(state==='play'||state==='paused'){pause()}size();if(state!=='play'){if(snake)clampAll();draw()}});
function clampAll(){for(const s of snake){s.c=Math.min(cols-1,s.c);s.r=Math.min(rows-1,s.r)}prev=snake.map(s=>({...s}));thistles=thistles.filter(s=>s.c<cols&&s.r<rows);if(food&&(food.c>=cols||food.r>=rows))food=freeCell(2);if(moth&&(moth.c>=cols||moth.r>=rows))moth=null}
const occ=(c,r)=>snake.some(s=>s.c===c&&s.r===r)||thistles.some(s=>s.c===c&&s.r===r);
function freeCell(minD=0){for(let k=0;k<500;k++){const c=Math.floor(Math.random()*cols),r=Math.floor(Math.random()*rows);if(occ(c,r)||(food&&food.c===c&&food.r===r)||(moth&&moth.c===c&&moth.r===r))continue;const h=snake[0];if(Math.abs(h.c-c)+Math.abs(h.r-r)<minD)continue;return{c,r}}return null}
function reset(){size();const r=rows>>1,c=Math.max(4,cols>>2);snake=[0,1,2,3].map(k=>({c:c-k,r}));prev=snake.map(s=>({...s}));dir={x:1,y:0};queue=[];thistles=[];food=null;moth=null;food=freeCell(3);eaten=0;score=0;acc=0;tick=.16;grow=0;parts=[];pops=[];dead=0;flash=0;ui()}
function ui(){$('#sc').textContent=score.toLocaleString();$('#ln').textContent=snake.length}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function turn(dx,dy){if(state!=='play')return;const lastD=queue.length?queue[queue.length-1]:dir;if((dx===-lastD.x&&dy===-lastD.y)||(dx===lastD.x&&dy===lastD.y))return;if(queue.length<3)queue.push({x:dx,y:dy})}
function burst(c,r,col,n=12){const px=ox+(c+.5)*cell,py=oy+(r+.5)*cell;for(let k=0;k<(G.reduced?n/3:n);k++){const a=Math.random()*6.28,v=40+Math.random()*120;parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.6+Math.random()*.4,c:col})}}
function stepSnake(){if(queue.length)dir=queue.shift();prev=snake.map(s=>({...s}));const h=snake[0],n={c:(h.c+dir.x+cols)%cols,r:(h.r+dir.y+rows)%rows};
 const tailFree=grow===0;const hitSelf=snake.some((s,i)=>s.c===n.c&&s.r===n.r&&!(tailFree&&i===snake.length-1)),hitTh=thistles.some(s=>s.c===n.c&&s.r===n.r);
 if(hitSelf||hitTh)return die(n,hitTh?'Prickly thistle!':'Tangled in your trail');
 snake.unshift(n);if(grow>0){grow--}else{snake.pop()}while(prev.length>snake.length)prev.pop();
 if(food&&n.c===food.c&&n.r===food.r){eaten++;const pts=10*(1+Math.floor(snake.length/10));score+=pts;grow+=1;pops.push({c:n.c,r:n.r,txt:'+'+pts,l:.8});burst(n.c,n.r,'#9ff7d0');tone(660+Math.min(snake.length,30)*18,.08,'sine',.07,990);buzz(8);food=freeCell(2);tick=Math.max(.075,.16-snake.length*.0022);
  if(eaten%5===0&&cols*rows>200){const th=freeCell(4);if(th)thistles.push({...th,g:0})}if(eaten%6===0&&!moth){moth=freeCell(5);if(moth)moth.l=7}}
 if(moth&&n.c===moth.c&&n.r===moth.r){score+=50;grow+=2;pops.push({c:n.c,r:n.r,txt:'+50',l:1,big:1});burst(n.c,n.r,'#fbe9a6',20);tone(880,.15,'triangle',.07,1320);tone(1320,.2,'triangle',.05,1760,.08);moth=null}
 ui()}
function die(n,why){state='over';dead=1;flash=G.reduced?0:.6;burst(snake[0].c,snake[0].r,'#fbe9a6',24);tone(220,.35,'sawtooth',.06,70);buzz([40,30,80]);$('#pause').hidden=true;const nb=setBest(score);
 setTimeout(()=>overlay(nb?'New best!':why,`Score ${score.toLocaleString()} · Length ${snake.length} · Best ${best().toLocaleString()}`,'Fly again',start,nb?'trophy':'restart'),G.reduced?200:900)}
function step(dt){t+=dt;acc+=dt;while(acc>=tick&&state==='play'){acc-=tick;stepSnake()}if(moth){moth.l-=dt;if(moth.l<=0)moth=null}for(const th of thistles)th.g=Math.min(1,th.g+dt*2)}
function fx(dt){for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const p of pops){p.l-=dt}pops=pops.filter(p=>p.l>0);flash=Math.max(0,flash-dt)}
function glow(px,py,r,col,a=1){const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a;x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();x.globalAlpha=1}
function draw(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#06110d');g.addColorStop(1,'#0e2a1e');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='rgba(236,242,238,.5)';for(let k=0;k<40;k++){const sx=(k*97.3)%W,sy=(k*53.1)%(H*.5);x.globalAlpha=.2+.3*Math.abs(Math.sin(t*.8+k));x.fillRect(sx,sy,1.5,1.5)}x.globalAlpha=1;
 x.fillStyle='rgba(16,48,34,.55)';x.strokeStyle='rgba(233,200,106,.28)';x.lineWidth=2;x.beginPath();x.roundRect?x.roundRect(ox-3,oy-3,cols*cell+6,rows*cell+6,12):x.rect(ox-3,oy-3,cols*cell+6,rows*cell+6);x.fill();x.stroke();
 x.fillStyle='rgba(159,247,208,.08)';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if((r+c)%2===0)x.fillRect(ox+c*cell,oy+r*cell,cell,cell);
 const cx=c=>ox+(c+.5)*cell,cy=r=>oy+(r+.5)*cell;
 for(const th of thistles){const px=cx(th.c),py=cy(th.r),s=cell*.42*th.g;x.fillStyle='#7b4fb8';x.beginPath();for(let k=0;k<16;k++){const a=k*Math.PI/8,rr=k%2?s*.55:s;x.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr)}x.fill();x.fillStyle='#c79bff';x.beginPath();x.arc(px,py-s*.1,s*.35,0,7);x.fill();x.fillStyle='#3e8a52';x.fillRect(px-s*.12,py+s*.3,s*.24,s*.6)}
 if(food){const px=cx(food.c),py=cy(food.r),p=G.reduced?1:1+.12*Math.sin(t*5);glow(px,py,cell*1.1*p,'rgba(159,247,208,.55)');x.fillStyle='#d9fff0';x.beginPath();x.arc(px,py,cell*.22*p,0,7);x.fill()}
 if(moth){const px=cx(moth.c),py=cy(moth.r),fl=G.reduced?.8:Math.abs(Math.sin(t*10));glow(px,py,cell*1.3,'rgba(251,233,166,.5)',moth.l<2?(Math.sin(t*20)>0?1:.3):1);x.fillStyle='#e9c86a';for(const sx of[-1,1]){x.beginPath();x.ellipse(px+sx*cell*.22,py,cell*.25*(.4+fl*.6),cell*.32,sx*.4,0,7);x.fill()}x.fillStyle='#5a4210';x.fillRect(px-1.5,py-cell*.25,3,cell*.5)}
 // trail with interpolation
 const k=state==='play'?Math.min(1,acc/tick):1,L=snake.length;
 for(let i=L-1;i>=0;i--){const s=snake[i],p=prev[i]||s;let ix=s.c,iy=s.r;if(Math.abs(s.c-p.c)<=1&&Math.abs(s.r-p.r)<=1){ix=p.c+(s.c-p.c)*k;iy=p.r+(s.r-p.r)*k}
  const px=cx(ix),py=cy(iy),f=1-i/Math.max(L,8);if(i>0){glow(px,py,cell*.9,`rgba(200,240,120,${.18*f+.05})`);x.fillStyle=`hsl(${70+50*(1-f)},70%,${35+30*f}%)`;x.beginPath();x.arc(px,py,cell*(.24+.14*f),0,7);x.fill()}
  else{glow(px,py,cell*1.6,dead?'rgba(255,180,120,.5)':'rgba(240,255,150,.55)');const ang=Math.atan2(dir.y,dir.x),fl=G.reduced?.6:Math.abs(Math.sin(t*18));x.save();x.translate(px,py);x.rotate(ang);x.fillStyle='rgba(220,240,255,.7)';for(const sy of[-1,1]){x.beginPath();x.ellipse(-cell*.05,sy*cell*.28,cell*.3,cell*.13*(.5+fl*.5),sy*.5,0,7);x.fill()}
   x.fillStyle='#f6ff9e';x.beginPath();x.ellipse(-cell*.1,0,cell*.32,cell*.22,0,0,7);x.fill();x.fillStyle='#2d3b1e';x.beginPath();x.arc(cell*.22,0,cell*.15,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(cell*.27,-cell*.06,cell*.04,0,7);x.arc(cell*.27,cell*.06,cell*.04,0,7);x.fill();x.restore()}}
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*1.6);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,2.2,0,7);x.fill()}x.globalAlpha=1;
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${p.big?22:17}px system-ui,sans-serif`;x.fillStyle=p.big?'#fbe9a6':'#d9fff0';x.fillText(p.txt,cx(p.c),cy(p.r)-cell*.6-(1-p.l)*20)}x.globalAlpha=1;
 x.fillStyle='#0a1f15';for(const b of grass){x.beginPath();x.moveTo(b.x-3,H);x.quadraticCurveTo(b.x+b.b,H-b.h*.6,b.x+b.b*1.4,H-b.h);x.lineTo(b.x+3,H);x.fill()}
 if(flash>0){x.fillStyle=`rgba(255,240,200,${flash*.5})`;x.fillRect(0,0,W,H)}}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000||0);last=now;if(state==='play')step(dt);fx(dt);draw();if(state==='paused'||state==='ready'||(state==='over'&&!parts.length&&flash<=0))cancelAnimationFrame(raf)}
// input: swipes (several turns per gesture), arrows/WASD
let sw=null;const pos=e=>[e.clientX,e.clientY];
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;cv.setPointerCapture?.(e.pointerId);const[a,b]=pos(e);sw={x:a,y:b}});
cv.addEventListener('pointermove',e=>{if(!sw)return;const[a,b]=pos(e),dx=a-sw.x,dy=b-sw.y;if(Math.hypot(dx,dy)<18)return;if(Math.abs(dx)>Math.abs(dy))turn(Math.sign(dx),0);else turn(0,Math.sign(dy));sw={x:a,y:b}});
const up=()=>sw=null;cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
addEventListener('keydown',e=>{const m={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[e.code];if(m&&state==='play'){e.preventDefault();turn(...m)}else if((e.code==='KeyP'||e.code==='Escape')&&state==='play')pause()});
function pause(){if(state!=='play')return;state='paused';sw=null;overlay('Paused',`Score ${score.toLocaleString()} · Length ${snake.length}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();draw();overlay('Firefly Trail','Swipe to steer. Gather dew lights to grow your glow, grab golden moths for +50. The meadow edges wrap around, but thistles and your own trail do not.','Take flight',start,'play');
window.__firefly={get state(){return state},get score(){return score},get len(){return snake.length},get head(){return snake[0]},get dir(){return dir},get food(){return food},get cols(){return cols},get rows(){return rows},setFood(c,r){food={c,r}},turn};
})();
