// Dash Notes storage (IndexedDB). Shared by /notes/ and the hub widget.
window.NotesDB=(()=>{'use strict';let dbp=null;
function open(){return dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('dash-notes',1);
 r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('notes',{keyPath:'id'});d.createObjectStore('versions',{keyPath:'id'}).createIndex('noteId','noteId');d.createObjectStore('atts',{keyPath:'id'}).createIndex('noteId','noteId');d.createObjectStore('meta')};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
async function tx(store,mode,fn){const d=await open();return new Promise((res,rej)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let out;const r=fn(s);if(r&&'onsuccess'in r)r.onsuccess=()=>{out=r.result};t.oncomplete=()=>res(out);t.onerror=t.onabort=()=>rej(t.error)})}
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const blank=f=>{const n=Date.now();return Object.assign({id:uid(),title:'',body:'',notebook:'',tags:[],pinned:false,color:'',archived:false,trashed:null,created:n,updated:n,due:null,dueDone:false,notified:false,locked:null},f||{})};
return{open,uid,blank,all:s=>tx(s,'readonly',o=>o.getAll()),get:(s,k)=>tx(s,'readonly',o=>o.get(k)),put:(s,v,k)=>tx(s,'readwrite',o=>k===undefined?o.put(v):o.put(v,k)),
 del:(s,k)=>tx(s,'readwrite',o=>o.delete(k)),byNote:(s,id)=>tx(s,'readonly',o=>o.index('noteId').getAll(id))};
})();
