(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
let W,H,DPR,S,state='ready',last=0,raf=0,t=0,score=0,lives=3,items,halves,parts,pops,trail,spawnT,level,slow=0,shake=0,flash=0,stars,hills,swipe=null,swipeHits=[],swipeT=0,cloudHit=null;
const COLS=[['#f26b4f','#ffb08f'],['#e9b949','#fff0b0'],['#2fb582','#a8f0cf'],['#b35fb0','#f0b8ef'],['#3fa6d8','#b8e6ff']];
function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0);S=Math.min(1.3,Math.max(.8,Math.min(W,H)/420));
 stars=[...Array(70)].map(()=>({x:Math.random()*W,y:Math.random()*H*.75,r:Math.random()*1.4+.3,p:Math.random()*6}));hills=[0,1].map(l=>[...Array(9)].map((_,i)=>({x:i*W/7-30,h:(l?.12:.2)*H*(0.6+Math.random()*.5)})))}
addEventListener('resize',()=>{size();if(state!=='play')draw()});
function lifeUI(){$('#lives').innerHTML=[0,1,2].map(i=>`<svg viewBox="0 0 16 20" aria-hidden="true"><rect x="5" y="0" width="6" height="3" rx="1" fill="${i<lives?'#e9c86a':'#55665e'}"/><ellipse cx="8" cy="11" rx="7" ry="7.5" fill="${i<lives?'#f26b4f':'#33433b'}"/><rect x="5" y="17" width="6" height="3" rx="1" fill="${i<lives?'#e9c86a':'#55665e'}"/></svg>`).join('');$('#lives').setAttribute('aria-label',`${lives} lives`);$('#sc').textContent=score}
function reset(){size();items=[];halves=[];parts=[];pops=[];trail=[];score=0;lives=3;spawnT=.6;level=0;slow=0;shake=0;flash=0;cloudHit=null;lifeUI()}
function launch(){level+=1;const n=Math.min(6,1+Math.floor(Math.random()*(1.6+level/8))),bombP=Math.min(.2,.05+level*.004);
 for(let i=0;i<n;i++){const kind=Math.random()<bombP&&level>2?'cloud':Math.random()<.05?'gold':'lan',r=(kind==='cloud'?34:kind==='gold'?27:30)*S,x0=W*(.18+Math.random()*.64),apex=H*(.12+Math.random()*.3),g=520*S,vy=-Math.sqrt(2*g*(H+r-apex)),vx=(W/2-x0)*(.2+Math.random()*.5)/1.6+(Math.random()-.5)*80*S;
  items.push({kind,x:x0,y:H+r+i*18,vx,vy,g,r,rot:(Math.random()-.5)*.5,vr:(Math.random()-.5)*1.4,c:COLS[Math.floor(Math.random()*COLS.length)],delay:i*.18,ph:Math.random()*6})}
 if(n>1)tone(260,.18,'sine',.035,360);spawnT=Math.max(.75,2.1-level*.035)+Math.random()*.4}
function start(){hide();reset();state='play';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);$('#pause').hidden=false}
function segCircle(ax,ay,bx,by,cx,cy,r){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;let u=((cx-ax)*dx+(cy-ay)*dy)/l2;u=Math.max(0,Math.min(1,u));const px=ax+dx*u-cx,py=ay+dy*u-cy;return px*px+py*py<=r*r}
function slice(it,ax,ay,bx,by){const ang=Math.atan2(by-ay,bx-ax);items.splice(items.indexOf(it),1);
 if(it.kind==='cloud'){cloudHit=it;flash=1;if(!G.reduced)shake=.6;tone(90,.5,'sawtooth',.12,40);tone(1800,.08,'square',.05,200);buzz([60,40,140]);for(let i=0;i<30;i++)parts.push(P(it.x,it.y,'#c9d6ff',420));lives=0;lifeUI();return end('Storm cloud!')}
 const nx=-Math.sin(ang),ny=Math.cos(ang),sp=90*S;for(const s of[-1,1])halves.push({...it,side:s,ang,vx:it.vx*.4+nx*sp*s,vy:Math.min(it.vy,0)*.3+ny*sp*s-80*S,vr:s*3,l:1.6});
 for(let i=0;i<(G.reduced?8:18);i++)parts.push(P(it.x,it.y,i%2?it.c[0]:'#fbe9a6',320,i%3===0));
 const pts=it.kind==='gold'?50:10;score+=pts;swipeHits.push(it);pops.push({x:it.x,y:it.y-it.r,txt:'+'+pts,l:.8,big:it.kind==='gold'});
 if(it.kind==='gold'){slow=G.reduced?0:2.6;tone(880,.25,'sine',.08,1320);tone(1320,.3,'sine',.05,1760,.1)}
 const k=swipeHits.length;tone(440*Math.pow(1.122,Math.min(k,12)),.09,'triangle',.07,660*Math.pow(1.122,Math.min(k,12)));buzz(8);lifeUI()}
const P=(x0,y0,c,v,paper)=>{const a=Math.random()*6.283,s=Math.random()*v*S;return{x:x0,y:y0,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60*S,l:.7+Math.random()*.6,c,paper,rot:Math.random()*6,vr:(Math.random()-.5)*12,w:(paper?6:3)*S}};
function endSwipe(){if(swipeHits.length>=3){const b=swipeHits.length*10;score+=b;const cx=swipeHits.reduce((a,i)=>a+i.x,0)/swipeHits.length,cy=swipeHits.reduce((a,i)=>a+i.y,0)/swipeHits.length;
  pops.push({x:cx,y:cy-40*S,txt:`Combo x${swipeHits.length}  +${b}`,l:1.2,big:true});tone(660,.12,'triangle',.08,990);tone(990,.18,'triangle',.06,1480,.1);if(!G.reduced&&swipeHits.length>=4)slow=Math.max(slow,.6);lifeUI()}swipeHits=[]}
// input
function pos(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;e.preventDefault();cv.setPointerCapture?.(e.pointerId);const[a,b]=pos(e);swipe={x:a,y:b,id:e.pointerId};trail=[{x:a,y:b,l:.18}];swipeHits=[]});
cv.addEventListener('pointermove',e=>{if(!swipe||e.pointerId!==swipe.id||state!=='play')return;const[a,b]=pos(e),d=Math.hypot(a-swipe.x,b-swipe.y);if(d<2)return;
 trail.push({x:a,y:b,l:.18});if(trail.length>24)trail.shift();if(d>6*S){for(const it of[...items])if(it.delay<=0&&segCircle(swipe.x,swipe.y,a,b,it.x,it.y,it.r*.95)){slice(it,swipe.x,swipe.y,a,b);if(state!=='play')break}
  if(d>40&&!G.muted&&Math.random()<.3)tone(200+Math.random()*80,.06,'sine',.015,120)}if(swipe){swipe.x=a;swipe.y=b}});
const upH=e=>{if(swipe&&e.pointerId===swipe.id){swipe=null;endSwipe()}};cv.addEventListener('pointerup',upH);cv.addEventListener('pointercancel',upH);
function end(why){if(state!=='play')return;state='over';swipe=null;const nb=setBest(score);$('#pause').hidden=true;
 setTimeout(()=>overlay(nb?'New best!':why,`Score ${score} · Best ${best()}`,'Play again',start,nb?'trophy':'restart'),G.reduced?200:900)}
function miss(it){if(it.kind!=='lan')return;lives--;lifeUI();tone(220,.2,'triangle',.06,140);buzz(30);pops.push({x:it.x,y:H-40*S,txt:'Missed',l:.9,miss:true});if(lives<=0)end('Out of lanterns')}
function step(dt){const ts=slow>0?.45:1;slow=Math.max(0,slow-dt);const d=dt*ts;t+=dt;
 spawnT-=d;if(spawnT<=0)launch();
 for(const it of items){if(it.delay>0){it.delay-=d;continue}it.vy+=it.g*d;it.x+=it.vx*d;it.y+=it.vy*d;it.rot+=it.vr*d*.3;it.ph+=d;if(it.x<it.r||it.x>W-it.r)it.vx*=-.8}
 for(const it of[...items])if(it.delay<=0&&it.vy>0&&it.y>H+it.r+10){items.splice(items.indexOf(it),1);miss(it);if(state!=='play')return}
 for(const h of halves){h.vy+=520*S*d;h.x+=h.vx*d;h.y+=h.vy*d;h.rot+=h.vr*d;h.l-=d}halves=halves.filter(h=>h.l>0&&h.y<H+80);
 for(const p of parts){p.vy+=(p.paper?140:380)*S*d;p.vx*=p.paper?.985:1;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d;p.l-=d}parts=parts.filter(p=>p.l>0);
 for(const p of pops){p.l-=dt;p.y-=40*dt}pops=pops.filter(p=>p.l>0);for(const q of trail)q.l-=dt;trail=trail.filter(q=>q.l>0)}
function lantern(it,clipSide){const r=it.r;x.save();x.translate(it.x,it.y);x.rotate(it.rot);
 if(clipSide){x.rotate(it.ang-it.rot);x.beginPath();x.rect(-r*2,clipSide<0?-r*2:0,r*4,r*2);x.clip();x.rotate(-(it.ang-it.rot))}
 if(it.kind==='cloud'){x.fillStyle='#3a4660';[[-.45,.05,.55],[.1,-.25,.6],[.5,.1,.5],[0,.2,.6]].forEach(([a,b,c])=>{x.beginPath();x.arc(a*r,b*r,c*r,0,7);x.fill()});x.fillStyle='#55627e';x.beginPath();x.arc(.05*r,-.35*r,.42*r,0,7);x.fill();
  x.fillStyle='#ffe066';x.beginPath();x.moveTo(.05*r,.15*r);x.lineTo(-.22*r,.75*r);x.lineTo(.02*r,.62*r);x.lineTo(-.12*r,1.1*r);x.lineTo(.3*r,.45*r);x.lineTo(.06*r,.55*r);x.closePath();x.fill();x.restore();return}
 const gold=it.kind==='gold',[c1,c2]=gold?['#d9a43a','#fff3c4']:it.c;
 const gl=x.createRadialGradient(0,0,r*.3,0,0,r*2.1);gl.addColorStop(0,gold?'rgba(255,230,140,.45)':'rgba(255,200,120,.22)');gl.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=gl;x.beginPath();x.arc(0,0,r*2.1,0,7);x.fill();
 const g=x.createRadialGradient(-r*.25,-r*.2,r*.1,0,0,r*1.05);g.addColorStop(0,c2);g.addColorStop(1,c1);x.fillStyle=g;x.beginPath();x.ellipse(0,0,r*.92,r,0,0,7);x.fill();
 x.strokeStyle='rgba(80,30,10,.28)';x.lineWidth=1.4*S;for(const k of[-.55,0,.55]){x.beginPath();x.ellipse(0,0,Math.abs(k)*r*.92+.01,r*.98,0,0,7);x.stroke()}
 x.fillStyle=gold?'#fff6d0':'#e9c86a';x.strokeStyle='#7a5a00';x.lineWidth=1;const cw=r*.9,ch=r*.22;x.beginPath();x.roundRect(-cw/2,-r-ch*.6,cw,ch,3*S);x.fill();x.stroke();x.beginPath();x.roundRect(-cw/2,r-ch*.4,cw,ch,3*S);x.fill();x.stroke();
 x.strokeStyle='#e9c86a';x.lineWidth=1.5*S;x.beginPath();x.moveTo(0,r+ch*.6);x.lineTo(Math.sin(it.ph*3)*3*S,r+ch*.6+12*S);x.stroke();
 if(gold){x.fillStyle='rgba(122,90,0,.6)';x.beginPath();x.arc(0,0,r*.38,0,7);x.fill();x.fillStyle='#fff6d0';x.beginPath();x.arc(r*.12,-r*.06,r*.32,0,7);x.fill()}
 x.restore()}
function draw(){const sk=x.createLinearGradient(0,0,0,H);sk.addColorStop(0,'#071712');sk.addColorStop(.55,'#0d2a22');sk.addColorStop(1,'#1d4a3a');x.fillStyle=sk;x.fillRect(0,0,W,H);
 x.save();if(shake>0){x.translate((Math.random()-.5)*20*shake,(Math.random()-.5)*20*shake)}
 for(const s of stars){x.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.3+s.p));x.fillStyle='#fbe9a6';x.fillRect(s.x,s.y,s.r,s.r)}x.globalAlpha=1;
 const mg=x.createRadialGradient(W*.8,H*.16,0,W*.8,H*.16,70*S);mg.addColorStop(0,'rgba(251,233,166,.35)');mg.addColorStop(1,'rgba(251,233,166,0)');x.fillStyle=mg;x.fillRect(0,0,W,H*.5);x.fillStyle='#f3dc8e';x.beginPath();x.arc(W*.8,H*.16,26*S,0,7);x.fill();x.fillStyle='#0d2a22';x.beginPath();x.arc(W*.8+10*S,H*.16-6*S,22*S,0,7);x.fill();
 hills.forEach((L,l)=>{x.fillStyle=l?'#0a2019':'#0f3027';x.beginPath();x.moveTo(0,H);L.forEach((p,i)=>{const nx=L[i+1]||p;x.quadraticCurveTo(p.x,H-p.h,(p.x+nx.x)/2,H-(p.h+nx.h)/2)});x.lineTo(W,H);x.fill()});
 for(const it of items)if(it.delay<=0)lantern(it);for(const h of halves){x.globalAlpha=Math.min(1,h.l);lantern(h,h.side);x.globalAlpha=1}
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*1.5);x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);x.restore()}x.globalAlpha=1;
 if(trail.length>1){x.lineCap='round';x.lineJoin='round';for(let pass=0;pass<2;pass++){for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],k=i/trail.length;x.strokeStyle=pass?`rgba(255,250,230,${k})`:`rgba(233,200,106,${k*.5})`;x.lineWidth=(pass?4:12)*k*S+1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}}
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${(p.big?24:18)*S}px system-ui,sans-serif`;x.fillStyle=p.miss?'#ff9a80':p.big?'#fbe9a6':'#ffffff';x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=4;x.strokeText(p.txt,p.x,p.y);x.fillText(p.txt,p.x,p.y)}x.globalAlpha=1;
 x.restore();if(slow>0){x.fillStyle=`rgba(251,233,166,${Math.min(.12,slow*.06)})`;x.fillRect(0,0,W,H)}if(flash>0){x.fillStyle=`rgba(230,235,255,${flash*.8})`;x.fillRect(0,0,W,H)}}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;if(state==='play')step(dt);else if(state==='over'){t+=dt;for(const h of halves){h.vy+=520*S*dt;h.y+=h.vy*dt}for(const p of parts){p.vy+=200*dt;p.y+=p.vy*dt;p.x+=p.vx*dt;p.l-=dt}parts=parts.filter(p=>p.l>0)}
 shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt*1.5);draw();if(state==='paused'||state==='ready')cancelAnimationFrame(raf)}
function pause(){if(state!=='play')return;state='paused';swipe=null;overlay('Paused',`Score ${score}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();(function demo(){for(let i=0;i<3;i++)items.push({kind:'lan',x:W*(.28+i*.22),y:H*(.42+(i%2)*.08),r:30*S,rot:(i-1)*.15,c:COLS[i],ph:i,delay:0});draw();items=[]})();
overlay('Lantern Swipe','Swipe through lanterns before they fall. Slice 3+ in one stroke for a combo. Never cut a storm cloud.','Play',start,'play');
window.__lantern={get state(){return state},get score(){return score},get lives(){return lives},get items(){return items},get rect(){return cv.getBoundingClientRect()},spawn(k='lan',px=.5,py=.5){items.push({kind:k,x:W*px,y:H*py,vx:0,vy:-1,g:0,r:30*S,rot:0,vr:0,c:COLS[0],delay:0,ph:0})},freeze(v){spawnT=v?1e9:.5}};
})();
