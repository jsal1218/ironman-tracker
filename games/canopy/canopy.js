// Canopy Run: treetop endless runner. Tap to jump, hold for height, tap again in the air to double-jump. Coyote time and jump buffering keep it fair.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
let auto=false,W,H,top,bot,S=1,state='ready',raf=0,last=0,t=0,score=0,dist=0,acorns=0,speed=0,p,plats,items,owls,parts,pops,layers,holding=false,buf=0,shake=0,flash=0,deadWhy='';
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot;S=Math.max(.75,Math.min(1.35,H/760));
 let s=11;const rnd=()=>(s=(s*9301+49297)%233280)/233280;layers=[0,1,2].map(l=>[...Array(14)].map((_,i)=>({x:i*W/9,h:(.3-l*.07+rnd()*.1)*H,w:(40+rnd()*60)*S})))}
addEventListener('resize',()=>{const oh=H;size();if(plats&&oh){const k=H/oh;for(const q of plats)q.y*=k;for(const it of items)it.y*=k;p.y*=k}if(state!=='play')draw()});
const groundY=()=>H-bot-Math.max(90,H*.2);
function reset(){size();dist=0;acorns=0;score=0;speed=300*S;parts=[];pops=[];owls=[];items=[];holding=false;buf=0;shake=0;flash=0;const gy=groundY();plats=[{x:-40,w:W*1.4,y:gy,thorn:[]}];p={x:W*.26,y:gy,vy:0,ground:true,coy:0,dj:true,hold:0,run:0};while(plats[plats.length-1].x<W*2.5)gen();ui()}
function gen(){const L=plats[plats.length-1],diff=Math.min(1,dist/2600),gap=(60+Math.random()*(60+130*diff))*S*(speed/(300*S))**.5,w=(200+Math.random()*260-diff*90)*S,dy=(Math.random()-.5)*(90+60*diff)*S,y=Math.max(H*.42,Math.min(groundY(),L.y+dy)),q={x:L.x+L.w+gap,w:Math.max(120*S,w),y,thorn:[]};
 if(Math.random()<.35+diff*.4&&q.w>230*S){const a=Math.max(q.w*.45,170*S);q.thorn.push(a);if(q.w-a>200*S&&diff>.3&&Math.random()<.5)q.thorn.push(a+Math.max(120*S,(q.w-a)*.5))}
 plats.push(q);
 // acorn arc over the gap or along the branch
 if(Math.random()<.75){const n=3+Math.floor(Math.random()*3),overGap=Math.random()<.5;for(let i=0;i<n;i++){const u=i/(n-1);if(overGap){const ax=L.x+L.w+gap*u,ay=Math.min(L.y,y)-60*S-Math.sin(u*Math.PI)*70*S;items.push({x:ax,y:ay})}else{const ax=q.x+40*S+u*Math.min(q.w-80*S,160*S);items.push({x:ax,y:y-34*S-(q.thorn.some(th=>Math.abs(q.x+th-ax)<40*S)?70*S:0)})}}}
 if(diff>.25&&Math.random()<.18)owls.push({x:q.x+q.w*.6,y:y-95*S,ph:Math.random()*6})}
function ui(){$('#sc').textContent=score.toLocaleString();$('#ac').textContent=acorns}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function press(){if(state!=='play')return;holding=true;buf=.12;tryJump()}
function release(){holding=false}
function tryJump(){if(buf<=0)return;if(p.ground||p.coy>0){p.vy=-760*S;p.ground=false;p.coy=0;p.hold=.24;buf=0;tone(420,.08,'triangle',.05,640);puff(4)}else if(p.dj){p.vy=-700*S;p.dj=false;p.hold=.16;buf=0;tone(560,.08,'triangle',.05,900);puff(8,'#fbe9a6')}}
function puff(n,c='#e7ddc7'){for(let i=0;i<(G.reduced?2:n);i++)parts.push({x:p.x-6*S,y:p.y,vx:-60-Math.random()*120,vy:-Math.random()*80,l:.4+Math.random()*.3,c,r:2+Math.random()*3})}
function die(why){if(state!=='play')return;state='over';deadWhy=why;flash=G.reduced?0:.5;if(!G.reduced)shake=.4;tone(260,.4,'sawtooth',.06,80);buzz([40,30,90]);$('#pause').hidden=true;const nb=setBest(score);
 setTimeout(()=>overlay(nb?'New best!':why,`Score ${score.toLocaleString()} · ${Math.floor(dist)} m · ${acorns} acorns · Best ${best().toLocaleString()}`,'Run again',start,nb?'trophy':'restart'),G.reduced?200:900)}
function step(dt){t+=dt;speed=Math.min(660*S,300*S+dist*.11*S);const dx=speed*dt;dist+=dx/(40*S);
 for(const q of plats)q.x-=dx;for(const it of items)it.x-=dx;for(const o of owls){o.x-=dx+40*S*dt;o.ph+=dt*3}plats=plats.filter(q=>q.x+q.w>-60);items=items.filter(i=>i.x>-30&&!i.got);owls=owls.filter(o=>o.x>-60);while(plats[plats.length-1].x<W*2.5)gen();
 if(auto){const a=window.__canopy.ai();if(a==='jump'&&!holding)press();else if(a!=='jump'&&holding&&p.vy>-150)release()}buf=Math.max(0,buf-dt);p.coy=Math.max(0,p.coy-dt);if(buf>0)tryJump();
 const g=2300*S*(holding&&p.vy<0&&p.hold>0?.42:1);p.hold-=dt;const oy=p.y;p.vy=Math.min(p.vy+g*dt,1400*S);p.y+=p.vy*dt;const was=p.ground;p.ground=false;
 for(const q of plats){if(p.x+10*S>q.x&&p.x-10*S<q.x+q.w&&p.vy>=0&&oy<=q.y+2&&p.y>=q.y){p.y=q.y;p.vy=0;p.ground=true;p.dj=true;if(!was){puff(5);tone(160,.04,'sine',.04)}}}
 if(was&&!p.ground&&p.vy>=0)p.coy=.1;p.run+=dt*speed/(30*S);
 for(const q of plats)for(const th of q.thorn){const tx=q.x+th;if(Math.abs(p.x-tx)<20*S&&p.y>q.y-24*S&&p.y-34*S<q.y)return die('Caught in the brambles')}
 for(const o of owls){const ox=o.x,oy2=o.y+Math.sin(o.ph)*16*S;if(Math.abs(p.x-ox)<24*S&&Math.abs(p.y-20*S-oy2)<22*S)return die('Bumped a night owl')}
 for(const it of items){if(Math.abs(it.x-p.x)<22*S&&Math.abs(it.y-(p.y-18*S))<28*S){it.got=1;acorns++;pops.push({x:it.x,y:it.y,txt:'+10',l:.6});tone(990+(acorns%5)*90,.06,'sine',.05);for(let i=0;i<(G.reduced?2:6);i++)parts.push({x:it.x,y:it.y,vx:(Math.random()-.5)*160,vy:-Math.random()*160,l:.4,c:'#fbe9a6',r:2})}}
 if(p.y>H+60)return die('Slipped off the canopy');
 const ns=Math.floor(dist)+acorns*10;if(Math.floor(ns/250)>Math.floor(score/250)&&score>0){pops.push({x:W/2,y:H*.3,txt:`${Math.floor(dist)} m`,l:1.2,big:1});tone(784,.12,'triangle',.05,1046)}score=ns;ui()}
function fx(dt){for(const q of parts){q.vy+=300*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}parts=parts.filter(q=>q.l>0);for(const q of pops){q.l-=dt;q.y-=30*dt}pops=pops.filter(q=>q.l>0);shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt)}
function fox(px,py){x.save();x.translate(px,py);const s=S,air=!p.ground,r=p.run;const leg=air?0:Math.sin(r*2.2);
 x.fillStyle='#b34a1c';for(const ph of[0,Math.PI]){const a=air?.6:Math.sin(r*2.2+ph)*.7;x.save();x.translate(-8*s,-10*s);x.rotate(a);x.fillRect(-2*s,0,4*s,12*s);x.restore();x.save();x.translate(9*s,-10*s);x.rotate(-a);x.fillRect(-2*s,0,4*s,12*s);x.restore()}
 x.save();x.translate(-16*s,-20*s);x.rotate(-.5+Math.sin(t*8)*.12*(G.reduced?0:1)+(air?-.3:0));x.fillStyle='#e0672b';x.beginPath();x.ellipse(-12*s,0,16*s,7*s,0,0,7);x.fill();x.fillStyle='#fff6e6';x.beginPath();x.ellipse(-24*s,0,6*s,5*s,0,0,7);x.fill();x.restore();
 x.fillStyle='#e0672b';x.beginPath();x.ellipse(0,-20*s+leg*1.2*s,17*s,10*s,0,0,7);x.fill();x.fillStyle='#fff6e6';x.beginPath();x.ellipse(5*s,-15*s,9*s,5*s,0,0,7);x.fill();
 x.save();x.translate(16*s,-28*s+leg*s);x.fillStyle='#e0672b';x.beginPath();x.moveTo(-8*s,4*s);x.lineTo(12*s,4*s);x.lineTo(0,-8*s);x.closePath();x.fill();x.beginPath();x.moveTo(-7*s,-2*s);x.lineTo(-3*s,-15*s);x.lineTo(2*s,-4*s);x.fill();x.beginPath();x.moveTo(1*s,-4*s);x.lineTo(6*s,-15*s);x.lineTo(9*s,-1*s);x.fill();
 x.fillStyle='#fff6e6';x.beginPath();x.moveTo(0,4*s);x.lineTo(12*s,4*s);x.lineTo(4*s,0);x.fill();x.fillStyle='#1d140e';x.beginPath();x.arc(12*s,3*s,1.8*s,0,7);x.fill();x.beginPath();x.arc(3*s,-2*s,1.6*s,0,7);x.fill();x.restore();x.restore()}
function draw(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1e3b4a');g.addColorStop(.55,'#c7884a');g.addColorStop(1,'#e9c86a');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.save();if(shake>0)x.translate((Math.random()-.5)*10*shake,(Math.random()-.5)*10*shake);
 x.fillStyle='rgba(255,236,180,.85)';x.beginPath();x.arc(W*.72,H*.4,40*S,0,7);x.fill();
 const cols=['rgba(120,110,80,.55)','rgba(70,95,70,.75)','#2a4a35'];layers.forEach((L,li)=>{const sp=(li+1)*.12,off=(dist*40*S*sp)%(W/9*14);x.fillStyle=cols[li];for(const tr of L){let tx=((tr.x-off)%(W/9*14)+W/9*14)%(W/9*14)-60;x.beginPath();x.moveTo(tx-tr.w,H);x.lineTo(tx,H-tr.h-li*20);x.lineTo(tx+tr.w,H);x.fill();x.beginPath();x.arc(tx,H-tr.h-li*20,tr.w*.55,0,7);x.fill()}});
 for(const q of plats){x.fillStyle='#4a2f1c';x.beginPath();x.roundRect?x.roundRect(q.x,q.y,q.w,14*S,7*S):x.rect(q.x,q.y,q.w,14*S);x.fill();x.fillStyle='#6b4428';x.fillRect(q.x+6*S,q.y+2*S,q.w-12*S,3*S);x.fillStyle='#2f6b3c';for(let lx=q.x+10*S;lx<q.x+q.w-10*S;lx+=34*S){x.beginPath();x.ellipse(lx,q.y-1,12*S,5*S,-.3,0,7);x.fill()}
  x.fillStyle='rgba(30,20,12,.55)';x.fillRect(q.x+q.w*.3,q.y+14*S,5*S,H);
  for(const th of q.thorn){const tx=q.x+th;x.fillStyle='#5a2a52';x.beginPath();for(let k=0;k<11;k++){const a=Math.PI+k*Math.PI/10,rr=k%2?12*S:22*S;x.lineTo(tx+Math.cos(a)*rr,q.y+Math.sin(a)*rr*1.05)}x.fill();x.fillStyle='#b05aa6';x.beginPath();x.arc(tx-5*S,q.y-10*S,3*S,0,7);x.arc(tx+6*S,q.y-7*S,2.5*S,0,7);x.fill()}}
 for(const it of items){const b=G.reduced?0:Math.sin(t*5+it.x*.02)*2;x.fillStyle='#9a6a2a';x.beginPath();x.ellipse(it.x,it.y+3*S+b,7*S,8*S,0,0,7);x.fill();x.fillStyle='#5b3a17';x.beginPath();x.ellipse(it.x,it.y-4*S+b,8.5*S,4.5*S,0,0,7);x.fill();x.fillRect(it.x-1*S,it.y-11*S+b,2*S,4*S);x.fillStyle='rgba(255,240,200,.6)';x.beginPath();x.arc(it.x-2.5*S,it.y+2*S+b,2*S,0,7);x.fill()}
 for(const o of owls){const oy2=o.y+Math.sin(o.ph)*16*S,fl=G.reduced?0:Math.sin(t*14)*8*S;x.fillStyle='#5d4c3a';x.beginPath();x.ellipse(o.x-14*S,oy2-fl*.3,14*S,6*S,-.4,0,7);x.ellipse(o.x+14*S,oy2-fl*.3,14*S,6*S,.4,0,7);x.fill();x.fillStyle='#8a7258';x.beginPath();x.ellipse(o.x,oy2,12*S,14*S,0,0,7);x.fill();x.fillStyle='#fbe9a6';x.beginPath();x.arc(o.x-5*S,oy2-4*S,4*S,0,7);x.arc(o.x+5*S,oy2-4*S,4*S,0,7);x.fill();x.fillStyle='#1d140e';x.beginPath();x.arc(o.x-5*S,oy2-4*S,1.8*S,0,7);x.arc(o.x+5*S,oy2-4*S,1.8*S,0,7);x.fill()}
 if(p)fox(p.x,p.y);
 for(const q of parts){x.globalAlpha=Math.min(1,q.l*2);x.fillStyle=q.c;x.beginPath();x.arc(q.x,q.y,q.r,0,7);x.fill()}x.globalAlpha=1;
 x.textAlign='center';for(const q of pops){x.globalAlpha=Math.min(1,q.l*2);x.font=`800 ${q.big?26:16}px system-ui,sans-serif`;x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.4)';x.strokeText(q.txt,q.x,q.y);x.fillStyle=q.big?'#fbe9a6':'#fff';x.fillText(q.txt,q.x,q.y)}x.globalAlpha=1;
 x.font=`700 ${13*S}px system-ui,sans-serif`;x.fillStyle='rgba(20,30,24,.75)';x.fillText(`${Math.floor(dist)} m`,W/2,H-bot-14);
 x.restore();if(flash>0){x.fillStyle=`rgba(255,240,220,${flash})`;x.fillRect(0,0,W,H)}}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;if(state==='play')step(dt);fx(dt);draw();if(state==='paused'||state==='ready'||(state==='over'&&!parts.length&&flash<=0&&shake<=0))cancelAnimationFrame(raf)}
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;e.preventDefault();cv.setPointerCapture?.(e.pointerId);press()});cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',release);
addEventListener('keydown',e=>{if(e.repeat)return;if((e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')&&state==='play'){e.preventDefault();press()}else if((e.code==='KeyP'||e.code==='Escape')&&state==='play')pause()});
addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')release()});
function pause(){if(state!=='play')return;state='paused';holding=false;overlay('Paused',`Score ${score.toLocaleString()} · ${Math.floor(dist)} m`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();draw();overlay('Canopy Run','Tap to jump, hold to leap higher, tap again in mid-air to double-jump. Clear the gaps, hop the brambles, gather acorns.','Run',start,'play');
// test hook: ai() says whether a jump is needed now (gap or bramble just ahead)
window.__canopy={get state(){return state},get why(){return deadWhy},get plats(){return plats.map(q=>[Math.round(q.x),Math.round(q.w),Math.round(q.y),q.thorn.length])},get speed(){return speed},get score(){return score},get dist(){return dist},get acorns(){return acorns},get p(){return{...p}},press,release,ai(){const q=plats.find(q=>p.x>=q.x-4&&p.x<=q.x+q.w+4);if(!p.ground){if(p.vy>0&&p.dj&&plats.some(q=>q.y>p.y&&q.thorn.some(th=>{const d=q.x+th-p.x;return d>-10&&d<70})))return'jump';if(p.vy>0&&p.dj&&!plats.some(q=>p.x+speed*.3>=q.x&&p.x<=q.x+q.w&&q.y>=p.y-5))return'jump';return'air'}if(q&&q.x+q.w-p.x<speed*.05)return'jump';if(q&&q.thorn.some(th=>{const d=q.x+th-p.x;return d>0&&d<speed*.25}))return'jump';return'run'},set auto(v){auto=v}};
})();
