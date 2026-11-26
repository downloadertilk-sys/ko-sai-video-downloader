import './style.css';

const $ = selector => document.querySelector(selector);
const pages = [...document.querySelectorAll('.page')];
const API_KEY = 'AIzaSyC3rf8vOthLCm4kV9gim3TErWOOnDNt70c';

function go(id) {
  pages.forEach(page => page.classList.toggle('active', page.id === id));
  document.querySelectorAll('[data-page]').forEach(button =>
    button.classList.toggle('active', button.dataset.page === id)
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-page]').forEach(button =>
  button.addEventListener('click', () => go(button.dataset.page))
);

$('#theme').onclick = () => {
  document.body.classList.toggle('light');
  $('#theme').textContent = document.body.classList.contains('light') ? '☾' : '☼';
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

async function searchYouTube(query) {
  query = query.trim();
  if (!query) return;
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    alert('YouTube API Key မထည့်ရသေးပါ။');
    return;
  }

  const feed = $('#feedGrid');
  feed.innerHTML = '<p>ဗီဒီယိုများ ရှာဖွေနေပါသည်...</p>';

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      part: 'snippet', type: 'video', maxResults: '20', q: query, key: API_KEY
    });
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'YouTube API Error');
    if (!data.items?.length) {
      feed.innerHTML = '<p>ရှာဖွေမှုရလဒ် မတွေ့ပါ။</p>';
      return;
    }

    feed.innerHTML = data.items.map(item => {
      const id = item.id.videoId;
      const title = escapeHtml(item.snippet.title);
      const channel = escapeHtml(item.snippet.channelTitle);
      const thumbnail = item.snippet.thumbnails.medium?.url ||
                        item.snippet.thumbnails.default?.url;
      return `
        <article class="video-card">
          <button class="thumb" type="button" data-video="${id}"
            style="background-image:url('${thumbnail}');background-size:cover;background-position:center">
            <span class="play">▶</span>
          </button>
          <div class="video-meta">
            <div class="avatar">K</div>
            <div><h3>${title}</h3><p>${channel}</p></div>
          </div>
        </article>`;
    }).join('');

    feed.querySelectorAll('[data-video]').forEach(button =>
      button.addEventListener('click', () => openVideo(button.dataset.video))
    );
    go('home');
  } catch (error) {
    console.error(error);
    feed.innerHTML = `<p>ရှာဖွေမှု မအောင်မြင်ပါ။ ${escapeHtml(error.message)}</p>`;
  }
}

$('#searchForm').addEventListener('submit', event => {
  event.preventDefault();
  searchYouTube($('#searchInput').value);
});

document.querySelectorAll('[data-category]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const terms = {
      all: 'Myanmar popular videos',
      music: 'Myanmar music',
      gaming: 'Myanmar gaming',
      education: 'Myanmar education',
      live: 'Myanmar live'
    };
    searchYouTube(terms[button.dataset.category] || button.dataset.category);
  });
});

function openVideo(id) {
  $('#player').innerHTML = `
    <iframe src="https://www.youtube-nocookie.com/embed/${id}"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>`;
  go('youtube');
}

function videoId(url) {
  try {
    const parsed = new URL(url);
    let id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

$('#urlForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = videoId($('#yturl').value.trim());
  if (!id) {
    alert('YouTube Video URL မှန်ကန်စွာ ထည့်ပါ။');
    return;
  }
  openVideo(id);
});

document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => {
    const url = button.dataset.demo;
    try {
      const query = new URL(url).searchParams.get('search_query');
      if (query) {
        $('#searchInput').value = query.replace(/\+/g, ' ');
        searchYouTube($('#searchInput').value);
      }
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  });
});

let selected = null;
let history = [];
try {
  history = JSON.parse(localStorage.getItem('ks-history') || '[]');
} catch {
  history = [];
}

$('#mediaFile').onchange = event => {
  selected = event.target.files[0] || null;
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
    name: selected.name, kind, quality, time: new Date().toLocaleString()
  });
  localStorage.setItem('ks-history', JSON.stringify(history));
  renderHistory();
  alert(`${kind} ${quality} ကို ရွေးချယ်ထားပါပြီ။ အမှန်တကယ် Format ပြောင်းလဲရန် Media Engine လိုအပ်ပါသည်။`);
}

$('#mp3').onclick = () => saveHistory('MP3', $('#audioQuality').value + ' kbps');
$('#mp4').onclick = () => saveHistory('MP4', $('#videoQuality').value);

function renderHistory() {
  const list = $('#historyList');
  list.innerHTML = history.length
    ? history.map(item => `
      <div class="history-item">
        <b>${escapeHtml(item.name)}</b>
        <small>${escapeHtml(item.kind)} · ${escapeHtml(item.quality)} · ${escapeHtml(item.time)}</small>
      </div>`).join('')
    : 'မှတ်တမ်းမရှိသေးပါ။';
}

$('#clearHistory').onclick = () => {
  if (!confirm('မှတ်တမ်းအားလုံး ရှင်းလင်းမှာ သေချာပါသလား။')) return;
  history = [];
  localStorage.removeItem('ks-history');
  renderHistory();
};

renderHistory();
