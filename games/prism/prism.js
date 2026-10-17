// Prism Paddle: brick breaker with crystal prisms, power-ups, chain combos and an aim preview.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
const HUES=[155,48,190,330,95,20,265,175,60];
let W,H,top,bot,S=1,fx0,fw,state='ready',raf=0,last=0,t=0,score=0,lives=3,level=1,bricks=[],balls=[],caps=[],parts=[],pops=[],pad,stuck=true,aim=0,chain=0,wideT=0,slowT=0,shake=0,flash=0,bw,bh,bTop,launchedAt=0;
function size(){const f=G.fit(cv,x);const ow=W;W=f.W;H=f.H;top=f.top;bot=f.bot;S=Math.max(.8,Math.min(1.4,Math.min(W,H*.62)/390));fw=Math.min(W-16,620);fx0=(W-fw)/2;bw=(fw-9*4*S)/8;bh=Math.max(16,bw*.42);bTop=top+22*S;
 if(pad){pad.y=H-bot-64*S;pad.x=Math.min(fx0+fw-pad.w/2,Math.max(fx0+pad.w/2,pad.x*(ow?W/ow:1)))}layoutBricks()}
function layoutBricks(){for(const b of bricks){b.x=fx0+4*S+b.c*(bw+4*S);b.y=bTop+b.r*(bh+4*S);b.w=bw;b.h=bh}}
addEventListener('resize',()=>{size();if(state!=='play')draw()});
function makeLevel(n){bricks=[];const rows=Math.min(4+n,9),pat=(n-1)%6;for(let r=0;r<rows;r++)for(let c=0;c<8;c++){let on=true;
  if(pat===1)on=(r+c)%2===0||r<2;else if(pat===2)on=Math.abs(c-3.5)<=r*.6+.5;else if(pat===3)on=Math.abs(c-3.5)+Math.abs(r-rows/2+.5)<=4.2;else if(pat===4)on=c%3!==2;else if(pat===5)on=r%2===0||c===0||c===7;
  if(!on)continue;let hp=1,k='n';if(n>=2&&r<Math.min(3,n-1)&&(c+r)%2===0){hp=2;k='g'}if(n>=4&&r===rows-1&&(c===1||c===6)){hp=99;k='s'}bricks.push({r,c,hp,k,hue:HUES[r%9],hit:0})}layoutBricks()}
function speed(){return(390+level*22)*S*(slowT>0?.62:1)*Math.min(1.25,1+(t-launchedAt)/120)}
function newBall(){stuck=true;balls=[{x:pad.x,y:pad.y-9*S-6*S,vx:0,vy:0,r:7*S,tr:[]}];chain=0}
function reset(){level=1;score=0;lives=3;caps=[];parts=[];pops=[];wideT=0;slowT=0;pad={x:0,y:0,w:92,h:14};size();pad={x:W/2,y:H-bot-64*S,w:92*S,h:14*S};makeLevel(1);newBall();ui()}
function ui(){$('#sc').textContent=score.toLocaleString();$('#lv').textContent=level;$('#lf').textContent=lives}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function launch(){if(!stuck||state!=='play')return;stuck=false;launchedAt=t;const a=-Math.PI/2+aim,v=speed();balls[0].vx=Math.cos(a)*v;balls[0].vy=Math.sin(a)*v;tone(520,.07,'sine',.05,780)}
function shard(px,py,hue,n=10){for(let k=0;k<(G.reduced?3:n);k++){const a=Math.random()*6.28,v=60+Math.random()*200;parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,l:.7,h:hue,s:3+Math.random()*4,rot:Math.random()*6})}}
function hitBrick(b){if(b.k==='s'){tone(140,.05,'square',.03);b.hit=.15;return}b.hp--;b.hit=.15;chain++;const pts=10*Math.min(10,chain);score+=pts;
 if(chain>=4&&chain%2===0)pops.push({x:b.x+b.w/2,y:b.y,txt:`Chain x${Math.min(10,chain)}`,l:.9,big:1});
 tone(440*Math.pow(1.06,Math.min(chain,24)),.07,'triangle',.06);buzz(6);
 if(b.hp<=0){bricks.splice(bricks.indexOf(b),1);shard(b.x+b.w/2,b.y+b.h/2,b.k==='g'?48:b.hue);if(Math.random()<.13){const k=['wide','multi','slow','life','multi','wide'][Math.floor(Math.random()*6)];caps.push({x:b.x+b.w/2,y:b.y+b.h/2,k,vy:120*S})}
  if(!bricks.some(q=>q.k!=='s'))levelUp()}else tone(300,.06,'triangle',.05);ui()}
function levelUp(){const bonus=200*level+lives*50;score+=bonus;pops.push({x:W/2,y:H/2,txt:`Level ${level} clear  +${bonus}`,l:1.6,big:1});tone(523,.15,'triangle',.07);tone(659,.15,'triangle',.07,0,.12);tone(784,.3,'triangle',.07,0,.24);level++;caps=[];makeLevel(level);newBall();ui()}
function power(k){if(k==='wide'){wideT=12;pops.push({x:pad.x,y:pad.y-30,txt:'Wide',l:1})}else if(k==='slow'){slowT=9;for(const b of balls){b.vx*=.7;b.vy*=.7}pops.push({x:pad.x,y:pad.y-30,txt:'Slow time',l:1})}else if(k==='life'){lives=Math.min(5,lives+1);pops.push({x:pad.x,y:pad.y-30,txt:'+1 orb',l:1})}else{const add=[];for(const b of balls.slice(0,4)){for(const da of[-.35,.35]){const a=Math.atan2(b.vy,b.vx)+da,v=Math.hypot(b.vx,b.vy)||speed();add.push({x:b.x,y:b.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:b.r,tr:[]})}}balls.push(...add);pops.push({x:pad.x,y:pad.y-30,txt:'Triple orb',l:1})}tone(660,.12,'sine',.07,1320);buzz(15);ui()}
function step(dt){t+=dt;wideT=Math.max(0,wideT-dt);slowT=Math.max(0,slowT-dt);const pw=92*S*(wideT>0?1.55:1);pad.w+=(pw-pad.w)*Math.min(1,dt*10);pad.x=Math.min(fx0+fw-pad.w/2,Math.max(fx0+pad.w/2,pad.x));
 if(keys.l)pad.x-=520*S*dt;if(keys.r)pad.x+=520*S*dt;
 if(stuck){aim=G.reduced?-.35:Math.sin(t*1.8)*.9;const b=balls[0];b.x=pad.x;b.y=pad.y-pad.h/2-b.r-1}
 else{const target=speed();for(const b of balls){const v=Math.hypot(b.vx,b.vy)||1;b.vx*=1+(target/v-1)*Math.min(1,dt*2);b.vy*=1+(target/v-1)*Math.min(1,dt*2);
  const n=Math.ceil(Math.hypot(b.vx,b.vy)*dt/(3*S));for(let k=0;k<n;k++)moveBall(b,dt/n);b.tr.push({x:b.x,y:b.y});if(b.tr.length>8)b.tr.shift()}
  balls=balls.filter(b=>!b.out);if(!balls.length){lives--;ui();tone(200,.4,'sine',.07,90);buzz([30,30,60]);if(!G.reduced)shake=.3;if(lives<=0)return end();newBall()}}
 for(const c of caps){c.y+=c.vy*dt;if(c.y>pad.y-pad.h&&c.y<pad.y+pad.h&&Math.abs(c.x-pad.x)<pad.w/2+10*S){c.got=1;power(c.k)}}caps=caps.filter(c=>!c.got&&c.y<H+20);
 for(const b of bricks)b.hit=Math.max(0,b.hit-dt)}
function moveBall(b,dt){b.x+=b.vx*dt;b.y+=b.vy*dt;const L=fx0+b.r,Rt=fx0+fw-b.r;if(b.x<L){b.x=L;b.vx=Math.abs(b.vx);tone(800,.02,'sine',.02)}if(b.x>Rt){b.x=Rt;b.vx=-Math.abs(b.vx);tone(800,.02,'sine',.02)}if(b.y<top+b.r){b.y=top+b.r;b.vy=Math.abs(b.vy)}
 if(b.y>H+b.r*2){b.out=1;return}
 if(b.vy>0&&b.y+b.r>=pad.y-pad.h/2&&b.y<pad.y+pad.h/2&&Math.abs(b.x-pad.x)<=pad.w/2+b.r){let off=Math.max(-1,Math.min(1,(b.x-pad.x)/(pad.w/2)));if(Math.abs(off)<.12)off=(b.vx>0||(b.vx===0&&Math.random()<.5)?1:-1)*(.12+Math.random()*.1);const a=-Math.PI/2+off*1.05,v=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*v;b.vy=Math.sin(a)*v;b.y=pad.y-pad.h/2-b.r;if(chain>=6)pops.push({x:pad.x,y:pad.y-26,txt:`${chain} chain!`,l:.8});chain=0;tone(330,.05,'sine',.05,440)}
 for(const q of bricks){const cx=Math.max(q.x,Math.min(b.x,q.x+q.w)),cy=Math.max(q.y,Math.min(b.y,q.y+q.h)),dx=b.x-cx,dy=b.y-cy;if(dx*dx+dy*dy<b.r*b.r){
  const ox=Math.min(b.x+b.r-q.x,q.x+q.w-(b.x-b.r)),oy=Math.min(b.y+b.r-q.y,q.y+q.h-(b.y-b.r));if(ox<oy){b.vx=b.x<q.x+q.w/2?-Math.abs(b.vx):Math.abs(b.vx)}else{b.vy=b.y<q.y+q.h/2?-Math.abs(b.vy):Math.abs(b.vy)}
  if(Math.abs(b.vx)<speed()*.1)b.vx=(b.vx<0?-1:1)*speed()*.1;if(Math.abs(b.vy)<speed()*.18)b.vy=(b.vy<0?-1:1)*speed()*.18;hitBrick(q);break}}}
function end(){state='over';$('#pause').hidden=true;const nb=setBest(score);draw();setTimeout(()=>overlay(nb?'New best!':'Out of orbs',`Score ${score.toLocaleString()} · Level ${level} · Best ${best().toLocaleString()}`,'Play again',start,nb?'trophy':'restart'),G.reduced?150:700)}
function fxStep(dt){for(const p of parts){p.vy+=400*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;p.rot+=dt*6}parts=parts.filter(p=>p.l>0);for(const p of pops){p.l-=dt;p.y-=24*dt}pops=pops.filter(p=>p.l>0);shake=Math.max(0,shake-dt)}
function prism(b){const{x:px,y:py,w,h}=b,hue=b.k==='g'?46:b.hue,l=b.hit>0?78:b.k==='g'&&b.hp===1?55:58;
 if(b.k==='s'){x.fillStyle='#4e6158';x.fillRect(px,py,w,h);x.fillStyle='#6b8076';x.fillRect(px,py,w,h*.3);x.strokeStyle='#2b3832';x.strokeRect(px+.5,py+.5,w-1,h-1);return}
 x.fillStyle=`hsl(${hue},${b.k==='g'?80:62}%,${l}%)`;x.fillRect(px,py,w,h);x.fillStyle=`hsla(${hue},90%,88%,.55)`;x.beginPath();x.moveTo(px,py);x.lineTo(px+w,py);x.lineTo(px+w*.7,py+h*.45);x.lineTo(px+w*.15,py+h*.45);x.fill();
 x.fillStyle=`hsla(${hue},70%,22%,.45)`;x.beginPath();x.moveTo(px,py+h);x.lineTo(px+w,py+h);x.lineTo(px+w*.85,py+h*.55);x.lineTo(px+w*.3,py+h*.55);x.fill();
 if(b.k==='g'){x.strokeStyle=b.hp>1?'#fff6cf':'rgba(255,246,207,.4)';x.lineWidth=2;x.strokeRect(px+2,py+2,w-4,h-4)}}
function draw(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#08161d');g.addColorStop(1,'#0d2b25');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.save();if(shake>0)x.translate((Math.random()-.5)*10*shake,(Math.random()-.5)*10*shake);
 x.globalAlpha=.06;x.fillStyle='#bff7ee';for(let k=0;k<5;k++){x.beginPath();x.moveTo(W*(.1+k*.22),0);x.lineTo(W*(.18+k*.22),0);x.lineTo(W*(.05+k*.22),H);x.lineTo(W*(-.05+k*.22),H);x.fill()}x.globalAlpha=1;
 x.strokeStyle='rgba(233,200,106,.35)';x.lineWidth=2;x.beginPath();x.moveTo(fx0,H);x.lineTo(fx0,top);x.lineTo(fx0+fw,top);x.lineTo(fx0+fw,H);x.stroke();
 for(const b of bricks)prism(b);
 for(const c of caps){const col={wide:'#3ccf91',multi:'#fbe9a6',slow:'#7cc8ff',life:'#ff8a7a'}[c.k];x.fillStyle=col;x.beginPath();x.roundRect?x.roundRect(c.x-16*S,c.y-8*S,32*S,16*S,8*S):x.rect(c.x-16*S,c.y-8*S,32*S,16*S);x.fill();x.fillStyle='#0b1a15';x.font=`800 ${10*S}px system-ui,sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText({wide:'WIDE',multi:'x3',slow:'SLOW',life:'+1'}[c.k],c.x,c.y+.5);x.textBaseline='alphabetic'}
 // paddle
 pad.h=14*S;const pg=x.createLinearGradient(0,pad.y-pad.h/2,0,pad.y+pad.h/2);pg.addColorStop(0,'#fbe9a6');pg.addColorStop(.5,'#d9b44a');pg.addColorStop(1,'#9a7419');x.fillStyle=pg;x.beginPath();x.roundRect?x.roundRect(pad.x-pad.w/2,pad.y-pad.h/2,pad.w,pad.h,pad.h/2):x.rect(pad.x-pad.w/2,pad.y-pad.h/2,pad.w,pad.h);x.fill();x.fillStyle='#0b6e4f';x.fillRect(pad.x-pad.w*.3,pad.y-2*S,pad.w*.6,4*S);
 if(stuck&&state==='play'||state==='ready'){const a=-Math.PI/2+aim,b=balls[0];x.strokeStyle='rgba(251,233,166,.7)';x.setLineDash([4,7]);x.lineWidth=2;x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x+Math.cos(a)*110*S,b.y+Math.sin(a)*110*S);x.stroke();x.setLineDash([])}
 for(const b of balls){b.tr.forEach((p,i)=>{x.globalAlpha=i/b.tr.length*.35;x.fillStyle='#bff7ee';x.beginPath();x.arc(p.x,p.y,b.r*(i/b.tr.length),0,7);x.fill()});x.globalAlpha=1;const bg=x.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*2.6);bg.addColorStop(0,'rgba(220,255,240,.55)');bg.addColorStop(1,'rgba(220,255,240,0)');x.fillStyle=bg;x.beginPath();x.arc(b.x,b.y,b.r*2.6,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(b.x,b.y,b.r,0,7);x.fill()}
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*1.5);x.fillStyle=`hsl(${p.h},80%,70%)`;x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.beginPath();x.moveTo(0,-p.s);x.lineTo(p.s,p.s);x.lineTo(-p.s,p.s);x.fill();x.restore()}x.globalAlpha=1;
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${(p.big?20:16)*S}px system-ui,sans-serif`;x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.5)';x.strokeText(p.txt,p.x,p.y);x.fillStyle=p.big?'#fbe9a6':'#fff';x.fillText(p.txt,p.x,p.y)}x.globalAlpha=1;
 if(stuck&&state==='play'){x.font=`600 ${13*S}px system-ui,sans-serif`;x.fillStyle='rgba(236,242,238,.8)';x.fillText('Tap to launch',W/2,pad.y+34*S)}
 const ix=fx0+8;let iy=H-bot-14;x.textAlign='left';x.font=`700 ${11*S}px system-ui,sans-serif`;if(wideT>0){x.fillStyle='#3ccf91';x.fillText(`WIDE ${Math.ceil(wideT)}`,ix,iy);iy-=16}if(slowT>0){x.fillStyle='#7cc8ff';x.fillText(`SLOW ${Math.ceil(slowT)}`,ix,iy)}
 x.restore()}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;if(state==='play')step(dt);fxStep(dt);draw();if(state!=='play')cancelAnimationFrame(raf)}
// input: drag anywhere moves the paddle (relative), tap launches
let drag=null;const keys={l:0,r:0};
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;cv.setPointerCapture?.(e.pointerId);drag={x:e.clientX,px:pad.x,moved:0}});
cv.addEventListener('pointermove',e=>{if(state!=='play')return;if(drag){const d=e.clientX-drag.x;if(Math.abs(d)>6)drag.moved=1;pad.x=drag.px+d*1.25}else if(e.pointerType==='mouse'){pad.x=e.clientX-cv.getBoundingClientRect().left}});
const up=()=>{if(drag&&!drag.moved)launch();else if(drag&&stuck)launch();drag=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',()=>drag=null);
addEventListener('keydown',e=>{if(state!=='play')return;if(e.code==='ArrowLeft'||e.code==='KeyA')keys.l=1;else if(e.code==='ArrowRight'||e.code==='KeyD')keys.r=1;else if(e.code==='Space'){e.preventDefault();launch()}else if(e.code==='KeyP'||e.code==='Escape')pause()});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.l=0;if(e.code==='ArrowRight'||e.code==='KeyD')keys.r=0});
function pause(){if(state!=='play')return;state='paused';drag=null;keys.l=keys.r=0;overlay('Paused',`Score ${score.toLocaleString()} · Level ${level}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();pad.h=14*S;draw();overlay('Prism Paddle','Drag anywhere to slide the paddle, tap to launch. Chain prism hits before the orb returns for bigger points, and catch falling power-ups.','Play',start,'play');
window.__prism={get state(){return state},get score(){return score},get lives(){return lives},get level(){return level},get balls(){return balls},get bricks(){return bricks.length},get pad(){return pad},get stuck(){return stuck},get rect(){return cv.getBoundingClientRect()},clearTo(n){bricks=bricks.filter(b=>b.k!=='s').slice(0,n)}};
})();
