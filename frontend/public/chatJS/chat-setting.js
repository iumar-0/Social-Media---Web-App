/* ════════════════════════════════════════
   chat-settings.js — settings panel
════════════════════════════════════════ */

const ChatSettings = (() => {

  const THEMES = [
    { id: 'default', label: 'Default', colors: ['#0095f6', '#ffffff'] },
    { id: 'dark', label: 'Dark', colors: ['#0095f6', '#1a1a1a'] },
    { id: 'ocean', label: 'Ocean', colors: ['#0077b6', '#e8f4f8'] },
    { id: 'rose', label: 'Rose', colors: ['#e91e63', '#fff5f7'] },
    { id: 'midnight', label: 'Midnight', colors: ['#7c4dff', '#0f0f23'] },
  ];

  function open() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    renderPanel();
    panel.classList.add('open');
  }

  function close() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.remove('open');
  }

  function renderPanel() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    const conv = ChatState.getActiveConv();
    const s = ChatState.settings;

    panel.innerHTML = `
      <!-- header -->
      <div class="sp-header">
        <button class="ic-btn" onclick="ChatSettings.close()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <h3>Chat Info</h3>
      </div>

      <!-- profile -->
      ${conv ? `
      <div class="sp-profile">
        <div class="sp-avi" style="background:${ChatUtils.avatarGrad(conv.name)};">
          ${conv.avatar ? `<img src="${conv.avatar}" alt=""/>` : conv.initials}
        </div>
        <div class="sp-name">${conv.name}</div>
        <div class="sp-handle">${conv.handle}</div>
        ${conv.online ? `<div class="sp-online">● Active now</div>` : ''}
      </div>` : `
      <div class="sp-profile">
        <div class="sp-avi">⚙️</div>
        <div class="sp-name">Chat Settings</div>
      </div>`}

      <!-- THEMES -->
      <div class="sp-section">
        <div class="sp-section-title">Chat Theme</div>
        <div class="theme-picker">
          ${THEMES.map(t => `
            <div class="theme-swatch${s.theme === t.id ? ' active' : ''}"
              title="${t.label}"
              onclick="ChatSettings.applyTheme('${t.id}')"
              style="background:linear-gradient(135deg,${t.colors[0]},${t.colors[1]});">
            </div>`).join('')}
        </div>
        <div style="padding:0 18px 8px;font-size:12.5px;color:var(--ct-text-sec);">
          Active: <strong style="color:var(--ct-accent);">${THEMES.find(t => t.id === s.theme)?.label}</strong>
        </div>
      </div>

      <!-- NOTIFICATIONS -->
      <div class="sp-section">
        <div class="sp-section-title">Preferences</div>

        <div class="sp-item">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div>
              <div class="sp-item-text">Notifications</div>
              <div class="sp-item-sub">Mute this conversation</div>
            </div>
          </div>
          <button class="sp-toggle${s.notifications ? ' on' : ''}" id="tog-notif" onclick="ChatSettings.toggle('notifications','tog-notif')">
            <div class="sp-toggle-knob"></div>
          </button>
        </div>

        <div class="sp-item">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="sp-item-text">Read Receipts</div>
              <div class="sp-item-sub">Show when you've seen messages</div>
            </div>
          </div>
          <button class="sp-toggle${s.readReceipts ? ' on' : ''}" id="tog-read" onclick="ChatSettings.toggle('readReceipts','tog-read')">
            <div class="sp-toggle-knob"></div>
          </button>
        </div>

        <div class="sp-item">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"/></svg>
            </div>
            <div>
              <div class="sp-item-text">Online Status</div>
              <div class="sp-item-sub">Show when you're active</div>
            </div>
          </div>
          <button class="sp-toggle${s.onlineStatus ? ' on' : ''}" id="tog-online" onclick="ChatSettings.toggle('onlineStatus','tog-online')">
            <div class="sp-toggle-knob"></div>
          </button>
        </div>

        <div class="sp-item">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
            </div>
            <div>
              <div class="sp-item-text">Message Sounds</div>
              <div class="sp-item-sub">Play sound on new message</div>
            </div>
          </div>
          <button class="sp-toggle${s.soundEnabled ? ' on' : ''}" id="tog-sound" onclick="ChatSettings.toggle('soundEnabled','tog-sound')">
            <div class="sp-toggle-knob"></div>
          </button>
        </div>

        <div class="sp-item">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="5 12 12 5 19 12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
            </div>
            <div>
              <div class="sp-item-text">Enter to Send</div>
              <div class="sp-item-sub">Press Enter to send messages</div>
            </div>
          </div>
          <button class="sp-toggle${s.enterToSend ? ' on' : ''}" id="tog-enter" onclick="ChatSettings.toggle('enterToSend','tog-enter')">
            <div class="sp-toggle-knob"></div>
          </button>
        </div>
      </div>

      <!-- ACTIONS -->
      ${conv ? `
      <div class="sp-section">
        <div class="sp-section-title">Actions</div>
        <div class="sp-item" onclick="ChatUtils.showToast('Media coming soon!')">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div class="sp-item-text">View Photos &amp; Videos</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="sp-item" onclick="ChatUtils.showToast('Search coming soon!')">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div class="sp-item-text">Search in Conversation</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="sp-item danger" onclick="ChatUtils.showToast('Delete cleared!','error')">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </div>
            <div class="sp-item-text sp-danger">Delete Chat</div>
          </div>
        </div>
        <div class="sp-item danger" onclick="ChatUtils.showToast('Blocked!','error')">
          <div class="sp-item-left">
            <div class="sp-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <div class="sp-item-text sp-danger">Block User</div>
          </div>
        </div>
      </div>` : ''}`;
  }

  function applyTheme(themeId) {
    ChatState.updateSetting('theme', themeId);
    document.documentElement.setAttribute('data-chat-theme', themeId);
    // re-render to update active swatch
    renderPanel();
  }

  function toggle(key, btnId) {
    const newVal = !ChatState.settings[key];
    ChatState.updateSetting(key, newVal);
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle('on', newVal);
    ChatUtils.showToast(key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + (newVal ? ' on' : ' off'));
  }

  return { open, close, renderPanel, applyTheme, toggle };
})();