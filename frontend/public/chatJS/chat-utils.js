/* ════════════════════════════════════════
   chat-utils.js — helper utilities
════════════════════════════════════════ */

const ChatUtils = (() => {

    // ── TIME ──
    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(dateStr).toLocaleDateString();
    }

    function formatTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(dateStr) {        
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function sameDay(d1, d2) {
        // console.log(d1,d2);
        
        const a = new Date(d1), b = new Date(d2);
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    // ── DOM ──
    function el(tag, cls, html = '') {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    function scrollToBottom(container, smooth = false) {
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
    }

    // ── TEXT ──
    function escapeHtml(str) {
        
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function linkify(text) {
        const escaped = escapeHtml(text);
        return escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--ct-accent);text-decoration:underline;">$1</a>');
    }

    // ── AVATAR colors ──
    const GRAD_COLORS = [
        'linear-gradient(135deg,#405de6,#5851db,#833ab4)',
        'linear-gradient(135deg,#f77737,#fcaf45,#ffdc80)',
        'linear-gradient(135deg,#833ab4,#c13584,#e1306c)',
        'linear-gradient(135deg,#f7971e,#ffd200)',
        'linear-gradient(135deg,#0095f6,#00c6ff)',
        'linear-gradient(135deg,#20bf55,#01baef)',
    ];

    function avatarGrad(name) {
        const idx = (name || 'A').charCodeAt(0) % GRAD_COLORS.length;
        return GRAD_COLORS[idx];
    }

    // ── TOAST ──
    function showToast(msg, type = '') {
        let t = document.getElementById('chatToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'chatToast';
            t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--ct-text-pri,#111);color:#fff;padding:10px 18px;border-radius:10px;font-size:13.5px;font-weight:500;z-index:999;opacity:0;transition:transform .35s,opacity .35s;pointer-events:none;white-space:nowrap;font-family:DM Sans,sans-serif;';
            document.body.appendChild(t);
        }
        t.textContent = msg;

        if (type === 'error') t.style.background = '#e63946';
        else t.style.background = 'var(--ct-accent,#0095f6)';
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';

        clearTimeout(t._timer);
        t._timer = setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateX(-50%) translateY(60px)';
        }, 2500);
    }

    return { timeAgo, formatTime, formatDate, sameDay, el, scrollToBottom, escapeHtml, linkify, avatarGrad, showToast };
})();