const BASE_URL = "http://localhost:3000/v1";

const SOCKET_EVENTS = {
    POST_LIKE_UPDATE: 'post:like-update',
    FOLLOW_COUNT_UPDATE: 'profile:follow-update',
    UNFOLLOW_COUNT_UPDATE: 'profile:unfollow-update',
};

document.querySelector("#profile-button").onclick = () => {
    updateProfilePageLinkUsername(inputUsername.value)
}


const socket = io("http://localhost:3000",
    { withCredentials: true }
);

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (error) => {
    console.log(error);

    if (error.message === "TOKEN_NOT_FOUND" || error.message === "TOKEN_EXPIRED") {
        window.location.replace("/login.html");
    }
});

socket.on("post:like-update", (response) => {
    const likeGrid = document.getElementById(`like-grid-${response.post}`);
    if (!likeGrid) return;
    likeGrid.textContent = response.like;

    const likePostModal = document.getElementById(`like-post-${response.post}`);
    if (!likePostModal) return
    likePostModal.textContent = response.like;
});

const profileSocket = io("http://localhost:3000/profile",
    { withCredentials: true }
);

profileSocket.on("profile:follow-state-update", (response) => {
    let profileCheck = document.getElementById(`profile-${response.profileID}`);
    if (!profileCheck) return;
    document.getElementById("statFollowing").textContent = response.followingCount;
    document.getElementById("statFollowers").textContent = response.followersCount;
});


// ══════════════════════════════════
// STATE
// ══════════════════════════════════
let profileData = null;
let userPosts = [];
let currentPostId = null;
let isFollowing = false
let isPending = false
let isPrivate = false
let profileID = null
let ownProfile = null;
let parmasUsername = null;
const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg";


const postModaltemplate = document.querySelector('#postTemplate');



// ══════════════════════════════════
// INIT — on page load
// ══════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    let username = params.get("username");
    if (!username) {
        return history.back();
    }
    parmasUsername = username;

    loadProfile(username);
});

// ══════════════════════════════════
// LOAD PROFILE
// ══════════════════════════════════
async function loadProfile(username) {

    const response = await fetch(BASE_URL + `/user/profile/${username}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
        credentials: 'include'
    });

    const output = await response.json();
    // console.log(output);

    if (!verifingTokenVerfication(output)) return console.log("User Token Expired");
    if (!output.success) {

        document.getElementById("profilePage").classList.add("display-none");
        document.getElementById("profile-not-found").classList.remove("display-none");

        return
    }


    let { profile, posts, isOwnProfile, mapToSidebarProfile } = output.data;
    profileData = profile;
    userPosts = posts;

    sideBarMenuProfile(mapToSidebarProfile);

    if (isOwnProfile) {
        ownProfile = isOwnProfile;
        return handleOwnerProfile();
    }

    isFollowing = output.data.isFollowing;
    profileID = output.data.profile._id
    isPrivate = output.data.isPrivate || false
    isFollowing = output.data.isFollowing || false
    isPending = output.data.isPending;

    updateFollowBtn()

    if (isFollowing && isPrivate) {

        return handleFollowedProfile();
    } else if (isPrivate) {

        return handlePrivateProfile();
    } else {

        return handlePublicProfile();
    }
}

function handleOwnerProfile() {
    try {
        renderProfile(profileData);

        // only setting shown for owner profile
        document.getElementById("owner-profile-setting").classList.remove("display-none");
        document.getElementById("profile-follow-message").classList.add("display-none");

        // render posts grid
        renderGrid(userPosts)

    } catch (error) {
        console.log(error);
    }
}

function handlePublicProfile() {
    try {

        renderProfile(profileData);
        // hidding setting of own profile icon
        document.getElementById("owner-profile-setting").classList.add("display-none");
        document.getElementById("profile-follow-message").classList.remove("display-none");
        document.getElementById("profile-private").classList.add("display-none");
        renderGrid(userPosts);

    } catch (error) { console.log(error); }
}

function handleFollowedProfile() {
    renderProfile(profileData)
    document.getElementById("profile-private").classList.add("display-none");
    document.getElementById("profile-follow-message").classList.remove("display-none");
    document.querySelector("#followBtn span").textContent = "Following";
    renderGrid(userPosts);
}

function handlePrivateProfile() {
    renderProfile(profileData);
    document.getElementById('gridSkel').classList.add('display-none');
    document.getElementById('postGrid').classList.add('display-none');
    document.getElementById('postGrid').innerHTML = "";
    document.getElementById('profileTabs').classList.add('display-none');
    document.getElementById("profile-private").classList.remove("display-none");
}
// ══════════════════════════════════
// RENDER PROFILE HEADER
// ══════════════════════════════════
function renderProfile(user) {

    document.getElementById('profileHeaderSkel').classList.add('display-none');
    document.querySelector('.profile-header').classList.remove('display-none');
    document.getElementById('profileTabs').style.display = 'flex';

    document.querySelector('.profile-header').id = `profile-${user._id}`;
    // Profile avatar
    const img = document.getElementById('profileAvatarImg');
    if (user.profile?.url) {
        img.src = user.profile.url;
    } else {
        img.src = DEFAULT_PROFILE_IMAGE;
    }
    img.style.display = 'block';

    // verified badge
    document.getElementById('pfVerified').style.display = 'inline-flex';

    // text info
    document.getElementById('topbarTitle').textContent = user.username || 'Profile';
    document.getElementById('profileUsername').textContent = user.username || '';
    document.getElementById('profileFullName').textContent = user.name || '';
    document.getElementById('profileBio').textContent = user.bio || '';

    // stats
    document.getElementById('statPosts').textContent = formatNum(user.postsCount || 0);
    document.getElementById('statFollowers').textContent = formatNum(user.followersCount || 0);
    document.getElementById('statFollowing').textContent = formatNum(user.followingCount || 0);

    const btn = document.getElementById('followBtn')
    const label = btn.querySelector('.follow-label')

    // remove all states first
    btn.classList.remove('following', 'pending', 'own-profile');

    if (user.isOwnProfile) {

        // own profile → hide follow button, show edit button
        btn.style.display = 'none'

    } else if (isFollowing) {

        // active follower
        label.textContent = 'Following'
        btn.classList.add('following')

    } else if (isPending) {

        // request sent — waiting approval
        label.textContent = 'Requested'
        btn.classList.add('pending')

    } else {

        // not following
        label.textContent = 'Follow'

    }
}

function sideBarMenuProfile(userAccount) {
    document.querySelector('#profile-photo-header img').src = userAccount.profile;
    document.getElementById('profile-username-header').textContent = '@' + userAccount.username;
    document.getElementById('profile-name-header').textContent = userAccount.name;

    document.querySelector(".sb-profile").onclick = () => {
        updateProfilePageLinkUsername(userAccount.username)
    };

    document.querySelector("#profile-button").onclick = () => {
        updateProfilePageLinkUsername(userAccount.username)
    }
}

function updateProfilePageLinkUsername(username) {
    window.location.href = `/ profile.html ? username = ${username}`;
}

// ══════════════════════════════════
// RENDER GRID
// ══════════════════════════════════
function renderGrid(posts) {
    document.getElementById('gridSkel').classList.add('display-none');
    const grid = document.getElementById('postGrid');
    grid.classList.remove('display-none');
    grid.innerHTML = '';

    if (!posts.length) {
        grid.innerHTML = `<div class= "no-posts"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>No posts yet.</p></div> `;
        return;
    }

    posts.forEach((post, index) => {
        console.log(post);

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.id = `grid-post-${post._id}`;
        cell.dataset.postNumber = index;
        cell.onclick = () => openPostModal(post._id);

        // thumbnail — first image
        const firstImg = post.images?.[0];
        if (firstImg) {
            const isVideo = firstImg.url?.match(/\.(mp4|webm|ogg|mov)$/i);
            if (isVideo) {
                const vid = document.createElement('video');
                vid.src = firstImg.url; vid.muted = true;
                cell.appendChild(vid);
            } else {
                const img = document.createElement('img');
                img.src = firstImg.url;
                img.alt = 'post';
                img.loading = 'lazy';
                cell.appendChild(img);
            }
        }

        // hover overlay with like + comment count
        const overlay = document.createElement('div');
        overlay.className = 'grid-overlay';
        overlay.innerHTML = `
  <div class="grid-stat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
             <p id='like-grid-${post._id}'>  ${formatNum(post?.like || 0)}</p>
            </div>
        <div class="grid-stat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <p id='comment-grid-${post._id}'> ${formatNum(post.commentCount || 0)}</p>
        </div>`;
        cell.appendChild(overlay);

        // multi image badge
        if (post.images?.length > 1) {
            const badge = document.createElement('div');
            badge.className = 'grid-multi-badge';
            badge.innerHTML = `< svg width = "10" height = "10" viewBox = "0 0 24 24" fill = "none" stroke = "white" stroke - width="2.5" stroke - linecap="round" ><rect x="2" y="7" width="15" height="15" rx="2"/><path d="M22 2H7"/><path d="M22 2v15"/></svg > ${post.images.length} `;
            cell.appendChild(badge);
        }

        grid.appendChild(cell);
    });
}


// ══════════════════════════════════
// OPEN POST MODAL
// ══════════════════════════════════
function openPostModal(postId) {
    const overlay = document.getElementById('postModalOverlay');
    const inner = document.getElementById('postModalInner');
    const loading = document.getElementById('modalLoading');

    // clear previous post card, show loading
    inner.querySelectorAll('.post-card').forEach(c => c.remove());
    loading.style.display = 'flex';

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // find post in local array
    const post = userPosts.find(p => p._id === postId);

    loading.style.display = 'none';
    if (post) {
        const card = buildSingleCard(post);
        inner.appendChild(card);
    }
}

function closePostModal() {
    document.getElementById('postModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    closeComments();
}

function handleModalOutside(e) {
    if (e.target === document.getElementById('postModalOverlay')) closePostModal();
}
document.querySelector(".modal-menu-options", async (dets) => {

});

document.querySelector(".modal-menu-options-options", async (dets) => {

});



// ══════════════════════════════════
// BUILD SINGLE CARD (reuses template)
// Same logic as your home.html buildCard
// ══════════════════════════════════

function buildSingleCard(post) {
    const clone = postModaltemplate.content.cloneNode(true);
    const card = clone.querySelector('.post-card');
    card.id = 'modal-post-' + post._id;

    // header
    const user = post.userID;
    const username = user?.username || user?.name || 'Unknown';

    const profileImg = card.querySelector('.profile-photo-post');
    profileImg.src = user?.profile?.url || DEFAULT_PROFILE_IMAGE;
    if (!user?.profile?.url) profileImg.style.display = 'none';

    card.querySelector('.username-profile').textContent = username;
    card.querySelector('[data-field="time"]').textContent = getTimeAgo(post.createdAt);

    // carousel
    const images = post.images || [];
    const track = card.querySelector('[data-field="track"]');
    const dotsWrap = card.querySelector('[data-field="dots"]');
    const counter = card.querySelector('[data-field="counter"]');
    const btnPrev = card.querySelector('[data-field="arrow-left"]');
    const btnNext = card.querySelector('[data-field="arrow-right"]');
    const carousel = card.querySelector('[data-field="carousel"]');

    images.forEach(imgObj => {
        const slide = document.createElement('div');
        slide.className = 'pc-slide';
        const isVideo = imgObj.url?.match(/\.(mp4|webm|ogg|mov)$/i);
        if (isVideo) {
            const vid = document.createElement('video');
            vid.src = imgObj.url; vid.controls = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
            slide.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = imgObj.url; img.alt = 'post'; img.loading = 'lazy';
            slide.appendChild(img);
        }
        track.appendChild(slide);
    });

    if (images.length <= 1) {
        btnPrev.remove(); btnNext.remove(); dotsWrap.remove(); counter.remove();
    } else {
        let current = 0;
        counter.classList.add('visible');
        images.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'pc-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => goTo(i);
            dotsWrap.appendChild(dot);
        });
        const goTo = idx => {
            current = idx;
            track.style.transform = `translateX(-${current * 100} %)`;
            dotsWrap.querySelectorAll('.pc-dot').forEach((d, i) => d.classList.toggle('active', i === current));
            counter.textContent = `${current + 1} / ${images.length}`;
            btnPrev.disabled = current === 0;
            btnNext.disabled = current === images.length - 1;
        };
        btnPrev.onclick = () => { if (current > 0) goTo(current - 1); };
        btnNext.onclick = () => { if (current < images.length - 1) goTo(current + 1); };
        goTo(0);
    }


    // like
    const likeBtn = card.querySelector('[data-field="like-btn"]');
    const likeCount = card.querySelector('[data-field="like-count"]');
    likeBtn.id = 'modal-like-' + post._id;
    likeCount.id = 'like-post-' + post._id;
    likeCount.textContent = post.like || 0;
    likeBtn.dataset.postid = post._id;

    if (post.liked) likeBtn.classList.add('liked');

    likeBtn.onclick = e => {
        likeButton(likeBtn);
    }

    // comment
    const cBtn = card.querySelector('[data-field="comment-btn"]');
    const cCount = card.querySelector('[data-field="comment-count"]');
    cCount.textContent = post.commentCount || 0;
    cBtn.onclick = () => openComments(post._id);

    // caption
    if (post?.content) {
        const capDiv = card.querySelector('[data-field="caption"]');
        capDiv.classList.remove("display-none");
        capDiv.querySelector('[data-field="cap-user"]').textContent = username;
        capDiv.querySelector('[data-field="cap-text"]').textContent = post.content;
    }
    const postOptions = clone.querySelector(".modal-menu-options");
    (ownProfile) ? postOptions.classList.remove("display-none")
        : postOptions.innerHTML = "";
    if (ownProfile) postsOptionsModalClick(post._id, postOptions);
    return card;
}

function postsOptionsModalClick(postID, postsOptionsButton) {
    postsOptionsButton.querySelector(".modal-menu-options-options").dataset.postId = postID;
    postsOptionsButton.addEventListener("click", (dets) => {
        dets.currentTarget.querySelector(".modal-menu-options-options").classList.add("show");
        dets.currentTarget.querySelector(".modal-menu-options-options").classList.remove("display-none");

    });

    postsOptionsButton.querySelector(".modal-menu-options-options").addEventListener("click", async (dets) => {
        dets.currentTarget.disabled = true;
        dets.currentTarget.querySelector("div").classList.remove("display-none");
        dets.currentTarget.querySelector("p").classList.add("display-none");
        const isdeleted = await deletePost(dets.currentTarget.dataset.postId);
        if (!isdeleted) {
            dets.currentTarget.querySelector("div").classList.add("display-none");
            dets.currentTarget.querySelector("p").classList.remove("display-none");
            dets.currentTarget.disabled = false;
        }
        closePostModal();
    });
}

async function deletePost(postID) {
    let response = await fetch(BASE_URL + `/post/${postID}/delete`, {
        method: "DELETE",
        credentials: "include"
    });

    let output = await response.json();
    console.log(output);

    if (!output?.success) {
        showToast(output.message, "error");
        return false
    }

    let deletePostGrid = document.querySelector(`#grid-post-${postID}`);
    console.log(deletePostGrid);

    if (!deletePostGrid) return true

    deletePostGrid.remove();
    userPosts.splice(deletePostGrid.dataset.postNumber, 1);
    if (!userPosts.length) {
        document.querySelector("#postGrid").innerHTML = `<div class= "no-posts"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>No posts yet.</p></div> `;
    }
    document.querySelector("#statPosts").textContent = userPosts.length;
    return true
}
// ══════════════════════════════════
// COMMENTS
// ══════════════════════════════════
// ─────────────────────────────
// Open Comments Drawer
// ─────────────────────────────
async function openComments(postId) {
    currentPostId = postId
    currentReplyID = null

    // clear old comments
    document.querySelectorAll('.comment-item').forEach(c => c.remove())
    document.querySelectorAll('.reply-item').forEach(r => r.remove())
    document.getElementById('commentsEmpty').style.display = 'block'
    document.getElementById('commentInput').value = ''
    document.getElementById('commentInput').placeholder = 'Add a comment...'

    // open drawer
    document.getElementById('drawerOverlay').classList.add('open')
    document.getElementById('commentDrawer').classList.add('open')

    // fetch comments from API
    try {
        const response = await fetch(BASE_URL + `/comment/${postId}`, {
            credentials: 'include'
        })

        if (response.status === 401) {
            window.location.replace('/login.html')
            return
        }

        const output = await response.json()
        console.log(output);

        if (output.success && output.data.length) {
            output.data.forEach(comment => {
                buildComment(comment)

                if (comment.replies && comment.replies.length) {
                    comment.replies.forEach(reply => {
                        console.log({
                            comment: comment.comment,      // should be text string
                            username: comment.userID?.username,
                            profileUrl: comment.userID?.profile?.url
                        })
                        buildReply(reply)
                    })
                }
            })
        }

    } catch (error) {
        console.log(error)
    }

    setTimeout(() => document.getElementById('commentInput').focus(), 400)
}

// ─────────────────────────────
// Close Comments Drawer
// ─────────────────────────────
function closeComments() {
    currentPostId = null
    currentReplyID = null
    document.getElementById('drawerOverlay').classList.remove('open')
    document.getElementById('commentDrawer').classList.remove('open')
}

// ─────────────────────────────
// Build Top Level Comment
// ─────────────────────────────

function buildComment(c) {
    console.log(c);
    try {

        const list = document.getElementById('commentsList')
        document.getElementById('commentsEmpty').style.display = 'none'

        const initial = c.userID?.username?.charAt(0).toUpperCase() || '?'
        const username = c.userID?.username || 'Unknown'
        const name = c.userID?.name || ''
        const profileUrl = c.userID?.profile?.url

        const div = document.createElement('div')
        div.className = 'comment-item'
        div.dataset.commentId = c._id

        div.innerHTML = `
        <div class="comment-avi">
            ${profileUrl
                ? `<img src="${profileUrl}" alt="${username}" />`
                : initial
            }
        </div>
        <div class="comment-body">
        <div class="comment-user">${username}</div>
        <div class="comment-text">${c.comment}</div>
        <div class="comment-meta">
        <span class="comment-time-txt">${formatTime(c.createdAt)}</span>
        <button class="reply-btn" onclick="setReply('${c._id}', '${username}')">
        Reply
        </button>
        </div>
        </div>
        <div class="replies-container" id="replies-${c._id}"></div>
        `

        list.appendChild(div)
        list.scrollTop = list.scrollHeight
    } catch (error) {
        console.log(error);

    }
}

// ─────────────────────────────
// Build Reply
// ─────────────────────────────


function buildReply(reply) {
    // find parent replies container
    const container = document.getElementById(`replies-${reply.parentID}`)
    if (!container) return

    const initial = reply.userID?.username?.charAt(0).toUpperCase() || '?'
    const username = reply.userID?.username || 'Unknown'
    const profileUrl = reply.userID?.profile?.url

    const div = document.createElement('div')
    div.className = 'comment-item reply-item'
    div.dataset.commentId = reply._id

    div.innerHTML = `
        <div class="comment-avi small">
            ${profileUrl
            ? `<img src="${profileUrl}" alt="${username}" />`
            : initial
        }
        </div>
        <div class="comment-body">
            <div class="comment-user">${username}</div>
            <div class="comment-text">${reply.comment}</div>
            <div class="comment-meta">
                <span class="comment-time-txt">${formatTime(reply.createdAt)}</span>
            </div>
        </div>
    `

    container.appendChild(div)
}

// ─────────────────────────────
// Set Reply Target
// ─────────────────────────────
function setReply(commentId, username) {
    currentReplyID = commentId

    const input = document.getElementById('commentInput')
    input.placeholder = `Replying to @${username}...`
    input.focus()

    // show cancel reply button
    const cancelBtn = document.getElementById('cancelReply')
    if (cancelBtn) {
        cancelBtn.style.display = 'block'
        cancelBtn.onclick = cancelReply
    }
}

// ─────────────────────────────
// Cancel Reply
// ─────────────────────────────
function cancelReply() {
    currentReplyID = null
    document.getElementById('commentInput').placeholder = 'Add a comment...'

    const cancelBtn = document.getElementById('cancelReply')
    if (cancelBtn) cancelBtn.style.display = 'none'
}

// ─────────────────────────────
// Send Comment or Reply
// ─────────────────────────────
async function sendComment() {
    const input = document.getElementById('commentInput')
    const btn = document.getElementById('sendBtn')
    const text = input.value.trim()

    if (!text || !currentPostId) return

    btn.classList.add('loading')

    try {
        const response = await fetch(BASE_URL + '/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                postID: currentPostId,
                comment: text,
                parentID: currentReplyID || null  // null = comment, ID = reply
            })
        })

        if (response.status === 401) {
            window.location.replace('/login.html')
            return
        }

        const output = await response.json()

        if (!output.success) {
            showToast(output.message, 'error')
            return
        }

        // clear input
        input.value = ''
        input.style.height = 'auto'
        cancelReply()  // reset reply state

    } catch (error) {
        console.log(error)
    } finally {
        btn.classList.remove('loading')
    }
}

// ─────────────────────────────
// Socket — Receive New Comment
// ─────────────────────────────
socket.on("new-comment", (response) => {

    // ignore if drawer is not open for this post
    if (response.postID !== currentPostId) return

    if (response.comment.parentID) {
        buildReply(response.comment)   // it is a reply ✅
    } else {
        buildComment(response.comment) // it is a comment ✅
    }

    // update comment count on post card
    const cc = document.getElementById(`cc-${response.postID}`);
    if (cc) cc.textContent = parseInt(cc.textContent || 0) + 1

    // update drawer count
    const drawerCount = document.getElementById('drawerCount')
    if (drawerCount) {
        const current = parseInt(drawerCount.textContent.replace(/\D/g, '') || 0)
        drawerCount.textContent = `(${current + 1})`
    }
})

// ─────────────────────────────
// Format Time Helper
// ─────────────────────────────
function formatTime(dateString) {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)  // seconds

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
}

// ══════════════════════════════════
// TAB SWITCH
// ══════════════════════════════════
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (tab === 'liked') {
        showToast('Liked posts coming soon!');
    } else {
        renderGrid(userPosts);
    }
}

// ══════════════════════════════════
// THEME
// ══════════════════════════════════
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

// ══════════════════════════════════
// SIDEBAR
// ══════════════════════════════════
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sbOverlay').classList.toggle('open');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sbOverlay').classList.remove('open');
}

// ══════════════════════════════════
// HELPERS
// ══════════════════════════════════
function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function getTimeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}


let toastTimer;
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast ' + type; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// following button

async function toggleFollow(btn) {
    btn.classList.add('loading')
    btn.disabled = true;
    try {
        if (isFollowing || isPending) {
            // unfollow and delete request toogle

            const response = await fetch(BASE_URL + '/user/profile/unfollow', {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileID })
            })

            const output = await response.json();
            console.log(output);

            verifingTokenVerfication(output);

            if (output.success) {
                isFollowing = false
                isPending = false
            } else {
                showToast(output.message, 'error')
            }

        } else {
            // Follow or Send Rquest

            const response = await fetch(BASE_URL + '/user/profile/follow', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileID })
            })

            const output = await response.json()
            console.log(output);

            verifingTokenVerfication(output);
            if (output.success) {

                if (output.data.isPrivate) {
                    // private account → request sent
                    isPending = true;
                    isFollowing = false;

                    if (!isPrivate) {
                        console.log(`this will only work on without load priavate profiles after fetch`);
                        isPrivate = output.data.isPrivate;
                        handlePrivateProfile()
                    };
                } else {
                    // public account → following immediately
                    isFollowing = true;
                    isPending = false;
                    if (output.data.isPrivate !== isPrivate) {
                        console.log("loading the profile data when profile is becomes public");
                        loadProfile(parmasUsername)
                    };
                }
            } else {

                showToast(output.message, 'error')
            }
        }
    } catch (error) {
        console.log(error)
        showToast('Something went wrong', 'error')
    }
    btn.classList.remove('loading');
    updateFollowBtn();
    btn.disabled = false;

}

// ─────────────────────────
// Update button text
// ─────────────────────────


function updateFollowBtn() {
    const btn = document.getElementById('followBtn')
    const label = btn.querySelector('.follow-label')

    if (isFollowing) {
        label.textContent = 'Following'
        btn.classList.add('following')
        btn.classList.remove('pending')

    } else if (isPending) {
        label.textContent = 'Requested'
        btn.classList.add('pending')
        btn.classList.remove('following')

    } else {
        label.textContent = 'Follow'
        btn.classList.remove('following', 'pending')
    }
}

// verify user login dets
function verifingTokenVerfication(data) {
    if (!data.success && data?.errCode[0]?.render === "LOGIN_PAGE") {
        window.location.replace("/login.html");
        return false;
    }
    return true;
}


const postModalDiv = document.getElementById("postModalInner");

let lastTap = 0;

postModalDiv.addEventListener("pointerup", (e) => {
    let postClick = e.target.closest(".pc-carousel");
    if (!postClick) return;
    const postCard = e.target.closest(".post-card");

    const now = Date.now();

    if (now - lastTap < 300) {
        handleDoubleTap(postCard, postClick);
    }
    lastTap = now;
});