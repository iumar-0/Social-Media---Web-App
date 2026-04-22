/* ════════════════════════════════════════
   chat-state.js — global state + mock data
════════════════════════════════════════ */

const ChatState = (() => {

    // ── MOCK DATA ──
    const CONVERSATIONS = [
        {
            id: 'c2',
            name: 'Ali Hassan',
            handle: '@ali.dev',
            initials: 'AH',
            avatar: null,
            online: false,
            lastSeen: '2026-03-19T08:00:00Z',
            unread: 0,
            muted: false,
            messages: [
                { id: 'm1', reaction: "😂", type: 'text', text: 'Bhai the API is working now', from: 'them', time: '2026-03-18T14:00:00Z', read: true },
                { id: 'm2', type: 'text', text: 'The issue was in the middleware', from: 'them', time: '2026-03-18T14:01:00Z', read: true },
                { id: 'm3', type: 'text', text: 'Oh great! I was going crazy debugging it 😅', from: 'me', time: '2026-03-18T14:05:00Z', read: true },
                { id: 'm4', type: 'text', replyTo: { text: "Bhai the API is working now" }, text: 'req.user was undefined because the auth middleware wasn\'t running first req.user was undefined because the auth middleware wasn\'t running first', from: 'them', time: '2026-03-18T14:06:00Z', read: true },
                { id: 'm5', replyTo: { text: "Bhai the API is working now " }, type: 'text', text: 'Classic 😂 Thanks for sorting it out', from: 'me', time: '2026-03-18T14:08:00Z', read: true },
                { id: 'm6', type: 'text', text: 'No problem. Deploy when ready', from: 'them', time: '2026-03-18T14:10:00Z', read: true },
            ]
        },
        {
            id: 'c1',
            name: 'Sarah Ahmed',
            handle: '@sarah.ahmed',
            initials: 'SA',
            avatar: null,
            online: true,
            lastSeen: null,
            unread: 2,
            muted: false,
            messages: [
                { id: 'm1', type: 'text', text: 'Hey! Did you see the new update?', from: 'them', time: '2026-03-19T09:10:00Z', read: true },
                { id: 'm2', replyTo: "m1", type: 'text', text: 'Yeah it looks amazing! 🔥', from: 'me', time: '2026-03-19T09:12:00Z', read: true },
                { id: 'm3', type: 'text', text: 'The new chat features are insane', from: 'them', time: '2026-03-19T09:13:00Z', read: true },
                { id: 'm5', type: 'text', text: 'Look at this photo I took yesterday', from: 'them', time: '2026-03-19T09:14:30Z', read: true },
                { id: 'm6', type: 'text', text: 'Wow that is beautiful! Where was that?', from: 'me', time: '2026-03-19T09:16:00Z', read: true },
                { id: 'm7', type: 'text', text: 'Near the old bridge downtown', from: 'them', time: '2026-03-19T09:17:00Z', read: true },
                { id: 'm8', type: 'text', text: 'We should go there sometime!', from: 'me', time: '2026-03-19T09:18:00Z', read: true },
                { id: 'm9', type: 'text', text: 'Definitely 😊', from: 'them', time: '2026-03-19T09:18:30Z', read: false },
                { id: 'm10', type: 'text', text: 'Are you free this weekend?', from: 'them', time: '2026-03-19T10:30:00Z', read: false },
                { id: 'm4', type: 'image', url: 'https://picsum.photos/seed/chat1/400/300', from: 'them', time: '2026-03-27T09:14:00Z', read: true },
                { id: 'm1', type: 'text', text: 'Hey! Did you see the new update?', from: 'them', time: '2026-03-19T09:10:00Z', read: true },
                { id: 'm2', type: 'text', text: 'Yeah it looks amazing! 🔥', from: 'me', time: '2026-03-19T09:12:00Z', read: true },
                { id: 'm3', type: 'text', text: 'The new chat features are insane', from: 'them', time: '2026-03-19T09:13:00Z', read: true },
                { id: 'm5', type: 'text', text: 'Look at this photo I took yesterday', from: 'them', time: '2026-03-19T09:14:30Z', read: true },
                { id: 'm6', type: 'text', text: 'Wow that is beautiful! Where was that?', from: 'me', time: '2026-03-19T09:16:00Z', read: true },
                { id: 'm7', type: 'text', text: 'Near the old bridge downtown', from: 'them', time: '2026-03-19T09:17:00Z', read: true },
                { id: 'm8', type: 'text', text: 'We should go there sometime!', from: 'me', time: '2026-03-19T09:18:00Z', read: true },
                { id: 'm9', type: 'text', text: 'Definitely 😊', from: 'them', time: '2026-03-19T09:18:30Z', read: false },
                { id: 'm10', type: 'text', text: 'Are you free this weekend?', from: 'them', time: '2026-03-19T10:30:00Z', read: false },
                { id: 'm4', type: 'image', url: 'https://picsum.photos/seed/chat1/400/300', from: 'them', time: '2026-03-27T09:14:00Z', read: true },
            ]
        },
        {
            id: 'c3',
            name: 'Zara Khan',
            handle: '@zara.k',
            initials: 'ZK',
            avatar: null,
            online: true,
            lastSeen: null,
            unread: 1,
            muted: true,
            messages: [
                { id: 'm1', type: 'text', text: 'Did you finish the assignment?', from: 'them', time: '2026-03-19T07:00:00Z', read: true },
                { id: 'm2', type: 'text', text: 'Almost done, just the last section', from: 'me', time: '2026-03-19T07:30:00Z', read: true },
                { id: 'm3', type: 'text', text: 'Cool let me know when you\'re done!', from: 'them', time: '2026-03-19T08:00:00Z', read: false },
            ]
        },
        {
            id: 'c4',
            name: 'Dev Team 🚀',
            handle: 'Group · 5 members',
            initials: 'DT',
            avatar: null,
            online: false,
            lastSeen: null,
            unread: 0,
            muted: false,
            isGroup: true,
            messages: [
                { id: 'm1', type: 'text', text: 'PR is merged ✅', from: 'them', senderName: 'Umar', time: '2026-03-18T18:00:00Z', read: true },
                { id: 'm2', type: 'text', text: 'Nicely done!', from: 'me', time: '2026-03-18T18:05:00Z', read: true },
                { id: 'm3', type: 'text', text: 'Next sprint starts Monday', from: 'them', senderName: 'Ali', time: '2026-03-18T18:10:00Z', read: true },
            ]
        },
        {
            id: 'c5',
            name: 'Fatima Malik',
            handle: '@fatima.m',
            initials: 'FM',
            avatar: null,
            online: false,
            lastSeen: '2026-03-27T06:00:00Z',
            unread: 0,
            muted: false,
            messages: [
                { id: 'm1', type: 'text', text: 'Thanks for the notes!', from: 'them', time: '2026-03-17T20:00:00Z', read: true },
                { id: 'm2', type: 'text', text: 'No worries anytime 😊', from: 'me', time: '2026-03-17T20:30:00Z', read: true },
            ]
        }
    ];

    // ── SETTINGS STATE ──
    const SETTINGS = {
        theme: 'dark',
        notifications: true,
        readReceipts: true,
        onlineStatus: true,
        soundEnabled: true,
        enterToSend: true,
    };

    // ── RUNTIME STATE ──
    let activeConvId = null;
    let replyTo = null;
    let typingTimers = {};
    let searchQuery = '';

    return {
        get conversations() { return CONVERSATIONS; },
        get settings() { return SETTINGS; },

        getConv(id) { return CONVERSATIONS.find(c => c.id === id); },
        getActiveConv() { return activeConvId ? this.getConv(activeConvId) : null; },

        setActiveConv(id) { activeConvId = id; },
        getActiveId() { return activeConvId; },

        setReply(msg) { replyTo = msg; },
        getReply() { return replyTo; },
        clearReply() { replyTo = null; },

        setSearchQuery(q) { searchQuery = q; },
        getSearchQuery() { return searchQuery; },

        updateSetting(key, val) { SETTINGS[key] = val; },

        addMessage(convId, msg) {
            const conv = this.getConv(convId);
            if (conv) conv.messages.push(msg);
        },

        markAllRead(convId) {
            const conv = this.getConv(convId);

            // marking all the messages to read from false to true
            // but we will change this line to the database after adding live changing >>>>>> API working
            if (conv) {
                conv.unread = 0;
                conv.messages.forEach(m => m.read = true);
            }
        },

        genId() { return 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); },

        filteredConversations() {
            // if search query is empty return coversation otherwise return filtered
            if (!searchQuery) return CONVERSATIONS;

            // only returing the searches
            const q = searchQuery.toLowerCase();
            return CONVERSATIONS.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q));
        }
    };
})();