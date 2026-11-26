import './style.css';
const $=s=>document.querySelector(s);
const pages=[...document.querySelectorAll('.page')];
function go(id){pages.forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-page]').forEach(t=>t.classList.toggle('active',t.dataset.page===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
$('#theme').onclick=()=>{document.body.classList.toggle('light');$('#theme').textContent=document.body.classList.contains('light')?'☾':'☼';};
function searchYouTube(q){if(!q.trim())return;window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q),'_blank','noopener');}
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();searchYouTube($('#searchInput').value);});
document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>window.open(b.dataset.demo,'_blank','noopener')));
function videoId(url){let id='';try{const u=new URL(url);if(u.hostname.includes('youtu.be'))id=u.pathname.slice(1);else id=u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();}catch{}return /^[\w-]{11}$/.test(id)?id:null;}
$('#urlForm').addEventListener('submit',e=>{e.preventDefault();const id=videoId($('#yturl').value.trim());if(!id){alert('YouTube URL မှန်ကန်စွာ ထည့်ပါ။');return;}$('#player').innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;});
let selected=null, history=JSON.parse(localStorage.getItem('ks-history')||'[]');
$('#mediaFile').onchange=e=>{selected=e.target.files[0];$('#fileInfo').textContent=selected?`${selected.name} · ${(selected.size/1048576).toFixed(2)} MB`:'ဖိုင်မရွေးရသေးပါ။';};
function saveHistory(kind,quality){if(!selected){alert('အရင်ဆုံး ကိုယ်ပိုင် သို့မဟုတ် ခွင့်ပြုချက်ရှိသော Media ဖိုင်ကို ရွေးပါ။');return;}history.unshift({name:selected.name,kind,quality,time:new Date().toLocaleString()});localStorage.setItem('ks-history',JSON.stringify(history));renderHistory();alert(`${kind} ${quality} ကို ရွေးချယ်ထားပါပြီ။ အမှန်တကယ် Format ပြောင်းလဲသိမ်းဆည်းမှုအတွက် Media Engine မချိတ်ဆက်ရသေးပါ။`);}
$('#mp3').onclick=()=>saveHistory('MP3',$('#audioQuality').value+' kbps');$('#mp4').onclick=()=>saveHistory('MP4',$('#videoQuality').value);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderHistory(){$('#historyList').innerHTML=history.length?history.map(x=>`<div class="history-item"><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.kind)} · ${escapeHtml(x.quality)} · ${escapeHtml(x.time)}</small></div>`).join(''):'မှတ်တမ်းမရှိသေးပါ။';}
$('#clearHistory').onclick=()=>{history=[];localStorage.removeItem('ks-history');renderHistory();};renderHistory();
