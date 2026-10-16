// Small, safe Markdown renderer for Dash Notes (escapes all HTML; supports headings, lists, checklists, tables,
// quotes, code, links, images (incl. att: attachments), [[wikilinks]], bold/italic/strike/highlight).
window.MD=(()=>{'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^(https?:|mailto:|att:|#)/i.test(u);
function inline(src){const T=[],keep=h=>`\u0001${T.push(h)-1}\u0001`;let s=src;
 s=s.replace(/`([^`]+)`/g,(_,c)=>keep(`<code>${esc(c)}</code>`));
 s=s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,(m,a,u)=>!safe(u)?m:keep(u.startsWith('att:')?`<img alt="${esc(a)}" data-att="${esc(u.slice(4))}" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" loading="lazy">`:`<img alt="${esc(a)}" src="${esc(u)}" loading="lazy">`));
 s=s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,t,l)=>keep(`<a href="#" class="wiki" data-wiki="${esc(t.trim())}">${esc((l||t).trim())}</a>`));
 s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,t,u)=>!safe(u)?m:keep(u.startsWith('att:')?`<a href="#" class="att" data-attlink="${esc(u.slice(4))}">${esc(t)}</a>`:`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`));
 s=s.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,(_,p,u)=>p+keep(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`));
 s=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g,'$1<em>$2</em>').replace(/(^|[^\w])_(?!\s)([^_]+?)_(?!\w)/g,'$1<em>$2</em>')
  .replace(/~~(.+?)~~/g,'<del>$1</del>').replace(/==(.+?)==/g,'<mark>$1</mark>');
 return s.replace(/\u0001(\d+)\u0001/g,(_,i)=>T[i])}
const LI=/^(\s*)([-*+]|\d+[.)])\s+(.*)$/,TASK=/^\[( |x|X)\]\s+(.*)$/;
function render(md,off=0){const L=String(md||'').replace(/\r/g,'').split('\n');let h='',i=0;
 const isBlock=l=>/^```|^#{1,6}\s|^>|^\s*([-*+]|\d+[.)])\s+|^\s*\|.*\|\s*$|^\s*([-*_])(\s*\2){2,}\s*$/.test(l);
 while(i<L.length){const l=L[i];let m;
  if(/^```/.test(l)){const b=[];i++;while(i<L.length&&!/^```/.test(L[i]))b.push(L[i++]);i++;h+=`<pre><code>${esc(b.join('\n'))}</code></pre>`;continue}
  if(m=l.match(/^(#{1,6})\s+(.*)$/)){const n=m[1].length;h+=`<h${n}>${inline(m[2])}</h${n}>`;i++;continue}
  if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){h+='<hr>';i++;continue}
  if(/^>/.test(l)){const st=i,b=[];while(i<L.length&&/^>/.test(L[i]))b.push(L[i++].replace(/^>\s?/,''));h+=`<blockquote>${render(b.join('\n'),off+st)}</blockquote>`;continue}
  if(/^\s*\|.*\|\s*$/.test(l)&&i+1<L.length&&/^\s*\|?\s*:?-{2,}/.test(L[i+1])){const cells=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>inline(c.trim()));
   h+=`<div class="tblwrap"><table><thead><tr>${cells(l).map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>`;i+=2;while(i<L.length&&/^\s*\|.*\|\s*$/.test(L[i]))h+=`<tr>${cells(L[i++]).map(c=>`<td>${c}</td>`).join('')}</tr>`;h+='</tbody></table></div>';continue}
  if(m=l.match(LI)){const ord=/\d/.test(m[2]);h+=ord?'<ol>':'<ul>';
   while(i<L.length&&(m=L[i].match(LI))&&(/\d/.test(m[2])===ord)){const lvl=Math.min(4,Math.floor(m[1].replace(/\t/g,'  ').length/2)),t=m[3].match(TASK);
    h+=t?`<li class="task${t[1]!==' '?' done':''}" style="margin-left:${lvl*1.2}em"><label><input type="checkbox" data-line="${off+i}"${t[1]!==' '?' checked':''}><span>${inline(t[2])}</span></label></li>`:`<li style="margin-left:${lvl*1.2}em">${inline(m[3])}</li>`;i++}
   h+=ord?'</ol>':'</ul>';continue}
  if(!l.trim()){i++;continue}
  const b=[];while(i<L.length&&L[i].trim()&&(!b.length||!isBlock(L[i])))b.push(L[i++]);h+=`<p>${b.map(inline).join('<br>')}</p>`}
 return h}
const plain=md=>String(md||'').replace(/```[\s\S]*?```/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm,'').replace(/^\s*\|?[\s:|-]*-{3,}[\s:|-]*$/gm,' ').replace(/[#>*_~=`|]/g,' ').replace(/\s+/g,' ').trim();
return{render,inline,esc,plain}})();
