// Crestline Rally: meta game. Save data, wallet, garage, daily streak, local leaderboard, and MOCK ads / IAP.
// No SDKs, no network, no payments. Rewarded ads are opt-in placeholders; purchases are labeled mockups.
(()=>{'use strict';const C=window.CRESTLINE,R=window.CrestRun,{tone,buzz,$}=G,$$=s=>[...document.querySelectorAll(s)];
const carById=id=>C.cars.find(c=>c.id===id)||C.cars[0],skinById=id=>C.skins.find(s=>s.id===id),paintById=id=>C.paints.find(p=>p.id===id);
// ---------- save ----------
const fresh=()=>({v:C.version,coins:C.economy.startCoins,cars:['pebble'],car:'pebble',paint:{},skins:[],adsRemoved:false,daily:{last:null,streak:0},board:[],runs:0,boost:false,purchases:[]});
let S;try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(C.saveKey)||'null')||{})}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem(C.saveKey,JSON.stringify(S))}catch(e){}};save();
const fmt=n=>Math.round(n).toLocaleString();
function wallet(){$('#mCoins').textContent=fmt(S.coins);$$('.wc').forEach(e=>e.textContent=fmt(S.coins))}
function look(id=S.car){const v=S.paint[id]||'sunset';return skinById(v)||paintById(v)||C.paints[0]}
// ---------- daily streak (local calendar days) ----------
let dayOffset=0;const dkey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function today(){const n=new Date(Date.now());return new Date(n.getFullYear(),n.getMonth(),n.getDate()+dayOffset)}
function daily(){const t=today(),k=dkey(t),y=dkey(new Date(t.getFullYear(),t.getMonth(),t.getDate()-1)),d=S.daily;
 if(d.last===k)return{claimable:false,day:d.streak,key:k};if(d.last===y)return{claimable:true,day:d.streak%7+1,key:k,cont:true};return{claimable:true,day:1,key:k,reset:!!d.last}}
function renderDaily(){const st=daily();$('#cal').innerHTML=C.daily.map((v,i)=>{const n=i+1,done=st.claimable?n<st.day:n<=st.day,cls=done?'done':st.claimable&&n===st.day?'today':'';return`<li class="${cls}"><span>Day ${n}</span>${done?DASH_ICON('check'):'<span class="coin"></span>'}<b>${fmt(v)}</b></li>`}).join('');
 const b=$('#bClaim');b.disabled=!st.claimable;b.textContent=st.claimable?`Claim ${fmt(C.daily[st.day-1])} coins`:'Claimed today, come back tomorrow';
 $('#dSub').textContent=st.claimable?(st.reset?'Your streak reset after a missed day. Day 1 again!':st.cont?`Day ${st.day} of your streak. Keep it going!`:'Come back each day to build your streak. Miss a day and it starts over.'):`Day ${st.day} claimed. Next reward tomorrow.`;$('#dailyDot').hidden=!st.claimable}
$('#bClaim').onclick=()=>{const st=daily();if(!st.claimable)return;const v=C.daily[st.day-1];S.coins+=v;S.daily={last:st.key,streak:st.day};save();wallet();renderDaily();toast(`+${fmt(v)} coins. Day ${st.day} streak!`);tone(660,.1,'triangle',.06,990);tone(990,.14,'triangle',.05,1320,.1);buzz(20)};
// ---------- modals ----------
let openModal=null;function modal(id,on){const m=$(id);m.hidden=!on;openModal=on?id:null;if(on)setTimeout(()=>m.querySelector('button:not([disabled])')?.focus({preventScroll:true}),30)}
$$('[data-close]').forEach(b=>b.onclick=()=>modal('#'+b.closest('.modal').id,false));
addEventListener('keydown',e=>{if(e.code==='Escape'&&openModal&&openModal!=='#m-ad'){modal(openModal,false)}});
let toastT=0;function toast(s){const t=$('#toast');t.textContent=s;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2400)}
// ---------- rewarded ad placeholder (maps to AdMob rewarded in the iOS build) ----------
let adCb=null,adT=0,adRaf=0,adLast=0;
function showAd(kind,onReward){if(S.adsRemoved){toast('Ad-free (mockup): reward granted');onReward();return}
 adCb=onReward;adT=0;$('#adFor').textContent=`Reward: ${C.ads.rewards[kind]||kind}`;$('#bAdClaim').disabled=true;$('#adSec').textContent=C.ads.placeholderSec;$('#adProg').style.strokeDashoffset=276.5;modal('#m-ad',true);adLast=performance.now();cancelAnimationFrame(adRaf);adRaf=requestAnimationFrame(adTick)}
function adTick(now){const dt=Math.min(.1,(now-adLast)/1000);adLast=now;adT+=dt;const L=C.ads.placeholderSec,k=Math.min(1,adT/L);$('#adProg').style.strokeDashoffset=276.5*(1-k);$('#adSec').textContent=Math.max(0,Math.ceil(L-adT));
 if(k>=1){$('#bAdClaim').disabled=false;$('#bAdClaim').focus({preventScroll:true});return}adRaf=requestAnimationFrame(adTick)}
$('#bAdClaim').onclick=()=>{modal('#m-ad',false);const f=adCb;adCb=null;f&&f();tone(880,.12,'sine',.06,1320)};
$('#bAdClose').onclick=()=>{cancelAnimationFrame(adRaf);adCb=null;modal('#m-ad',false);toast('No reward granted')};
// ---------- purchase mockup (maps to StoreKit 2 in the iOS build) ----------
let buyP=null;function buy(id){const p=C.shop.products.find(q=>q.id===id);if(!p)return;buyP=p;$('#t-buy').textContent=p.name;$('#buyP').textContent=p.price;modal('#m-buy',true)}
$('#bBuyOk').onclick=()=>{const p=buyP;if(!p)return;if(p.coins)S.coins+=p.coins;if(p.skin&&!S.skins.includes(p.skin))S.skins.push(p.skin);if(p.removeAds)S.adsRemoved=true;S.purchases.push({id:p.id,at:Date.now(),mock:true});save();modal('#m-buy',false);wallet();renderShop();renderGarage();toast(`${p.name} granted (mockup, no charge)`);tone(784,.15,'triangle',.06,1175)};
// ---------- screens ----------
let screen='menu';function show(n){screen=n;$$('.scr').forEach(s=>s.hidden=s.id!=='s-'+n);$('#hud').hidden=true;if(n==='menu')renderMenu();if(n==='garage')renderGarage();if(n==='shop')renderShop();if(n==='board')renderBoard();wallet();const sc=$('#s-'+n);sc.scrollTop=0;R.scene(carById(S.car),look())}
$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('#bGarage').onclick=()=>show('garage');$('#bShop').onclick=()=>show('shop');$('#bBoard').onclick=()=>show('board');$('#bDaily').onclick=()=>{renderDaily();modal('#m-daily',true)};
function preview(id,carId=S.car,lk=look(carId)){const c=$(id),ctx=c.getContext('2d'),d=carById(carId),dpr=Math.min(2,devicePixelRatio||1);c.width=320*dpr;c.height=120*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,320,120);
 ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.ellipse(160,104,120,10,0,0,7);ctx.fill();ctx.save();ctx.translate(160,66);R.drawCar(ctx,d,lk,[{ox:-d.wheelbase/2,comp:2,spin:.3},{ox:d.wheelbase/2,comp:2,spin:1}],1.35);ctx.restore()}
function renderMenu(){const b=S.board[0];$('#mBest').textContent=b?`Best ${fmt(b.score)} (${fmt(b.dist)} m)`:'';const d=carById(S.car),lk=look();$('#mCar').textContent=`${d.name} · ${lk.name}`;preview('#pv');
 const bb=$('#bBoost');bb.setAttribute('aria-pressed',String(!!S.boost));bb.disabled=!!S.boost;$('#bBoostT').textContent=S.boost?`Fuel boost ready: +${C.economy.fuelBoostPct}% next run`:`Watch ad: +${C.economy.fuelBoostPct}% fuel next run`;renderDaily()}
$('#bBoost').onclick=()=>{if(S.boost)return;showAd('boost',()=>{S.boost=true;save();renderMenu();toast(`+${C.economy.fuelBoostPct}% fuel on your next run`)})};
const bars=b=>Object.entries(b).map(([k,v])=>`<span>${k[0].toUpperCase()+k.slice(1)}</span><span class="bar5">${[1,2,3,4,5].map(i=>`<i class="${i<=v?'on':''}"></i>`).join('')}</span>`).join('');
function renderGarage(){preview('#gpv');
 $('#cars').innerHTML=C.cars.map(c=>{const own=S.cars.includes(c.id),sel=S.car===c.id,afford=S.coins>=c.price;return`<div class="car${sel?' sel':''}"><h4><span>${c.name}</span><span class="wallet sm">${own?(sel?'Driving':'Owned'):`<span class="coin" aria-hidden="true"></span><b>${fmt(c.price)}</b>`}</span></h4><p>${c.desc}</p><div class="bars">${bars(c.bars)}</div>
  ${own?`<button class="cbtn" data-sel="${c.id}" ${sel?'disabled':''}>${sel?'Selected':'Select'}</button>`:`<button class="cbtn buy" data-buy="${c.id}" ${afford?'':'disabled'}>${afford?`Buy for ${fmt(c.price)} coins`:`Need ${fmt(c.price-S.coins)} more coins`}</button>`}</div>`}).join('');
 const cur=S.paint[S.car]||'sunset';
 $('#paints').innerHTML=C.paints.map(p=>`<button class="sw" data-paint="${p.id}" aria-pressed="${cur===p.id}"><span class="chip" style="background:linear-gradient(135deg,${p.a},${p.b})"></span>${p.name}</button>`).join('');
 $('#skins').innerHTML=C.skins.map(s=>{const own=S.skins.includes(s.id),prod=s.product&&C.shop.products.find(p=>p.id===s.product);const bg=s.pattern==='checker'?`repeating-conic-gradient(${s.a} 0 25%,${s.b} 0 50%) 0 0/14px 14px`:s.pattern==='stripe'?`linear-gradient(180deg,${s.a} 40%,${s.b} 40% 60%,${s.a} 60%)`:`linear-gradient(135deg,${s.a},${s.b})`;
  return`<button class="sw" data-skin="${s.id}" aria-pressed="${cur===s.id}"><span class="chip" style="background:${bg}"></span>${s.name}${own?'':`<span class="lock">${s.kind==='coins'?fmt(s.price)+' coins':prod.price+' (mock)'}</span>`}</button>`}).join('');
 $$('[data-sel]').forEach(b=>b.onclick=()=>{S.car=b.dataset.sel;save();renderGarage();R.scene(carById(S.car),look());tone(520,.06)});
 $$('[data-buy]').forEach(b=>b.onclick=()=>{const c=carById(b.dataset.buy);if(S.coins<c.price||S.cars.includes(c.id))return;S.coins-=c.price;S.cars.push(c.id);S.car=c.id;save();wallet();renderGarage();R.scene(c,look());toast(`${c.name} unlocked!`);tone(660,.12,'triangle',.06,990);tone(990,.16,'triangle',.05,1320,.1);buzz(25)});
 $$('[data-paint]').forEach(b=>b.onclick=()=>{S.paint[S.car]=b.dataset.paint;save();renderGarage();R.scene(carById(S.car),look())});
 $$('[data-skin]').forEach(b=>b.onclick=()=>{const s=skinById(b.dataset.skin);if(!S.skins.includes(s.id)){if(s.kind==='coins'){if(S.coins<s.price){toast(`Need ${fmt(s.price-S.coins)} more coins`);return}S.coins-=s.price;S.skins.push(s.id);toast(`${s.name} unlocked`)}else{buy(s.product);return}}S.paint[S.car]=s.id;save();wallet();renderGarage();R.scene(carById(S.car),look())})}
function renderShop(){$('#prods').innerHTML=C.shop.products.map(p=>{const owned=(p.skin&&S.skins.includes(p.skin))||(p.removeAds&&S.adsRemoved),sk=p.skin&&skinById(p.skin);
  const art=p.coins?`<span class="art" style="background:radial-gradient(circle at 35% 35%,#fff6c8,#f2c94c 45%,#a97a12)"></span>`:sk?`<span class="art" style="background:linear-gradient(135deg,${sk.a},${sk.b})"></span>`:`<span class="art" style="background:#2a1840;color:#ffe08a;font-weight:800;font-size:.8rem">NO ADS</span>`;
  return`<div class="prod">${p.tag?`<span class="ptag">${p.tag}</span>`:''}${art}<b>${p.name}</b><small>${p.coins?fmt(p.coins)+' coins':sk?'Premium skin for every car':'Rewards without the placeholder'}</small><button class="cbtn buy" data-prod="${p.id}" ${owned?'disabled':''}>${owned?'Owned':p.price}</button></div>`}).join('');
 $$('[data-prod]').forEach(b=>b.onclick=()=>buy(b.dataset.prod))}
$('#bFreeCoins').onclick=()=>showAd('coins',()=>{S.coins+=C.economy.adCoins;save();wallet();toast(`+${C.economy.adCoins} coins`)});
function renderBoard(){const b=S.board;$('#board').innerHTML=b.length?b.map((r,i)=>`<li${r.id===lastRunId?' aria-current="true" style="outline:2px solid #ffe08a"':''}><span class="rk">${i+1}</span><span><b>${fmt(r.dist)} m</b><small>${carById(r.car).name} · ${r.flips} flips · ${r.date}</small></span><span class="sc">${fmt(r.score)}</span></li>`).join(''):'<li><span class="empty" style="grid-column:1/-1">No runs yet. Go set a record!</span></li>'}
// ---------- runs ----------
let lastRunId=null,runCtx=null;
function drive(){const boost=S.boost?C.economy.fuelBoostPct:0;S.boost=false;S.runs++;save();lastRunId=Date.now();runCtx={id:lastRunId,banked:0,doubled:false};$$('.scr').forEach(s=>s.hidden=true);$('#hud').hidden=false;
 R.start({car:carById(S.car),paint:look(),bestM:S.board.reduce((m,r)=>Math.max(m,r.dist),0),boostPct:boost,onEnd:finish});tone(330,.1,'triangle',.05,660)}
$('#bDrive').onclick=drive;$('#bAgain').onclick=drive;
function finish(r){const add=r.coins-runCtx.banked;runCtx.banked=r.coins;S.coins+=add;const entry={id:runCtx.id,score:r.score,dist:r.distM,car:r.car,flips:r.flips,date:dkey(today())};S.board=S.board.filter(e=>e.id!==entry.id);S.board.push(entry);S.board.sort((a,b)=>b.score-a.score);S.board=S.board.slice(0,10);
 const nb=G.setBest(r.score);save();runCtx.last=r;
 $('#t-res').textContent=r.why==='crash'?'Wiped out!':'Out of fuel';$('#rWhy').textContent=r.why==='crash'?'Your driver bonked the ground. Land on your wheels!':'The tank ran dry. Grab red fuel cans along the ridge.';
 $('#rScore').textContent=fmt(r.score);$('#rNew').hidden=!nb;$('#rCoins').textContent=fmt(r.coins);
 $('#rStats').innerHTML=[['Distance',fmt(r.distM)+' m'],['Stunt pts',fmt(r.stunt)],['Flips',r.flips],['Best air',r.bestAir+' s'],['Close passes',r.closePasses],['Time',r.time+' s']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
 const rv=$('#bRevive');rv.disabled=r.revived;rv.lastChild.textContent=r.revived?'Revive used':r.why==='crash'?'Watch ad: revive':'Watch ad: refuel and continue';
 const db=$('#bDouble');db.disabled=runCtx.doubled||r.coins<=0;db.lastChild.textContent=runCtx.doubled?'Coins doubled':'Watch ad: double coins';
 $('#hud').hidden=true;$$('.scr').forEach(s=>s.hidden=s.id!=='s-results');screen='results';$('#s-results').scrollTop=0;wallet()}
$('#bRevive').onclick=()=>{const r=runCtx&&runCtx.last;if(!r||r.revived)return;showAd('revive',()=>{$$('.scr').forEach(s=>s.hidden=true);$('#hud').hidden=false;screen='run';R.revive(C.ads.reviveFuelPct)})};
$('#bDouble').onclick=()=>{const r=runCtx&&runCtx.last;if(!r||runCtx.doubled)return;showAd('double',()=>{runCtx.doubled=true;S.coins+=r.coins;save();$('#rCoins').textContent=fmt(r.coins*2);$('#bDouble').disabled=true;$('#bDouble').lastChild.textContent='Coins doubled';wallet();toast(`+${fmt(r.coins)} bonus coins`)})};
// pause / lifecycle
function pause(){if(R.pause())G.overlay('Paused',`${$('#hDist').textContent} · ${$('#hCoins').textContent} coins`,'Resume',()=>R.resume(),'pause')}
$('#pause').onclick=pause;G.onHide(pause);addEventListener('keydown',e=>{if((e.code==='KeyP'||(e.code==='Escape'&&!openModal))&&R.state==='run')pause()});
window.dashBusy=()=>['run','paused','ending'].includes(R.state)||openModal==='#m-ad'||openModal==='#m-buy';
// boot
show('menu');wallet();if(daily().claimable)setTimeout(()=>{if(screen==='menu'&&!openModal){renderDaily();modal('#m-daily',true)}},600);
window.__crest={get save(){return JSON.parse(JSON.stringify(S))},get screen(){return screen},get state(){return R.state},get run(){return R.run},get modal(){return openModal},debug:R.debug,setDayOffset(n){dayOffset=n;renderDaily()},addCoins(n){S.coins+=n;save();wallet()},daily};
})();
