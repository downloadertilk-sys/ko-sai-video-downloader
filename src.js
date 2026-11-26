
import './style.css';

const $ = s => document.querySelector(s);
const pages = [...document.querySelectorAll('.page')];

// ကိုယ့် YouTube Data API Key ကို ဒီနေရာမှာ ထည့်ပါ
const YOUTUBE_API_KEY = 'YOUR_API_KEY_HERE';

function go(id) {
  pages.forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('[data-page]').forEach(t =>
    t.classList.toggle('active', t.dataset.page === id)
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-page]').forEach(b =>
  b.addEventListener('click', () => go(b.dataset.page))
);

$('#theme').onclick = () => {
  document.body.classList.toggle('light');
  $('#theme').textContent =
    document.body.classList.contains('light') ? '☾' : '☼';
};

// HTML စာသားလုံခြုံစွာပြသရန်
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[c]));
}

// YouTube API ဖြင့် ရှာဖွေခြင်း
async function searchYouTube(q) {
  if (!q.trim()) return;

  if (YOUTUBE_API_KEY === 'AIzaSyC3rf8vOthLCm4kV9gim3TErWOOnDNt70c') {
    alert('YouTube API Key မထည့်ရသေးပါ။');
    return;
  }

  const grid = $('#feedGrid');
  grid.innerHTML = '<p>ရှာဖွေနေပါသည်...</p>';

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '12',
      q,
      key: YOUTUBE_API_KEY
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API Error');
    }

    if (!data.items || data.items.length === 0) {
      grid.innerHTML = '<p>ရှာဖွေမှုရလဒ် မတွေ့ပါ။</p>';
      return;
    }

    grid.innerHTML = data.items.map(item => {
      const id = item.id.videoId;
      const title = escapeHtml(item.snippet.title);
      const channel = escapeHtml(item.snippet.channelTitle);
      const thumb = item.snippet.thumbnails.medium?.url ||
                    item.snippet.thumbnails.default?.url;

      return `
        <article class="video-card">
          <button class="thumb" data-video="${id}"
            style="background-image:url('${thumb}');background-size:cover;background-position:center;">
            <span class="play">▶</span>
          </button>
          <div class="video-meta">
            <div class="avatar">K</div>
            <div>
              <h3>${title}</h3>
              <p>${channel}</p>
            </div>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('[data-video]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.video;
        $('#player').innerHTML = `
          <iframe
            src="https://www.youtube-nocookie.com/embed/${id}"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>`;
        go('youtube');
      });
    });

  } catch (error) {
    grid.innerHTML = '<p>ရှာဖွေမှု မအောင်မြင်ပါ။ API Key နှင့် Internet ကို စစ်ဆေးပါ။</p>';
    console.error(error);
  }
}

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  searchYouTube($('#searchInput').value);
});

document.querySelectorAll('[data-demo]').forEach(b =>
  b.addEventListener('click', () =>
    window.open(b.dataset.demo, '_blank', 'noopener')
  )
);

// YouTube URL ဖြင့် Player ဖွင့်ခြင်း
function videoId(url) {
  let id = '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1);
    } else {
      id = u.searchParams.get('v') ||
           u.pathname.split('/').filter(Boolean).pop();
    }
  } catch {}
  return /^[\w-]{11}$/.test(id) ? id : null;
}

$('#urlForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = videoId($('#yturl').value.trim());

  if (!id) {
    alert('YouTube URL မှန်ကန်စွာ ထည့်ပါ။');
    return;
  }

  $('#player').innerHTML = `
    <iframe src="https://www.youtube-nocookie.com/embed/${id}"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>`;
});

// ကိုယ်ပိုင် Media ဖိုင်မှတ်တမ်း
let selected = null;
let history = JSON.parse(localStorage.getItem('ks-history') || '[]');

$('#mediaFile').onchange = e => {
  selected = e.target.files[0];
  $('#fileInfo').textContent = selected
    ? `${selected.name} · ${(selected.size / 1048576).toFixed(2)} MB`
    : 'ဖိုင်မရွေးရသေးပါ။';
};

function saveHistory(kind, quality) {
  if (!selected) {
    alert('အရင်ဆုံး ကိုယ်ပိုင် သို့မဟုတ် ခွင့်ပြုချက်ရှိသော Media ဖိုင်ကို ရွေးပါ။');
    return;
  }

  history.unshift({
    name: selected.name,
    kind,
    quality,
    time: new Date().toLocaleString()
  });

  localStorage.setItem('ks-history', JSON.stringify(history));
  renderHistory();

  alert(`${kind} ${quality} ကို ရွေးချယ်ထားပါပြီ။ အမှန်တကယ် Format ပြောင်းလဲမှုအတွက် Media Engine လိုအပ်ပါသည်။`);
}

$('#mp3').onclick = () =>
  saveHistory('MP3', $('#audioQuality').value + ' kbps');

$('#mp4').onclick = () =>
  saveHistory('MP4', $('#videoQuality').value);

function renderHistory() {
  $('#historyList').innerHTML = history.length
    ? history.map(x => `
      <div class="history-item">
        <b>${escapeHtml(x.name)}</b>
        <small>${escapeHtml(x.kind)} · ${escapeHtml(x.quality)} · ${escapeHtml(x.time)}</small>
      </div>`).join('')
    : 'မှတ်တမ်းမရှိသေးပါ။';
}

$('#clearHistory').onclick = () => {
  history = [];
  localStorage.removeItem('ks-history');
  renderHistory();
};

renderHistory();
