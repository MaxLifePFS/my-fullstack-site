// ===== Tim's Work Hub — data & rendering =====
// To add/remove/reorder links, edit GROUPS below and redeploy. Nothing else to touch.

const GROUPS = [
  {
    id: 'academy',
    title: 'MaxLife Academy',
    zh: '万福财务事务所 · 财商学堂',
    icon: '🎓',
    links: [
      { name: 'PFS — MaxLife Academy', url: 'https://academy.maxlife.cc' },
      { name: 'ACN Essential Services', url: 'https://pfs.acnibo.com/us-en/services' },
      { name: 'ACN IBO Portal', url: 'https://myacn.my.site.com/ACNIBO/s/login/?language=en_US' },
      { name: 'NS', url: 'https://www.nsfed.app' },
      { name: 'NLG New Business', url: 'https://www.nationallife.com/agent/book-of-business/new-business/all-new-business-cases' },
      { name: 'F&G SalesLink', url: 'https://saleslink.fglife.com/' },
      { name: 'Athene Producer', url: 'https://www.athene.com/producer/login' },
      { name: 'Allianz Life', url: 'https://www.allianzlife.com/login' },
      { name: 'My Book — Unlearn to Earn', url: 'https://sites.google.com/view/unlearntoearn' },
      { name: 'MaxLife Strategy', url: 'https://hub.maxlife.cc/img/maxlife-strategy.png' }
    ]
  },
  {
    id: 'flexstay',
    title: 'FlexStay Properties',
    zh: '灵活民宿 · 地产投资',
    icon: '🏡',
    links: [
      { name: 'Airbnb Multicalendar', url: 'https://www.airbnb.com/multicalendar' },
      { name: 'Trinity Ranch Inn (Greenville)', url: 'https://trinity.maxlife.cc' },
      { name: 'Bottlebrush + Greenhaven + Kirby', url: 'https://www.airbnb.com/users/show/216674639' },
      { name: 'Realty Invest', url: 'https://learn.yongmingu.com/' },
      { name: 'Trinity C1 — Capital One', url: 'https://verified.capitalone.com/auth/signin' },
      { name: 'Nanxiang 南翔', url: 'https://sites.google.com/view/bao-all' },
      { name: 'TSI — RealAuction', url: 'https://www.realauction.com/clients' },
      { name: 'Zillow Rental Manager', url: 'https://www.zillow.com/rental-manager/properties' }
    ]
  },
  {
    id: 'amazon',
    title: 'Amazon E-Commerce',
    zh: '中美跨境电商',
    icon: '📦',
    links: [
      { name: 'Seller Central', url: 'https://sellercentral.amazon.com' },
      { name: 'Amazon Orders (Buyer)', url: 'https://www.amazon.com/gp/css/order-history' },
      { name: 'Relay Bank', url: 'https://app.relayfi.com/firm' },
      { name: 'Bizee (IncFile)', url: 'https://orders.bizee.com/dashboard/my-orders/overview' },
      { name: 'TX Comptroller — Compliance', url: 'https://comptroller.texas.gov/' }
    ]
  },
  {
    id: 'invest',
    title: 'Investment & Insurance',
    zh: '投资与保险组合',
    icon: '📈',
    links: [
      { name: 'BoA Small Business', url: 'https://www.bankofamerica.com/smallbusiness/' },
      { name: 'Fidelity', url: 'https://www.fidelity.com/' },
      { name: 'NLG Customer', url: 'https://www.nationallife.com/customer/customerhome' },
      { name: 'F&G MyPolicy', url: 'https://mypolicy.fglife.com/#/login' },
      { name: 'Nationwide Life', url: 'https://login.nationwide.com/access/web/login-continue.x?loginType=lifeInsurance' },
      { name: 'MyAthene', url: 'https://www.athene.com/myathene-login' },
      { name: 'Allianz Life', url: 'https://www.allianzlife.com/login' },
      { name: 'Sams + Amazon (Synchrony)', url: 'https://samsclub.syf.com/accounts/login' },
      { name: 'RAD Diversified', url: 'https://rad-diversified-reg-a.app.dealmaker.tech/users/sign_in' },
      { name: 'Market Watchlist', url: 'https://www.google.com/finance/portfolio/watchlist' }
    ]
  },
  {
    id: 'foundation',
    title: 'Bao Family Foundation',
    zh: '包氏慈善基金会',
    icon: '💛',
    links: [
      { name: 'MaxLife Foundation 万福基金会', url: 'https://sites.google.com/view/mannafund' }
    ]
  },
  {
    id: 'tools',
    title: 'Daily Tools',
    zh: '日常工具',
    icon: '🧰',
    links: [
      { name: 'Gmail', url: 'https://mail.google.com' },
      { name: 'Google Voice', url: 'https://voice.google.com/u/0/messages' },
      { name: 'Google Calendar', url: 'https://calendar.google.com' },
      { name: 'Calendly', url: 'https://calendly.com/app/login' },
      { name: 'Google Drive', url: 'https://drive.google.com/drive/u/0/home' },
      { name: 'OneDrive', url: 'https://onedrive.live.com/' },
      { name: 'iCloud', url: 'https://www.icloud.com/' },
      { name: 'ChatGPT', url: 'https://chatgpt.com' },
      { name: 'QQ Mail', url: 'https://wx.mail.qq.com/' },
      { name: 'Expensify', url: 'https://www.expensify.com/reports' },
      { name: 'World Clock', url: 'https://www.timeanddate.com/worldclock/personal.html' },
      { name: 'LinkedIn', url: 'https://linkedin.com/in/timmybao' },
      { name: 'Facebook', url: 'https://facebook.com/tianming.bao' },
      { name: 'Wikipedia — Personal Finance', url: 'https://en.wikipedia.org/wiki/Personal_finance' }
    ]
  }
];

// ---- render board ----
const board = document.getElementById('board');
const chips = document.getElementById('chips');

function faviconFor(url) {
  const host = new URL(url).hostname;
  return 'https://www.google.com/s2/favicons?domain=' + host + '&sz=64';
}

GROUPS.forEach((g) => {
  const chip = document.createElement('a');
  chip.href = '#' + g.id;
  chip.textContent = g.icon + ' ' + g.title;
  chips.appendChild(chip);

  const section = document.createElement('section');
  section.className = 'group';
  section.id = g.id;
  section.innerHTML = '<h2>' + g.icon + ' ' + g.title + ' <small>' + g.zh + '</small></h2>';
  const grid = document.createElement('div');
  grid.className = 'tiles';
  g.links.forEach((l) => {
    const a = document.createElement('a');
    a.className = 'tile';
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.search = (l.name + ' ' + g.title + ' ' + l.url).toLowerCase();
    const letter = l.name.replace(/[^A-Za-z0-9一-鿿]/g, '').charAt(0).toUpperCase() || '•';
    a.innerHTML =
      '<span class="tile-icon"><img src="' + faviconFor(l.url) + '" alt="" loading="lazy"><i>' + letter + '</i></span>' +
      '<span class="tile-name">' + l.name + '</span>' +
      '<span class="tile-host">' + new URL(l.url).hostname.replace('www.', '') + '</span>';
    a.querySelector('img').addEventListener('error', function () { this.style.display = 'none'; });
    a.querySelector('img').addEventListener('load', function () { this.nextElementSibling.style.display = 'none'; });
    grid.appendChild(a);
  });
  if (g.links.length === 0 && g.note) {
    const ph = document.createElement('p');
    ph.className = 'group-note';
    ph.textContent = g.note;
    section.appendChild(ph);
  }
  section.appendChild(grid);
  board.appendChild(section);
});

// ---- clock & greeting ----
function tick() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const h = now.getHours();
  const word = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = word + ', Tim';
  document.getElementById('dateline').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
tick();
setInterval(tick, 30000);

// ---- search filter ----
const search = document.getElementById('search');
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  document.querySelectorAll('.tile').forEach((t) => {
    t.hidden = q !== '' && !t.dataset.search.includes(q);
  });
  document.querySelectorAll('.group').forEach((s) => {
    s.hidden = q !== '' && ![...s.querySelectorAll('.tile')].some((t) => !t.hidden);
  });
});
search.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = document.querySelector('.tile:not([hidden])');
    if (first) window.open(first.href, '_blank', 'noopener');
  }
  if (e.key === 'Escape') { search.value = ''; search.dispatchEvent(new Event('input')); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
});
