
// ══════════════════════════════
// DATA — replace with your fetch
// ══════════════════════════════
const MOCK_NOTIFICATIONS = [
    // follow requests (separate section)
    { id: 'r1', type: 'follow_request', username: 'levileon', initials: 'LL', time: ago(2), unread: true },
    { id: 'r2', type: 'follow_request', username: 'halukman', initials: 'HM', time: ago(3), unread: true },

    // recent
    { id: 'n1', type: 'like', username: 'mbestra', initials: 'MB', text: 'liked your post.', time: ago(0.1), unread: true, thumb: 'https://picsum.photos/seed/p1/100/100' },
    { id: 'n2', type: 'comment', username: 'zara.k', initials: 'ZK', text: 'commented on your post: "Amazing shot 🔥"', time: ago(0.5), unread: true, thumb: 'https://picsum.photos/seed/p2/100/100' },
    { id: 'n3', type: 'follow', username: 'ali.dev', initials: 'AD', text: 'started following you.', time: ago(1), unread: true },
    { id: 'n4', type: 'like', username: 'fatima.m', initials: 'FM', text: 'liked your post.', time: ago(2), unread: false, thumb: 'https://picsum.photos/seed/p3/100/100' },
    { id: 'n5', type: 'message', username: 'sarah.ahmed', initials: 'SA', text: 'sent you a message.', time: ago(3), unread: false },
    { id: 'n6', type: 'post', username: 'john_doe', initials: 'JD', text: 'added a new post.', time: ago(5), unread: false, thumb: 'https://picsum.photos/seed/p4/100/100' },

    // yesterday
    { id: 'n7', type: 'like', username: 'verna.dare', initials: 'VD', text: 'liked your story.', time: ago(14), unread: false, thumb: 'https://picsum.photos/seed/p5/100/100' },
    { id: 'n8', type: 'like', username: 'alvian.design', initials: 'AL', text: 'liked your story.', time: ago(16), unread: false, thumb: 'https://picsum.photos/seed/p6/100/100' },
    { id: 'n9', type: 'follow', username: 'kretyastudio', initials: 'KS', text: 'started following you.', time: ago(18), unread: false },
    { id: 'n10', type: 'comment', username: 'fateme_a', initials: 'FA', text: 'commented: "Love this!"', time: ago(20), unread: false, thumb: 'https://picsum.photos/seed/p7/100/100' },

    // last 7 days
    { id: 'n11', type: 'like', username: 'zahrakan', initials: 'ZA', text: 'liked your post.', time: ago(48), unread: false, thumb: 'https://picsum.photos/seed/p8/100/100' },
    { id: 'n12', type: 'follow', username: 'cristop.row', initials: 'CR', text: 'started following you.', time: ago(60), unread: false },
    { id: 'n13', type: 'post', username: 'ali.dev', initials: 'AD', text: 'added a new post.', time: ago(72), unread: false, thumb: 'https://picsum.photos/seed/p9/100/100' },
    { id: 'n14', type: 'like', username: 'mbestra', initials: 'MB', text: 'liked your comment.', time: ago(96), unread: false, thumb: 'https://picsum.photos/seed/p10/100/100' },
];

// helper — returns ISO date string N hours ago
function ago(hours) {
    return new Date(Date.now() - hours * 3600000).toISOString();
}

// ══════════════════════════════
// TIME HELPER
// ══════════════════════════════
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString();
}

// ══════════════════════════════
// GROUP BY DATE
// ══════════════════════════════
function groupByDate(items) {
    const now = Date.now();
    const groups = { 'New': [], 'Yesterday': [], 'Last 7 days': [], 'Older': [] };

    items.forEach(n => {
        const diff = (now - new Date(n.time)) / 3600000; // hours
        if (diff < 24) groups['New'].push(n);
        else if (diff < 48) groups['Yesterday'].push(n);
        else if (diff < 168) groups['Last 7 days'].push(n);
        else groups['Older'].push(n);
    });

    return groups;
}

// ══════════════════════════════
// AVATAR GRADIENT
// ══════════════════════════════
const GRADS = [
    'linear-gradient(135deg,#405de6,#833ab4)',
    'linear-gradient(135deg,#833ab4,#c13584)',
    'linear-gradient(135deg,#f77737,#fcaf45)',
    'linear-gradient(135deg,#0095f6,#00c6ff)',
    'linear-gradient(135deg,#20bf55,#01baef)',
    'linear-gradient(135deg,#6d28d9,#a855f7)',
];
function avatarGrad(name) {
    return GRADS[name.charCodeAt(0) % GRADS.length];
}

// ══════════════════════════════
// TYPE CONFIG
// ══════════════════════════════
const TYPE_CONFIG = {
    like: { badge: 'badge-like', icon: '❤️' },
    comment: { badge: 'badge-comment', icon: '💬' },
    follow: { badge: 'badge-follow', icon: '👤' },
    follow_request: { badge: 'badge-follow', icon: '👤' },
    post: { badge: 'badge-post', icon: '📷' },
    message: { badge: 'badge-message', icon: '💌' },
};

// ══════════════════════════════
// BUILD SINGLE NOTIFICATION CARD
// ══════════════════════════════
function buildCard(n, delay) {
    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.like;
    const card = document.createElement('div');
    card.className = `notif-card${n.unread ? ' unread' : ''}`;
    card.id = 'notif-' + n.id;
    card.style.animationDelay = delay + 's';

    // avatar
    const aviWrap = document.createElement('div');
    aviWrap.className = 'notif-avi-wrap';
    aviWrap.innerHTML = `
    <div class="notif-avi" style="background:${avatarGrad(n.username)};">
      <span style="color:#fff;font-size:15px;font-weight:700;">${n.initials}</span>
    </div>
    <div class="notif-type-badge ${cfg.badge}">${cfg.icon}</div>`;
    card.appendChild(aviWrap);

    // body
    const body = document.createElement('div');
    body.className = 'notif-body';
    body.innerHTML = `
    <div class="notif-text"><strong>${n.username}</strong> ${n.text || ''}</div>
    <div class="notif-time">${timeAgo(n.time)}</div>`;
    card.appendChild(body);

    // right side
    if (n.type === 'follow') {
        const btn = buildFollowBtn(n.id);
        card.appendChild(btn);
    } else if (n.thumb) {
        const img = document.createElement('img');
        img.className = 'notif-thumb';
        img.src = n.thumb;
        img.alt = 'post';
        img.loading = 'lazy';
        card.appendChild(img);
    } else if (n.unread) {
        const dot = document.createElement('div');
        dot.className = 'unread-dot';
        card.appendChild(dot);
    }

    return card;
}

// ══════════════════════════════
// FOLLOW BUTTON
// ══════════════════════════════
function buildFollowBtn(notifId) {
    const btn = document.createElement('button');
    btn.className = 'btn-notif-follow';
    btn.id = 'fbtn-' + notifId;
    btn.innerHTML = `<span>Follow</span><div class="f-spin"></div>`;
    btn.onclick = () => handleFollow(notifId, btn);
    return btn;
}

async function handleFollow(notifId, btn) {
    if (btn.classList.contains('following')) return;
    btn.classList.add('loading');

    // ── YOUR FETCH GOES HERE ──
    // await fetch('/api/user/follow', { method:'POST', credentials:'include', ... });

    await new Promise(r => setTimeout(r, 700));
    btn.classList.remove('loading');
    btn.classList.add('following');
    btn.innerHTML = '<span>Following</span>';
}

// ══════════════════════════════
// FOLLOW REQUESTS BANNER
// ══════════════════════════════
function buildRequestsBanner(requests) {
    if (!requests.length) return null;

    const banner = document.createElement('div');
    banner.onclick = () => openRequests();
    banner.className = 'requests-banner';

    const avatarStack = requests.slice(0, 3).map(r =>
        `<div class="rq-avi">${r.initials}</div>`
    ).join('');

    banner.innerHTML = `
    <div class="requests-banner-left">
      <div class="requests-avatar-stack">${avatarStack}</div>
      <div class="requests-banner-text">
        <h4>Follow Requests</h4>
        <p>${requests.length} pending request${requests.length > 1 ? 's' : ''}</p>
      </div>
    </div>
    <svg class="requests-banner-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    return banner;
}

// ══════════════════════════════
// RENDER ALL
// ══════════════════════════════
function render(data) {
    const page = document.getElementById('notifPage');
    page.innerHTML = '';

    const requests = data.filter(n => n.type === 'follow_request');
    const rest = data.filter(n => n.type !== 'follow_request');

    // follow requests banner
    const banner = buildRequestsBanner(requests);
    if (banner) page.appendChild(banner);

    // group rest by date
    const groups = groupByDate(rest);
    let delay = 0.05;

    Object.entries(groups).forEach(([label, items]) => {
        if (!items.length) return;

        const section = document.createElement('div');
        section.className = 'notif-section';

        const lbl = document.createElement('div');
        lbl.className = 'section-label';
        lbl.textContent = label;
        section.appendChild(lbl);

        items.forEach(n => {
            section.appendChild(buildCard(n, delay));
            delay += 0.04;
        });

        page.appendChild(section);
    });

    if (!rest.length && !requests.length) {
        const empty = document.createElement('div');
        empty.className = 'notif-empty';
        empty.style.display = 'block';
        empty.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <p>No notifications yet</p>`;
        page.appendChild(empty);
    }
}

// ══════════════════════════════
// SKELETON
// ══════════════════════════════
function showSkeleton() {
    const page = document.getElementById('notifPage');
    let html = '';
    // two skeleton groups
    [4, 3].forEach(count => {
        html += `<div class="skel-group">
      <div class="skel skel-label" style="margin-bottom:14px;"></div>`;
        for (let i = 0; i < count; i++) {
            html += `
        <div class="skel-card">
          <div class="skel skel-avi"></div>
          <div class="skel-lines">
            <div class="skel skel-a"></div>
            <div class="skel skel-b"></div>
          </div>
          ${i % 2 === 0 ? `<div class="skel skel-thumb"></div>` : ''}
        </div>`;
        }
        html += `</div>`;
    });
    page.innerHTML = html;
}

// ══════════════════════════════
// MARK ALL READ
// ══════════════════════════════
function markAllRead() {
    MOCK_NOTIFICATIONS.forEach(n => n.unread = false);
    document.querySelectorAll('.notif-card.unread').forEach(el => el.classList.remove('unread'));
    document.querySelectorAll('.unread-dot').forEach(el => el.remove());
    // ── YOUR FETCH GOES HERE ──
    // fetch('/api/notifications/read-all', { method:'PUT', credentials:'include' });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    showSkeleton();

    // ── YOUR FETCH GOES HERE ──
    // const res  = await fetch('/api/notifications', { credentials:'include' });
    // const data = await res.json();
    // render(data.notifications);

    // simulated load
    setTimeout(() => render(MOCK_NOTIFICATIONS), 1400);
});

// ══════════════════════════════
// THEME
// ══════════════════════════════

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeKnobIcon');
const html = document.documentElement;

function toggleTheme() {
    const dark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', dark ? 'light' : 'dark');
    themeToggle.classList.toggle('on', !dark);
    themeIcon.innerHTML = dark
        ? `<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />`
        : `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />`;
    localStorage.setItem("social-media-theme", dark ? 'light' : 'dark')
}

document.addEventListener("DOMContentLoaded", () => {
    let themeChecking = localStorage.getItem("social-media-theme");
    if (themeChecking === "dark") {
        html.setAttribute("data-theme", "dark");
        themeToggle.classList.toggle('on', true);
        themeIcon.innerHTML = `<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />`;
    }
});

// SIDEBAR
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sbOverlay').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sbOverlay').classList.remove('open'); }



