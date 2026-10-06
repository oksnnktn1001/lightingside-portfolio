(() => {
 const stage=document.querySelector('[data-stage]');
 const layers=Object.fromEntries([...document.querySelectorAll('[data-layer]')].map(n=>[n.dataset.layer,n]));
 const defaults={circle:{x:55,y:34,size:112,opacity:96},line:{x:57,y:49,size:138,opacity:82}};
 let state;try{state={...defaults,...JSON.parse(localStorage.getItem('oksanaMobileHero')||'{}')}}catch{state=structuredClone(defaults)}
 let selected='circle',dragging=false;
 const size=document.querySelector('[data-size]'),opacity=document.querySelector('[data-opacity]'),status=document.querySelector('[data-status]');
 const render=()=>{Object.entries(layers).forEach(([key,node])=>{const v=state[key];node.style.left=v.x+'%';node.style.top=v.y+'%';node.style.width=v.size+'%';node.style.opacity=v.opacity/100;node.classList.toggle('selected',key===selected)});size.value=state[selected].size;opacity.value=state[selected].opacity;document.querySelectorAll('[data-select]').forEach(b=>b.classList.toggle('active',b.dataset.select===selected));localStorage.setItem('oksanaMobileHero',JSON.stringify(state))};
 const select=key=>{selected=key;status.textContent='Выбрано: '+(key==='circle'?'круг':'световая линия')+' · настройки сохраняются автоматически';render()};
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));
 Object.entries(layers).forEach(([key,node])=>node.onpointerdown=e=>{select(key);dragging=true;node.setPointerCapture(e.pointerId)});
 stage.onpointermove=e=>{if(!dragging)return;const r=stage.getBoundingClientRect();state[selected].x=Math.round((e.clientX-r.left)/r.width*1000)/10;state[selected].y=Math.round((e.clientY-r.top)/r.height*1000)/10;render()};
 stage.onpointerup=stage.onpointercancel=()=>dragging=false;
 size.oninput=()=>{state[selected].size=+size.value;render()};opacity.oninput=()=>{state[selected].opacity=+opacity.value;render()};
 document.querySelector('[data-copy]').onclick=async()=>{const value=JSON.stringify(state);try{await navigator.clipboard.writeText(value)}catch{}status.textContent='СОХРАНЕНО: '+value;};render();
})();
