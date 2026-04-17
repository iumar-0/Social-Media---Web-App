// ── HELPER — covert the time to differen states
function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";

    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;

    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;

    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;

    return `${Math.floor(diff / 31536000)}y ago`;
}