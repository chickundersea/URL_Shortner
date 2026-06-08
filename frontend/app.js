const API = 'http://localhost:8888';
let history = [];

async function shorten() {
  const input = document.getElementById('urlInput');
  const errorMsg = document.getElementById('errorMsg');
  const resultBox = document.getElementById('resultBox');
  const btn = document.getElementById('shortenBtn');

  errorMsg.textContent = '';
  resultBox.classList.remove('visible');

  const url = input.value.trim();
  if (!url) { errorMsg.textContent = '請輸入網址'; return; }

  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(`${API}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.detail || '發生錯誤';
      return;
    }

    document.getElementById('shortUrl').textContent = data.short_url;
    resultBox.classList.add('visible');

    history.unshift({ code: data.short_code, short: data.short_url, original: url });
    renderHistory();
    input.value = '';

  } catch (e) {
    errorMsg.textContent = '無法連線到後端，確認 docker compose up 是否執行中';
  } finally {
    btn.disabled = false;
    btn.textContent = 'SNIP';
  }
}

function copyUrl() {
  const url = document.getElementById('shortUrl').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'COPIED!';
    setTimeout(() => btn.textContent = 'COPY', 1500);
  });
}

async function openShort(code) {
  try {
    const res = await fetch(`${API}/r/${code}`);
    const data = await res.json();
    if (data.url) window.open(data.url, '_blank');
  } catch (e) {
    alert('無法解析短網址');
  }
}

function renderHistory() {
  const ul = document.getElementById('history');
  const empty = document.getElementById('emptyState');
  empty.style.display = history.length ? 'none' : 'block';

  ul.querySelectorAll('li:not(#emptyState)').forEach(el => el.remove());

  history.forEach(item => {
    const li = document.createElement('li');

    const codeSpan = document.createElement('span');
    codeSpan.className = 'hist-code';
    codeSpan.title = '點擊開啟';
    codeSpan.textContent = item.short;
    codeSpan.onclick = () => openShort(item.code);

    const origSpan = document.createElement('span');
    origSpan.className = 'hist-original';
    origSpan.title = item.original;
    origSpan.textContent = item.original;

    li.append(codeSpan, origSpan);
    ul.appendChild(li);
  });
}

document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') shorten();
});
