import './style.css';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const $ = (s) => document.querySelector(s);
const pages = [...document.querySelectorAll('.page')];
const tabs = [...document.querySelectorAll('.tab')];
function go(id) {
  pages.forEach((p) => p.classList.toggle('active', p.id === id));
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.page === id));
}
document.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => go(b.dataset.page)));
$('#theme').onclick = () => {
  document.body.classList.toggle('light');
  $('#theme').textContent = document.body.classList.contains('light') ? '☾' : '☼';
};

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
    return /^[\w-]{11}$/.test(id) ? id : '';
  } catch { return ''; }
}
function embed(url) {
  const id = getYouTubeId(url);
  if (!id) { alert('YouTube URL မှန်ကန်စွာ ထည့်ပါ။'); return; }
  $('#player').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}
$('#playYt').onclick = () => embed($('#yturl').value.trim());
$('#openUrl').onclick = () => {
  const value = $('#url').value.trim();
  if (getYouTubeId(value)) { $('#yturl').value = value; go('youtube'); embed(value); }
  else alert('YouTube Video URL မှန်ကန်စွာ ထည့်ပါ။');
};

let selected = null;
let ffmpeg = null;
let loadingEngine = null;
let busy = false;
let history = [];
try { history = JSON.parse(localStorage.getItem('ks-history') || '[]'); } catch { history = []; }
const status = (message) => { $('#convertStatus').textContent = message; };
const progress = (value, show = true) => {
  $('#convertProgress').hidden = !show;
  $('#convertProgress').value = Math.max(0, Math.min(100, value || 0));
};
const safeName = (name) => name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 70) || 'kosai_media';

$('#mediaFile').onchange = (event) => {
  selected = event.target.files?.[0] || null;
  $('#fileInfo').textContent = selected ? `${selected.name} · ${(selected.size / 1048576).toFixed(2)} MB` : 'ဖိုင်မရွေးရသေးပါ။';
  status(selected ? 'ဖိုင်ရွေးပြီးပါပြီ။ MP3 သို့မဟုတ် MP4 ကို ရွေးပါ။' : 'စတင်ရန် Media ဖိုင်တစ်ခု ရွေးပါ။');
  progress(0, false);
};

async function getEngine() {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loadingEngine) return loadingEngine;
  loadingEngine = (async () => {
    status('Media Engine ကို အင်တာနက်မှ ရယူနေသည်။ ခဏစောင့်ပါ…');
    const engine = new FFmpeg();
    engine.on('log', ({ message }) => {
      if (message && /error|invalid|failed/i.test(message)) status(`လုပ်ဆောင်နေစဉ်: ${message.slice(0, 180)}`);
    });
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
    await engine.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
    });
    ffmpeg = engine;
    return engine;
  })();
  try { return await loadingEngine; }
  finally { loadingEngine = null; }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function addHistory(name, kind, filename) {
  history.unshift({ name, kind, output: filename, time: new Date().toLocaleString() });
  history = history.slice(0, 100);
  localStorage.setItem('ks-history', JSON.stringify(history));
  renderHistory();
}
async function convert(kind) {
  if (busy) return;
  if (!selected) { alert('အရင်ဆုံး Media ဖိုင်ရွေးပါ။'); return; }
  if (kind === 'MP4' && !selected.type.startsWith('video/')) { alert('MP4 ပြောင်းရန် Video ဖိုင်ကို ရွေးပါ။'); return; }
  busy = true;
  $('#mp3').disabled = $('#mp4').disabled = true;
  progress(0);
  try {
    const engine = await getEngine();
    const ext = (selected.name.split('.').pop() || 'media').toLowerCase().replace(/[^a-z0-9]/g, '') || 'media';
    const input = `input.${ext}`;
    const outputName = `${safeName(selected.name)}.${kind.toLowerCase()}`;
    status('ဖိုင်ကို Engine ထဲသို့ ထည့်နေသည်…');
    await engine.writeFile(input, new Uint8Array(await selected.arrayBuffer()));
    engine.on('progress', ({ progress: p }) => progress(Math.round((p || 0) * 100)));
    status(`${kind} အဖြစ် ပြောင်းလဲနေသည်… ဖုန်းကို ခဏအသုံးမပြုဘဲ စောင့်ပေးပါ။`);
    let args;
    if (kind === 'MP3') {
      args = ['-i', input, '-vn', '-c:a', 'libmp3lame', '-b:a', $('#audioQuality').value, '-y', 'output.mp3'];
    } else {
      const width = Number($('#videoQuality').value);
      args = ['-i', input, '-vf', `scale='min(${width},iw)':-2`, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', 'output.mp4'];
    }
    await engine.exec(args);
    const data = await engine.readFile(kind === 'MP3' ? 'output.mp3' : 'output.mp4');
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const blob = new Blob([bytes], { type: kind === 'MP3' ? 'audio/mpeg' : 'video/mp4' });
    saveBlob(blob, outputName);
    addHistory(selected.name, kind, outputName);
    status(`ပြီးပါပြီ။ ${outputName} ကို ဖုန်းထဲသို့ သိမ်းဆည်းရန် Download စတင်ပါပြီ။`);
    progress(100);
    try { await engine.deleteFile(input); await engine.deleteFile(kind === 'MP3' ? 'output.mp3' : 'output.mp4'); } catch { /* temporary files */ }
  } catch (error) {
    console.error(error);
    status(`ပြောင်းလဲမှု မအောင်မြင်ပါ။ ${error?.message || 'ဖိုင်အမျိုးအစား သို့မဟုတ် ဖုန်းမှတ်ဉာဏ်ကို စစ်ဆေးပါ။'}`);
    alert('ဖိုင်ပြောင်းလဲမှု မအောင်မြင်ပါ။ ဖိုင်အရွယ်အစားလျှော့ပြီး ထပ်စမ်းကြည့်ပါ။');
  } finally {
    busy = false;
    $('#mp3').disabled = $('#mp4').disabled = false;
  }
}
$('#mp3').onclick = () => convert('MP3');
$('#mp4').onclick = () => convert('MP4');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function renderHistory() {
  $('#historyList').innerHTML = history.length
    ? history.map((item) => `<div class="historyitem"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.kind)}${item.output ? ` · ${escapeHtml(item.output)}` : ''} · ${escapeHtml(item.time)}</small></div>`).join('')
    : 'မှတ်တမ်းမရှိသေးပါ။';
}
$('#clearHistory').onclick = () => {
  if (!confirm('မှတ်တမ်းအားလုံးကို ရှင်းမလား။')) return;
  history = [];
  localStorage.removeItem('ks-history');
  renderHistory();
};
renderHistory();
