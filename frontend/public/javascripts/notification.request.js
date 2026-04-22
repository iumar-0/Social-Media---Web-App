// ══════════════════════════════
// FOLLOW REQUESTS MODULE
// ══════════════════════════════
const FollowRequests = (() => {

    const GRADS = [
        'linear-gradient(135deg,#405de6,#833ab4)',
        'linear-gradient(135deg,#833ab4,#c13584)',
        'linear-gradient(135deg,#f77737,#fcaf45)',
        'linear-gradient(135deg,#0095f6,#00c6ff)',
        'linear-gradient(135deg,#6d28d9,#a855f7)',
    ];

    function avatarGrad(name) {
        return GRADS[name.charCodeAt(0) % GRADS.length];
    }

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(dateStr).toLocaleDateString();
    }

    // ── BUILD ONE REQUEST ITEM ──
    function buildItem(req, index) {
        const item = document.createElement('div');
        item.className = 'fr-item';
        item.id = 'fr-item-' + req.id;
        item.style.animationDelay = (index * 0.05) + 's';

        item.innerHTML = `
      <div class="fr-avi" style="background:${avatarGrad(req.username)};">
        ${req.avatar
                ? `<img src="${req.avatar}" alt="${req.username}"/>`
                : req.initials}
      </div>
      <div class="fr-info">
        <div class="fr-username">${req.username}</div>
        ${req.name ? `<div class="fr-name">${req.name}</div>` : ''}
        <div class="fr-time">${timeAgo(req.time)}</div>
      </div>
      <div class="fr-actions">
        <button class="fr-btn accept" id="accept-${req.id}" onclick="FollowRequests.accept('${req.id}', this)">
          <span>Confirm</span>
          <div class="fr-spin"></div>
        </button>
        <button class="fr-btn decline" id="decline-${req.id}" onclick="FollowRequests.decline('${req.id}', this)">
          <span>Delete</span>
          <div class="fr-spin"></div>
        </button>
      </div>`;

        return item;
    }

    // ── RENDER LIST ──
    function renderList(requests) {
        const skeleton = document.getElementById('frSkeleton');
        const list = document.getElementById('frList');
        const empty = document.getElementById('frEmpty');
        const count = document.getElementById('frCount');

        skeleton.classList.add('display-none');

        if (!requests.length) {
            empty.classList.remove('display-none');
            count.textContent = '';
            return;
        }

        list.classList.remove('display-none');
        list.innerHTML = '';
        count.textContent = requests.length + ' pending';

        requests.forEach((req, i) => list.appendChild(buildItem(req, i)));
    }

    // ── REMOVE ITEM FROM DOM ──
    function removeItem(id, callback) {
        const item = document.getElementById('fr-item-' + id);
        if (!item) return;
        item.classList.add('removing');
        item.addEventListener('animationend', () => {
            item.remove();
            if (callback) callback();
            checkEmpty();
        }, { once: true });
    }

    function checkEmpty() {
        const list = document.getElementById('frList');
        const empty = document.getElementById('frEmpty');
        const count = document.getElementById('frCount');
        if (list && list.children.length === 0) {
            list.classList.add('display-none');
            empty.classList.remove('display-none');
            count.textContent = '';
        } else if (list) {
            const remaining = list.children.length;
            count.textContent = remaining + ' pending';
        }
    }

    // ── ACCEPT ──
    async function accept(id, btn) {
        btn.classList.add('loading');

        // ── YOUR FETCH GOES HERE ──
        // const res  = await fetch(`/api/follow/accept/${id}`, { method:'POST', credentials:'include' });
        // const data = await res.json();

        await new Promise(r => setTimeout(r, 700));
        btn.classList.remove('loading');
        removeItem(id);
    }

    // ── DECLINE ──
    async function decline(id, btn) {
        btn.classList.add('loading');

        // ── YOUR FETCH GOES HERE ──
        // const res  = await fetch(`/api/follow/decline/${id}`, { method:'DELETE', credentials:'include' });
        // const data = await res.json();

        await new Promise(r => setTimeout(r, 500));
        btn.classList.remove('loading');
        removeItem(id);
    }

    // ── OPEN ──
    function open() {
        const overlay = document.getElementById('frOverlay');
        const skeleton = document.getElementById('frSkeleton');
        const list = document.getElementById('frList');
        const empty = document.getElementById('frEmpty');

        // reset
        skeleton.classList.remove('display-none');
        list.classList.add('display-none');
        empty.classList.add('display-none');
        list.innerHTML = '';

        overlay.classList.remove('display-none');
        requestAnimationFrame(() => overlay.classList.add('fr-open'));
        document.body.style.overflow = 'hidden';

        // ── YOUR FETCH GOES HERE ──
        // const res  = await fetch('/api/follow/requests', { credentials:'include' });
        // const data = await res.json();
        // renderList(data.requests);

        // simulated
        setTimeout(() => {
            renderList([
                { id: 'r1', username: 'levileon', initials: 'LL', name: 'Levi Leon', time: new Date(Date.now() - 7200000).toISOString() },
                { id: 'r2', username: 'halukman', initials: 'HM', name: 'Haluk Man', time: new Date(Date.now() - 10800000).toISOString() },
                { id: 'r3', username: 'zara.k', initials: 'ZK', name: 'Zara Khan', time: new Date(Date.now() - 86400000).toISOString() },
                { id: 'r4', username: 'ali.dev', initials: 'AD', name: 'Ali Hassan', time: new Date(Date.now() - 172800000).toISOString() },
                { id: 'r5', username: 'kretyastudio', initials: 'KS', name: 'Krety Studio', time: new Date(Date.now() - 259200000).toISOString() },
            ]);
        }, 1200);
    }

    // ── CLOSE ──
    function close() {
        const overlay = document.getElementById('frOverlay');
        overlay.classList.remove('fr-open');
        document.body.style.overflow = '';
        setTimeout(() => overlay.classList.add('display-none'), 300);
    }

    return { open, close, accept, decline };
})();

// close on overlay background click
document.getElementById('frOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('frOverlay')) closeRequests();
});

// close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeRequests();
});

function openRequests() { FollowRequests.open(); }
function closeRequests() { FollowRequests.close(); }