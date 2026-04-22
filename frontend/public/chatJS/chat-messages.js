/* ════════════════════════════════════════
   chat-messages.js — build + render messages
════════════════════════════════════════ */

const ChatMessages = (() => {

    const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

    // ── BUILD MESSAGE ROW ──
    function buildMsgRow(msg, prevMsg, nextMsg, conv) {

        const isSent = msg.from === 'me';
        const isChain = prevMsg && prevMsg.from === msg.from && ChatUtils.sameDay(prevMsg.time, msg.time);
        const isLast = !nextMsg || nextMsg.from !== msg.from;
        const side = isSent ? 'sent' : 'recv';

        // return
        const row = document.createElement('div');
        row.className = `msg-row ${side}${isChain ? ' chain' : ' gap'}${isLast ? '' : ' chain-first'}`;
        row.id = 'msg-' + msg.id;
        row.dataset.msgId = msg.id;

        // show avatar for received messages (last in chain only)
        if (!isSent) {
            const profileOnChat = document.createElement('div');
            profileOnChat.className = 'msg-avi' + (isLast ? '' : ' hidden');
            profileOnChat.style.background = ChatUtils.avatarGrad(conv.name);
            profileOnChat.textContent = conv.initials;
            row.appendChild(profileOnChat);
        }

        // bubble wrap
        const wrapMessage = document.createElement('div');
        wrapMessage.className = 'msg-bubble-wrap';

        {
            // ONLY for Group >>>>>>>

            // if (!isSent && conv.isGroup && msg.senderName && !isChain) {
            //     console.log("this is working lol");

            //     const name = document.createElement('div');
            //     name.style.cssText = 'font-size:12px;font-weight:600;color:var(--ct-accent);margin-bottom:3px;padding-left:4px;';
            //     name.textContent = msg.senderName;
            //     name.classList.add("hellllllll")
            //     wrapMessage.appendChild(name);
            // }
        }
        console.log(msg.replyTo);

        // reply preview
        if (msg.replyTo) {
            console.log("reply working");

            // two things name of the sender and name of the reciver is important 

            const replyMessageOverview = document.createElement('div');
            replyMessageOverview.className = 'msg-reply-preview';
            replyMessageOverview.innerHTML = `<div class="msg-reply-name">${msg.replyTo.from === 'me' ?
                'You' :
                conv.name}</div>
            ${ChatUtils.escapeHtml(msg.replyTo.text || '📷 Photo')}`;

            // >>>>>>>>>>>>>> adding the event listener is important here

            wrapMessage.appendChild(replyMessageOverview);
        }

        // bubble content
        const bubble = buildBubbleContent(msg);
        wrapMessage.appendChild(bubble);

        // hover action buttons
        const actions = buildMsgActions(msg, isSent);
        wrapMessage.appendChild(actions);

        if (msg.reaction) {
            // reaction (if any) only runs if there is any reaction
            // this will run only  
            // and also removing will need to update also

            const reactionEl = document.createElement('div');
            reactionEl.className = 'msg-reaction';
            reactionEl.textContent = msg.reaction;
            reactionEl.title = 'Click to remove';
            reactionEl.onclick = () => removeReaction(msg.id);
            wrapMessage.appendChild(reactionEl);
        }

        // meta (time + read)
        if (isLast) {
            // this is for adding the time only 
            const meta = document.createElement('div');
            meta.className = 'msg-meta';
            meta.innerHTML = `${ChatUtils.formatTime(msg.time)}${isSent ? ` <span class="read-tick">${msg.read ? '✓✓' : '✓'}</span>` : ''}`;
            wrapMessage.appendChild(meta);
        }

        row.appendChild(wrapMessage);
        return row;
    }

    // ── BUILD BUBBLE CONTENT ──
    function buildBubbleContent(msg) {
        if (msg.type === 'image') {
            // only working if it is image
            const wrap = document.createElement('div');
            wrap.className = 'msg-img';
            wrap.innerHTML = `<img src="${msg.url}" alt="image" loading="lazy"/><div class="msg-img-overlay"></div>`;
            wrap.onclick = () => openLightbox(msg.url);
            return wrap;
        }

        if (msg.type === 'voice') {
            // only working if it is voice
            return buildVoiceBubble(msg);
        }

        // text this will work for the text only

        // now some new changes to get into this 
        // like if the type is image only image should work nothing else 
        // if text type is only the text type should be in working
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerHTML = ChatUtils.linkify(msg.text || '');
        return bubble;
    }

    // ── VOICE BUBBLE ──
    function buildVoiceBubble(msg) {
        const wrap = document.createElement('div');
        wrap.className = 'msg-voice';

        // random bar heights for waveform
        const bars = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16) + 4);
        const barsHtml = bars.map(h => `<div class="voice-bar" style="height:${h}px;"></div>`).join('');

        wrap.innerHTML = `
      <div class="voice-play" onclick="this.innerHTML='⏸'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
      <div class="voice-bars">${barsHtml}</div>
      <span class="voice-duration">${msg.duration || '0:08'}</span>`;
        return wrap;
    }

    // ── HOVER ACTIONS ──
    function buildMsgActions(msg, isSent) {
        const actions = document.createElement('div');
        actions.className = 'msg-actions';

        const reactBtns = REACTIONS.map(r =>
            `<button class="msg-act-btn" title="${r}" onclick="ChatMessages.addReaction('${msg.id}','${r}')">${r}</button>`
        ).join('');

        actions.innerHTML = `
      ${reactBtns}
      <button class="msg-act-btn" title="Reply" onclick="ChatInput.setReply('${msg.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
      </button>
      ${isSent ? `<button class="msg-act-btn" title="Delete" onclick="ChatMessages.deleteMsg('${msg.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>` : ''}`;

        return actions;
    }

    // ── RENDER ALL MESSAGES ──
    function renderAll(convId) {

        // this only works for first rendering the message only

        const conv = ChatState.getConv(convId);

        const container = document.getElementById('messagesWrap');
        if (!conv || !container) return;

        container.innerHTML = '';
        const msgs = conv.messages;

        msgs.forEach((msg, i) => {
            const prev = msgs[i - 1] || null;
            const next = msgs[i + 1] || null;

            // date separator
            if (!prev || !ChatUtils.sameDay(prev.time, msg.time)) {
                const sep = document.createElement('div');
                sep.className = 'date-label';
                sep.textContent = ChatUtils.formatDate(msg.time);
                container.appendChild(sep);
            }

            container.appendChild(buildMsgRow(msg, prev, next, conv));
        });

        ChatUtils.scrollToBottom(container);
    }

    // ── APPEND SINGLE MESSAGE ──
    function appendMessage(convId, msg) {
        const conv = ChatState.getConv(convId);
        const container = document.getElementById('messagesWrap');
        if (!conv || !container) return;

        const msgs = conv.messages;
        const msgIndex = msgs.findIndex(m => m.id === msg.id);
        const prev = msgIndex > 0 ? msgs[msgIndex - 1] : null;
        const next = null;

        const row = buildMsgRow(msg, prev, next, conv);
        row.style.animationDelay = '0s';
        container.appendChild(row);
        ChatUtils.scrollToBottom(container, true);
    }

    // ── REACTIONS ──
    function addReaction(msgId, emoji) {

        // this will also change in the chat 
        // bez we just need to add reaction and update in the database

        const conv = ChatState.getActiveConv();
        if (!conv) return;
        const msg = conv.messages.find(m => m.id === msgId);
        if (!msg) return;
        msg.reaction = emoji;
        renderAll(conv.id);
        ChatUtils.scrollToBottom(document.getElementById('messagesWrap'));
    }

    function removeReaction(msgId) {

        // this whole code will be changed due to we just need only the 
        // remove reaction nothing else on the chat
        const conv = ChatState.getActiveConv();
        if (!conv) return;
        const msg = conv.messages.find(m => m.id === msgId);
        if (!msg) return;
        delete msg.reaction;
        renderAll(conv.id);
        ChatUtils.scrollToBottom(document.getElementById('messagesWrap'));
    }

    // ── DELETE ──
    function deleteMsg(msgId) {

        // rendering the deleting message will awful
        //  this needs the full update after this will get better

        const conv = ChatState.getActiveConv();
        if (!conv) return;
        const idx = conv.messages.findIndex(m => m.id === msgId);
        if (idx === -1) return;
        conv.messages.splice(idx, 1);
        renderAll(conv.id);
        ChatSidebar.updatePreview(conv.id);
    }

    // ── TYPING INDICATOR ──
    function showTyping() {
        const container = document.getElementById('messagesWrap');
        if (!container || document.getElementById('typingIndicator')) return;
        const conv = ChatState.getActiveConv();
        if (!conv) return;

        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.id = 'typingIndicator';
        el.innerHTML = `
      <div class="typing-avi" style="background:${ChatUtils.avatarGrad(conv.name)};"></div>
      <div class="typing-bubbles">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
        container.appendChild(el);
        ChatUtils.scrollToBottom(container, true);
    }

    function hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    // ── LIGHTBOX ──
    function openLightbox(url) {
        const lb = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImg');
        if (lb && img) { img.src = url; lb.classList.add('open'); }
    }

    // ── UPDATE HEADER ──
    function updateHeader(conv) {
        const header = document.getElementById('chatHeader');
        const empty = document.getElementById('chatEmpty');
        const area = document.getElementById('chatAreaInner');


        if (!conv) {
            // runs only if no conv found
            if (header) header.style.display = 'none';
            if (empty) empty.style.display = 'flex';
            if (area) area.style.display = 'none';
            return;
        }

        if (header) header.style.display = 'flex';
        if (empty) empty.style.display = 'none';
        if (area) area.style.display = 'flex';

        const name = document.getElementById('chatHeaderName');
        const status = document.getElementById('chatHeaderStatus');
        const avi = document.getElementById('chatHeaderAvi');

        if (name) name.textContent = conv.name;
        if (status) {
            if (conv.online) {
                status.textContent = 'Active now';
                status.className = 'chat-header-status online';
            } else if (conv.lastSeen) {
                status.textContent = 'Active ' + ChatUtils.timeAgo(conv.lastSeen);
                status.className = 'chat-header-status';
            } else {
                status.textContent = conv.isGroup ? conv.handle : '';
                status.className = 'chat-header-status';
            }
        }

        if (avi) {
            avi.style.background = ChatUtils.avatarGrad(conv.name);
            avi.innerHTML = conv.avatar
                // adding the user profile and name and intails
                ? `<img src="${conv.profile.url}" alt="${conv.name}"/>`
                : `<img src="https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg" alt="profile">`
        }
    }

    return {
        renderAll,
        appendMessage,
        addReaction,
        removeReaction,
        deleteMsg,
        showTyping,
        hideTyping,
        openLightbox,
        updateHeader,
    };
})();