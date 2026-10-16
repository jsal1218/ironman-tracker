// Dash Finance data layer (shared by the app and the hub widget). All money is integer cents.
(()=>{'use strict';
let dbp;const open=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('dash-finance',1);
 r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('kv');d.createObjectStore('receipts')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const op=async(store,mode,fn)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction(store,mode),q=fn(t.objectStore(store));t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error)})};
const get=(s,k)=>op(s,'readonly',o=>o.get(k)),put=(s,k,v)=>op(s,'readwrite',o=>o.put(v,k)),del=(s,k)=>op(s,'readwrite',o=>o.delete(k)),keys=s=>op(s,'readonly',o=>o.getAllKeys());
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const pad=n=>String(n).padStart(2,'0'),today=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const D=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
// IRS Schedule C (Form 1040) lines
const SCHED={'1':'Line 1 · Gross receipts or sales','4':'Line 4 · Cost of goods sold (Part III)','6':'Line 6 · Other income','8':'Line 8 · Advertising','9':'Line 9 · Car and truck expenses','10':'Line 10 · Commissions and fees','11':'Line 11 · Contract labor','13':'Line 13 · Depreciation and section 179','15':'Line 15 · Insurance (other than health)','16b':'Line 16b · Interest (other)','17':'Line 17 · Legal and professional services','18':'Line 18 · Office expense','20b':'Line 20b · Rent (other business property)','21':'Line 21 · Repairs and maintenance','22':'Line 22 · Supplies','23':'Line 23 · Taxes and licenses','24a':'Line 24a · Travel','24b':'Line 24b · Deductible meals','25':'Line 25 · Utilities','26':'Line 26 · Wages','27a':'Line 27a · Other expenses','':'Not on Schedule C'};
const CATS=[['Sales','income','1'],['Services','income','1'],['Other income','income','6'],
 ['Cost of goods sold','expense','4'],['Software & subscriptions','expense','27a'],['Marketing & advertising','expense','8'],['Office expenses','expense','18'],['Supplies','expense','22'],['Travel','expense','24a'],['Meals','expense','24b'],['Contractors','expense','11'],['Rent','expense','20b'],['Utilities','expense','25'],['Phone & internet','expense','25'],['Bank & payment fees','expense','10'],['Taxes & licenses','expense','23'],['Insurance','expense','15'],['Professional services','expense','17'],['Vehicle','expense','9'],['Repairs & maintenance','expense','21'],['Equipment','expense','13'],['Payroll','expense','26'],['Interest','expense','16b'],['Owner draw','expense',''],['Other expenses','expense','27a']];
const COLORS=['#0b6e4f','#d4a72c','#2f8fbd','#c2603d','#7a5ec2','#3aa57a','#b38719','#5b7f95','#c94f7c','#6f8f2f','#8a6d3b','#1f9e9e'];
function seed(){const chk=uid(),now=Date.now();
 return{v:1,created:now,accounts:[{id:chk,name:'Business Checking',type:'checking'},{id:uid(),name:'Cash',type:'cash'},{id:uid(),name:'Credit Card',type:'credit'}],
  cats:CATS.map(([name,kind,sched],i)=>({id:uid(),name,kind,sched,color:COLORS[i%COLORS.length]})),
  tx:[{id:uid(),type:'opening',amt:100000,date:today(),acct:chk,cat:null,payee:'Opening balance',method:'',notes:'',tags:[],receipt:null,created:now,updated:now}],
  recurring:[],budgets:{},invoices:[],settings:{taxPct:25,lock:null,invSeq:1}}}
function advance(date,freq,day){const d=D(date);if(freq==='weekly'){d.setDate(d.getDate()+7);return today(d)}
 const mo=d.getMonth()+(freq==='monthly'?1:12),y=d.getFullYear(),last=new Date(y,mo+1,0).getDate();return today(new Date(y,mo,Math.min(day||d.getDate(),last)))}
function postDue(s){let n=0;const t=today(),now=Date.now();for(const r of s.recurring||[]){if(!r.active)continue;let g=0;
 while(r.next<=t&&(!r.end||r.next<=r.end)&&g++<500){s.tx.push({...r.tpl,tags:[...(r.tpl.tags||[])],id:uid(),date:r.next,rec:r.id,receipt:null,sample:!!r.sample,created:now,updated:now});n++;r.next=advance(r.next,r.freq,r.day)}}return n}
async function load(){let s=await get('kv','state');if(!s){s=seed();await put('kv','state',s)}if(postDue(s)){await put('kv','state',s);s._posted=true}return s}
const save=s=>{const{_posted,...c}=s;return put('kv','state',c)};
const delta=t=>t.type==='transfer'?{[t.acct]:-t.amt,[t.to]:t.amt}:t.type==='expense'?{[t.acct]:-t.amt}:{[t.acct]:t.amt};
function balances(s,upTo=today()){const b={};s.accounts.forEach(a=>b[a.id]=0);for(const t of s.tx){if(t.date>upTo)continue;const d=delta(t);for(const k in d)b[k]=(b[k]||0)+d[k]}return b}
const total=(s,upTo)=>Object.values(balances(s,upTo)).reduce((a,b)=>a+b,0);
function flows(s,from,to){let inc=0,exp=0;for(const t of s.tx){if(t.date<from||t.date>to)continue;if(t.type==='income')inc+=t.amt;else if(t.type==='expense')exp+=t.amt}return{inc,exp,net:inc-exp}}
const money=(c,plus)=>{c=Math.round(c)||0;const a=Math.abs(c);return(c<0?'-':plus&&c>0?'+':'')+'$'+Math.floor(a/100).toLocaleString('en-US')+'.'+pad(a%100)};
function cents(str){str=String(str??'').replace(/[$,\s]/g,'');let neg=false;if(/^\(.*\)$/.test(str)){neg=true;str=str.slice(1,-1)}if(str[0]==='-'){neg=true;str=str.slice(1)}else if(str[0]==='+')str=str.slice(1);
 if(!/^\d*(\.\d*)?$/.test(str)||str===''||str==='.')return NaN;const[w,f='']=str.split('.');const c=parseInt(w||'0',10)*100+parseInt((f+'00').slice(0,2),10)+(f.length>2&&+f[2]>=5?1:0);return neg?-c:c}
const defaultAcct=s=>(s.accounts.find(a=>a.type==='checking'&&!a.archived)||s.accounts.find(a=>!a.archived)||s.accounts[0]).id;
const defaultCat=(s,kind)=>{const L=s.cats.filter(c=>c.kind===kind);return(L.find(c=>c.name===(kind==='income'?'Sales':'Other expenses'))||L[L.length-1]||{}).id||null};
window.FinDB={open,get,put,del,keys,uid,today,D,pad,SCHED,COLORS,seed,load,save,advance,postDue,delta,balances,total,flows,money,cents,defaultAcct,defaultCat};
})();
