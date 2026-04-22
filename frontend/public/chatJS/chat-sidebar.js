/* ════════════════════════════════════════
   chat-sidebar.js — conversation list
════════════════════════════════════════ */

const ChatSidebar = (() => {

    let _onSelect = null;

    // ── BUILD ONE CONVERSATION ITEM ──
    function buildConvItem(conv) {
        const item = document.createElement('div');

        item.className = 'conv-item' + (conv.id === ChatState.getActiveId() ? ' active' : '');
        item.id = 'conv-' + conv.id;
        item.dataset.id = conv.id;


        const lastMsg = conv.messages[conv.messages.length - 1];

        const preview = lastMsg
            ? (lastMsg.type === 'image' ? '📷 Photo' : lastMsg.type === 'voice' ? '🎵 Voice message' : lastMsg.text)
            : 'No messages yet';

        const isUnread = conv.unread > 0;

        // some new setting in the building the cards
        item.innerHTML = `
      <div class="conv-avi-wrap">
        <div class="conv-avi" id="conv-avi-${conv.id}">
        ${conv.avatar
                // adding the user profile and name and intails 
                ? `<img src="${conv.profile.url}" alt="${conv.name}"/>`
                : `<img src="https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg" alt="profile">`}
        </div>
        
        ${conv.online /* adding the if  the user is online  or not */ ? `<div class="conv-online-dot"></div>` : ''}
      </div>
      <div class="conv-info">
        <div class="conv-row1">
          <span class="conv-name">${conv.name}</span>
          <span class="conv-time">${lastMsg ? ChatUtils.timeAgo(lastMsg.time) : ''}</span>
        </div>
        <div class="conv-row2">
          <span class="conv-preview ${isUnread ? 'unread' : ''}">${preview}</span>
          ${isUnread ? `<span class="conv-unread-badge">${conv.unread}</span>` : ''}
        </div>
      </div>`;

        item.onclick = () => {
            if (_onSelect) _onSelect(conv.id);  // this runs when the converstation is clicked only
        };

        return item;
    }

    // ── RENDER FULL LIST ──
    function render() {
        const list = document.getElementById('convList');
        if (!list) return;

        const convs = ChatState.filteredConversations();

        list.innerHTML = '';

        if (!convs.length) {
            // if no conversation found Error

            list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--ct-text-muted);font-size:13.5px;">No conversations found</div>`;
            return;
        }

        convs.forEach((conv, i) => {

            const item = buildConvItem(conv);

            item.style.animationDelay = (i * 0.04) + 's';
            list.appendChild(item);
        });
    }

    // ── UPDATE SINGLE ITEM PREVIEW ──
    function updatePreview(convId) {
        const conv = ChatState.getConv(convId);
        if (!conv) return;
        const item = document.getElementById('conv-' + convId);
        if (!item) { render(); return; }

        const lastMsg = conv.messages[conv.messages.length - 1];
        const preview = lastMsg
            ? (lastMsg.type === 'image' ? '📷 Photo' : lastMsg.type === 'voice' ? '🎵 Voice message' : lastMsg.text)
            : '';
        const isUnread = conv.unread > 0;

        const previewEl = item.querySelector('.conv-preview');
        const timeEl = item.querySelector('.conv-time');
        const badgeEl = item.querySelector('.conv-unread-badge');

        if (previewEl) { previewEl.textContent = preview; previewEl.className = 'conv-preview' + (isUnread ? ' unread' : ''); }
        if (timeEl && lastMsg) timeEl.textContent = ChatUtils.timeAgo(lastMsg.time);

        if (isUnread && !badgeEl) {
            const row2 = item.querySelector('.conv-row2');
            const badge = document.createElement('span');
            badge.className = 'conv-unread-badge';
            badge.textContent = conv.unread;
            row2.appendChild(badge);
        } else if (!isUnread && badgeEl) {
            badgeEl.remove();
        } else if (isUnread && badgeEl) {
            badgeEl.textContent = conv.unread;
        }

        // move to top
        const list = document.getElementById('convList');
        if (list && item.parentNode === list) {
            item.style.animationDelay = (2 * 0.04) + 's';
            list.prepend(item);
        }
    }

    // ── SET ACTIVE ──
    function setActive(convId) {
        document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
        const item = document.getElementById('conv-' + convId);
        if (item) item.classList.add('active');
    }

    // ── SHOW SKELETONS ──
    function showSkeletons() {
        const list = document.getElementById('convList');
        if (!list) return;
        list.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            list.innerHTML += `
        <div class="skel-conv">
          <div class="skel skel-avi"></div>
          <div class="skel-lines">
            <div class="skel skel-a"></div>
            <div class="skel skel-b"></div>
          </div>
        </div>`;
        }
    }

    // ── SEARCH HANDLER ──
    function handleSearch(searchValue) {
        ChatState.setSearchQuery(searchValue);
        render();  // this render only the searched chats
    }

    return {
        init(defaultSelectSetting) {
            _onSelect = defaultSelectSetting;   // initizling the funtion

            showSkeletons();
            setTimeout(() => render(), 800);  // this render is the main function to render all chats

            const searchInput = document.getElementById('searchInput');

            if (searchInput) {
                searchInput.addEventListener("input", (dets) => {
                    handleSearch(dets.target.value.trim());
                });
            }
        },
        render,
        updatePreview,
        setActive,
    };
})();