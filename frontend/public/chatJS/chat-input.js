/* ════════════════════════════════════════
   chat-input.js — input, emoji, media, reply
════════════════════════════════════════ */

const ChatInput = (() => {

  const EMOJI_DATA = {
    'Smileys': ['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🤔', '😴', '🥳', '😇', '🤗', '😏', '😤', '🙄', '😬', '🤪'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '❣️', '💟', '♥️'],
    'Hands': ['👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '👋', '🤙', '💪', '🙏', '👈', '👉', '☝️', '👆', '✋', '🤚'],
    'Objects': ['🔥', '⭐', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🎯', '💡', '❤️‍🔥', '🌊', '🌸', '🍕', '🎵', '🚀', '💎', '🌟'],
  };

  let activeCat = 'Smileys';
  let simTypingTimer = null;

  function init() {
    const textarea = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const likeSend = document.getElementById('likeSendBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const mediaBtn = document.getElementById('mediaBtn');
    const mediaInput = document.getElementById('mediaInput');

    if (!textarea) return;

    // build emoji panel
    buildEmojiPanel();

    // textarea events
    textarea.addEventListener('input', () => {
      autoResize(textarea);
      updateSendButton(textarea.value.trim());
    });

    textarea.addEventListener('keydown', e => {
      if (ChatState.settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendTextMessage();
      }
    });

    // send button
    if (sendBtn) sendBtn.onclick = () => sendTextMessage();
    if (likeSend) likeSend.onclick = () => sendLike();

    // emoji
    {
      // open emoji
      if (emojiBtn) {
        emojiBtn.onclick = e => {
          e.stopPropagation();
          const panel = document.getElementById('emojiPanel');
          if (panel) panel.classList.toggle('show');
        };
      }

      // close emoji on outside click
      document.addEventListener('click', e => {
        const panel = document.getElementById('emojiPanel');
        if (panel && !panel.contains(e.target) && e.target !== emojiBtn) {
          panel.classList.remove('show');
        }
      });
    }

    // media
    if (mediaBtn) mediaBtn.onclick = () => mediaInput?.click();
    if (mediaInput) mediaInput.onchange = e => handleMediaUpload(e.target.files);
  }

  // ── SEND TEXT ──
  function sendTextMessage() {
    // this whole thing will be updated like updating the message on the browser and also the 
    // sending that message to backend ~>>>>>>>> API will be here 

    const convId = ChatState.getActiveId();
    if (!convId) return;
    const textarea = document.getElementById('msgInput');
    const text = textarea.value.trim();
    if (!text) return;

    const replyTo = ChatState.getReply();
    const msg = {
      id: ChatState.genId(),
      type: 'text',
      text,
      from: 'me',
      time: new Date().toISOString(),
      read: false,
      replyTo: replyTo || undefined,
    };

    ChatState.addMessage(convId, msg);
    ChatMessages.appendMessage(convId, msg);
    ChatSidebar.updatePreview(convId);
    clearReply();

    textarea.value = '';
    autoResize(textarea);
    updateSendButton('');

    // simulate reply
    simulateReply(convId);

    // ── YOUR FETCH GOES HERE ──
    // fetch('/api/message/send', { method:'POST', credentials:'include',
    //   headers:{'Content-Type':'application/json'},
    //   body: JSON.stringify({ conversationId: convId, text, replyTo: replyTo?._id }) });
  }

  // ── SEND LIKE ──
  function sendLike() {

    // send like it is just a message nothing else new in the chat
    // sending as a text to the backend and also like 


    const convId = ChatState.getActiveId();
    if (!convId) return;
    const msg = {
      id: ChatState.genId(),
      type: 'text',
      text: '❤️',
      from: 'me',
      time: new Date().toISOString(),
      read: false,
    };
    ChatState.addMessage(convId, msg);
    ChatMessages.appendMessage(convId, msg);
    ChatSidebar.updatePreview(convId);
  }

  // ── HANDLE MEDIA ──
  function handleMediaUpload(files) {
    // this will be handling the media files which will be uploaded


    const convId = ChatState.getActiveId();
    if (!files.length || !convId) return;


    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const msg = {
          id: ChatState.genId(),
          type: 'image',
          url: e.target.result,
          from: 'me',
          time: new Date().toISOString(),
          read: false,
        };
        ChatState.addMessage(convId, msg);
        ChatMessages.appendMessage(convId, msg);
        ChatSidebar.updatePreview(convId);
      };
      reader.readAsDataURL(file);

      // ── YOUR UPLOAD FETCH GOES HERE ──
      // const formData = new FormData();
      // formData.append('image', file);
      // formData.append('conversationId', convId);
      // fetch('/api/message/send-media', { method:'POST', credentials:'include', body: formData });
    });

    // reset
    document.getElementById('mediaInput').value = '';
  }

  // ── REPLY ──
  function setReply(msgId) {
    const conv = ChatState.getActiveConv();
    if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg) return;

    ChatState.setReply(msg);
    const bar = document.getElementById('replyBar');
    const barText = document.getElementById('replyBarText');
    const barUser = document.getElementById('replyBarUser');
    if (bar && barText && barUser) {
      barUser.textContent = msg.from === 'me' ? 'You' : conv.name;
      barText.textContent = msg.type === 'image' ? '📷 Photo' : msg.text;
      bar.classList.add('show');
    }
    document.getElementById('msgInput')?.focus();
  }

  function clearReply() {
    ChatState.clearReply();
    const bar = document.getElementById('replyBar');
    if (bar) bar.classList.remove('show');
  }

  // ── SIMULATE REPLY ──
  function simulateReply(convId) {
    clearTimeout(simTypingTimer);
    const delay = 1200 + Math.random() * 1800;
    simTypingTimer = setTimeout(() => {
      if (ChatState.getActiveId() !== convId) return;
      ChatMessages.showTyping();
      simTypingTimer = setTimeout(() => {
        ChatMessages.hideTyping();
        const replies = [
          'Got it! 👍', 'Haha yeah 😂', 'That makes sense!',
          'Interesting...', 'I agree!', 'Okay!', '❤️', 'Sure thing!',
          'Can you tell me more?', 'That is amazing!', 'Nice one!'
        ];
        const text = replies[Math.floor(Math.random() * replies.length)];
        const msg = {
          id: ChatState.genId(),
          type: 'text',
          text,
          from: 'them',
          time: new Date().toISOString(),
          read: true,
        };
        ChatState.addMessage(convId, msg);
        ChatMessages.appendMessage(convId, msg);
        ChatSidebar.updatePreview(convId);
      }, 1000 + Math.random() * 1000);
    }, delay);
  }

  // ── EMOJI PANEL ──
  function buildEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    if (!panel) return;
    renderEmojiCat(activeCat);
  }

  function renderEmojiCat(cat) {
    activeCat = cat;
    const panel = document.getElementById('emojiPanel');
    if (!panel) return;

    const cats = Object.keys(EMOJI_DATA);
    const emojis = EMOJI_DATA[cat];

    panel.innerHTML = `
      <div class="emoji-categories">
        ${cats.map(c => `<button class="emoji-cat-btn${c === cat ? ' active' : ''}" onclick="ChatInput.switchEmojiCat('${c}')">${c}</button>`).join('')}
      </div>
      <div class="emoji-grid">
        ${emojis.map(e => `<button class="emoji-btn" onclick="ChatInput.insertEmoji('${e}')">${e}</button>`).join('')}
      </div>`;
  }

  function switchEmojiCat(cat) { renderEmojiCat(cat); }

  function insertEmoji(emoji) {
    const textarea = document.getElementById('msgInput');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.slice(0, start) + emoji + val.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.focus();
    updateSendButton(textarea.value.trim());
  }

  // ── HELPERS ──
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function updateSendButton(text) {
    const sendBtn = document.getElementById('sendBtn');
    const likeBtn = document.getElementById('likeSendBtn');
    if (!sendBtn || !likeBtn) return;
    if (text) {
      sendBtn.style.display = 'flex';
      likeBtn.style.display = 'none';
    } else {
      sendBtn.style.display = 'none';
      likeBtn.style.display = 'flex';
    }
  }

  return { init, setReply, clearReply, insertEmoji, switchEmojiCat, sendTextMessage };
})();