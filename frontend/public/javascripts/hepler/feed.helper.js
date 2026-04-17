// ══════════════════════════════════════════
// THEME
// ══════════════════════════════════════════
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

document.addEventListener("DOMContentLoaded", async () => {

    let responseFetchPost = await fetch(fetchURL.POST_GET_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });
    let output = await responseFetchPost.json();
    console.log(output);

    if (output.success) {
        buildCard(output.data.posts);
        updateProfilePageLinkUsername(output.data.mapToSidebarProfile)
    } else {

    }
});
