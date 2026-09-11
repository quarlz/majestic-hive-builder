(() => {
  'use strict';
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let indexPromise;
  function index() {
    if (!indexPromise) indexPromise = WikiData.json('data/search-index.json').then(rows => rows.map(row => ({...row, name:normalize(row.title), text:normalize(row.title+' '+row.desc+' '+row.type)}))).catch(error => { indexPromise=null; throw error; });
    return indexPromise;
  }
  function rank(rows, query) {
    const q=normalize(query.trim());
    const words=q.split(/\s+/).filter(Boolean);
    return rows.map(row => ({row,score:row.name===q ? 100 : row.name.startsWith(q) ? 60 : row.name.includes(q) ? 40 : words.every(word=>row.text.includes(word)) ? 10 : 0})).filter(hit=>hit.score).sort((a,b)=>b.score-a.score || a.row.title.localeCompare(b.row.title)).slice(0,12).map(hit=>hit.row);
  }
  function mount(root) {
    if (root.dataset.searchMounted) return;
    root.dataset.searchMounted='true';
    root.innerHTML=`<div class="wiki-search"><label class="search-label" for="wiki-query">Search the wiki</label><div class="search-input-row"><span aria-hidden="true" class="search-symbol">⌕</span><input id="wiki-query" type="search" role="combobox" aria-autocomplete="list" aria-controls="wiki-results" aria-expanded="false" placeholder="Bees, items, quests…" autocomplete="off"><kbd class="search-shortcut">/</kbd><button type="button" class="search-clear" aria-label="Clear search" hidden>×</button></div><div class="search-panel" hidden><p class="search-status" role="status" aria-live="polite"></p><ul id="wiki-results" role="listbox" aria-label="Search results"></ul><p class="search-help">↑ ↓ Navigate <span>Enter Open</span><span>Esc Close</span></p></div></div>`;
    const input=root.querySelector('input'),panel=root.querySelector('.search-panel'),list=root.querySelector('ul'),status=root.querySelector('.search-status'),clear=root.querySelector('.search-clear');
    let generation=0, timer, active=-1;
    const links=()=>[...list.querySelectorAll('a')];
    function close(){ generation++; panel.hidden=true; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); active=-1; }
    function select(n){const all=links(); active=n;all.forEach((a,i)=>{a.classList.toggle('active',i===n);a.parentElement.setAttribute('aria-selected',String(i===n));});if(all[n]){input.setAttribute('aria-activedescendant',all[n].parentElement.id);all[n].scrollIntoView({block:'nearest'});}}
    function show(rows,message){active=-1;input.removeAttribute('aria-activedescendant');list.innerHTML=rows.map((row,i)=>`<li role="option" aria-selected="false" id="wiki-result-${i}"><a href="${escape(row.href)}" tabindex="-1"><div><strong>${escape(row.title)}</strong><p>${escape(row.desc)}</p></div><span class="search-type">${escape(row.type)}</span></a></li>`).join('');status.textContent=message;panel.hidden=false;input.setAttribute('aria-expanded','true');}
    async function search(){const request=++generation;const q=input.value.trim();clear.hidden=!q;if(!q){show(window.WikiPages.map(p=>({...p,desc:'Explore '+p.title,type:'Page'})),'Explore the wiki');return;}status.textContent='Searching…';panel.hidden=false;input.setAttribute('aria-expanded','true');try{const rows=await index();if(request!==generation)return;const hits=rank(rows,q);show(hits,hits.length ? `${hits.length} results for “${q}”` : `No results for “${q}”. Try a bee, item, or quest name.`);}catch{if(request===generation)show([],'Search could not load. Try typing again.');}}
    input.addEventListener('input',()=>{generation++;clearTimeout(timer);timer=setTimeout(search,120);});
    input.addEventListener('focus',search);
    input.addEventListener('keydown',event=>{const all=links();if(event.key==='Escape'){close();return;}if(panel.hidden)return;if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();select(Math.max(0,Math.min(all.length-1,active+(event.key==='ArrowDown'?1:-1))));}if(event.key==='Enter'&&all.length){event.preventDefault();all[Math.max(0,active)].click();}});
    clear.addEventListener('click',()=>{input.value='';input.focus();search();});
    document.addEventListener('pointerdown',event=>{if(!root.contains(event.target))close();});
    root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget))close();});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();input.focus();}});
  }
  window.WikiSearch=Object.freeze({mount,rank});
})();
