let selectedImages = [];
const fetchURL = {
    POST_ADD_URL: "http://localhost:3000/v1/post/upload",
    POST_GET_URL: "http://localhost:3000/v1/post/all",
    POST_LIKE_URL: "http://localhost:3000/v1/post/like",
}


const postCardBody = document.querySelector(".user-post-main-div");
const templatePost = document.querySelector("#post-template");


window.addEventListener('DOMContentLoaded', () => {
});

function hideSkeleton() {
    ['sk1', 'sk2', 'sk3'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
}

// ── RENDER ──
function renderPosts() {

}

function buildCard(post) {
    if (!post) {
        console.log("no post uploaded uet by anyone");
        return
    }
    post.forEach(postsData => {
        let templateClone = templatePost.content.cloneNode(true);
        templateClone.querySelector("#post-img-url").src = postsData.images[0].url;
        templateClone.querySelector("#caption-text").textContent = postsData.content;
        let likeCount = templateClone.querySelector("[data-field='like-count']");

        templateClone.querySelector(".like-btn").onclick = () => {
            toggleLike(postsData.userID, postsData._id, likeCount);
        }
        let commentCount = templateClone.querySelector("[data-field='comment-count']");
        commentCount.textContent = postsData.commentCount;
        let postCardId = postsData._id;

        templateClone.querySelector("[data-field='comment-btn']").onclick = () => {
            openComments(postCardId);
        }
        postCardBody.appendChild(templateClone);
    })
    hideSkeleton();
}



// ── LIKE ──
async function toggleLike(userid, postid, likeCountText) {
    let response = await fetch(fetchURL.POST_LIKE_URL, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userID: userid, postID: postid })
    });

    let output = await response.json();
    console.log(output);

    likeCountText.textContent = output.data;
}

// ── COMMENTS ──
// function openComments(postId) {
//     currentPostId = postId;

//     // clear old comments from screen
//     document.querySelectorAll('.comment-item').forEach(c => c.remove());
//     document.getElementById('commentsEmpty').style.display = 'block';

//     // open drawer
//     document.getElementById('commentOverlay').classList.add('open');
//     document.getElementById('commentDrawer').classList.add('open');
//     document.getElementById('commentInput').value = '';
//     setTimeout(() => document.getElementById('commentInput').focus(), 400);
// }

// function closeComments() {
//     currentPostId = null;
//     document.getElementById('commentOverlay').classList.remove('open');
//     document.getElementById('commentDrawer').classList.remove('open');
// }

// function buildComment(c) {


//     const div = document.createElement('div');
//     div.className = 'comment-item';
//     div.innerHTML = `
//     <div class="comment-avi">${c.initials}</div>
//     <div class="comment-body">
//         <div class="comment-user">${esc(c.user)}</div>
//         <div class="comment-text">${esc(c.text)}</div>
//     </div>`;
//     return div;
// }

// async function sendComment() {
//     const input = document.getElementById('commentInput');
//     const text = input.value.trim();
//     if (!text || !currentPostId) return;

//     try {
//         const response = await fetch(fetchURL.POST_COMMENT_URL, {
//             method: 'POST',
//             credentials: 'include',
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 postID: currentPostId,
//                 comment: text
//             })
//         });

//         const output = await response.json();

//         // only add to screen if backend says success
//         if (output.success) {
//             buildComment({
//                 user: output.data.username,  // adjust to your response shape
//                 initials: output.data.username.charAt(0).toUpperCase(),
//                 text: text
//             });

//             // update comment count on that post card
//             const cc = document.getElementById('cc-' + currentPostId);
//             if (cc) cc.textContent = parseInt(cc.textContent || 0) + 1;

//             input.value = '';
//             input.style.height = 'auto';
//         } else {
//             console.error('Comment failed:', output.message);
//         }

//     } catch (err) {
//         console.error('Comment error:', err);
//     }
// }

// ── OPEN COMMENTS ──
async function openComments(postId) {
    currentPostId = postId;

    // reset drawer
    document.querySelectorAll('.comment-item').forEach(c => c.remove());
    document.getElementById('commentsEmpty').style.display = 'none';
    document.getElementById('commentsLoading').style.display = 'block';
    document.getElementById('drawerCommentCount').textContent = '';
    document.getElementById('commentInput').value = '';

    // open drawer
    document.getElementById('commentOverlay').classList.add('open');
    document.getElementById('commentDrawer').classList.add('open');

    // fetch existing comments from backend
    try {
        const res = await fetch(`http://localhost:3000/v1/post/comment/${postId}`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();

        document.getElementById('commentsLoading').style.display = 'none';

        if (data.success && data.data.length > 0) {
            data.data.forEach(c => buildComment({
                text: c.comment,
                time: timeAgo(c.createdAt)
            }));
            document.getElementById('drawerCommentCount').textContent = `(${data.data.length})`;
        } else {
            document.getElementById('commentsEmpty').style.display = 'block';
        }

    } catch (err) {
        document.getElementById('commentsLoading').style.display = 'none';
        document.getElementById('commentsEmpty').style.display = 'block';
        console.error('Failed to load comments:', err);
    }

    setTimeout(() => document.getElementById('commentInput').focus(), 400);
}

// ── CLOSE COMMENTS ──
function closeComments() {
    currentPostId = null;
    document.getElementById('commentOverlay').classList.remove('open');
    document.getElementById('commentDrawer').classList.remove('open');
}

// ── SEND COMMENT ──
async function sendComment() {
    const input = document.getElementById('commentInput');
    const sendBtn = document.getElementById('sendBtn');
    const text = input.value.trim();

    if (!text || !currentPostId) return;

    // disable button while sending
    sendBtn.classList.add('loading');

    try {
        const res = await fetch('http://localhost:3000/v1/post/comment', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postID: currentPostId, comment: text })
        });
        const data = await res.json();

        if (data.success) {
            // add to screen only for this user on success
            buildComment({
                text: data.data.comment,
                time: 'Just now'
            });

            // update comment count badge on post card
            const cc = document.getElementById('cc-' + currentPostId);
            if (cc) cc.textContent = parseInt(cc.textContent || 0) + 1;

            // update drawer count
            const countEl = document.getElementById('drawerCommentCount');
            const current = parseInt(countEl.textContent.replace(/\D/g, '') || 0);
            countEl.textContent = `(${current + 1})`;

            input.value = '';
            input.style.height = 'auto';
        } else {
            console.error('Failed:', data);
        }

    } catch (err) {
        console.error('Send comment error:', err);
    }

    sendBtn.classList.remove('loading');
}

// ── BUILD COMMENT (from template) ──
function buildComment(c) {
    const tmpl = document.getElementById('comment-template');
    const clone = tmpl.content.cloneNode(true);
    const empty = document.getElementById('commentsEmpty');
    const list = document.getElementById('commentsList');

    clone.querySelector('[data-field="initials"]').textContent = c.initials;
    clone.querySelector('[data-field="username"]').textContent = c.username;
    clone.querySelector('[data-field="text"]').textContent = c.text;
    clone.querySelector('[data-field="time"]').textContent = c.time || '';

    empty.style.display = 'none';
    list.appendChild(clone);
    list.scrollTop = list.scrollHeight;
}

// ── TIME AGO HELPER ──
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}


// ── UPLOAD MODAL ──
function openUpload() {
    document.getElementById("fileInput").value = "";
    document.getElementById('postDesc').value = '';
    document.getElementById('modalOverlay').classList.add('open');
}


function closeUpload() {
    document.getElementById('modalOverlay').classList.remove('open');
}

function handleModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeUpload();
}

function resetDropZone() {
}

function handleFiles(files) {
}

let descInput = document.querySelector("#captionTxt");

async function submitPost() {
    let images = imageInput.files;

    let submitForm = new FormData();
    Array.from(images).forEach(value => submitForm.append("image", value));
    submitForm.append("description", descInput.value);

    let response = await fetch(fetchURL.POST_ADD_URL, {
        method: "POST",
        headers: {
            "Accept": "application/json"
        },
        credentials: "include",
        body: submitForm
    });

    let output = await response.json();
    console.log(output);

    if (!output.success) {

    } else if (output.success) {
        let templateClone = templatePost.content.cloneNode(true);
        templateClone.querySelector("#post-img-url").src = output?.data.images[0].url;
        templateClone.querySelector("#caption-text").textContent = output?.data.content;
        postCardBody.appendChild(templateClone);
        hideSkeleton();
    }


}

// ── THEME ──
document.addEventListener("DOMContentLoaded", async (dets) => {
    let themeChecking = localStorage.getItem("social-media-theme");
    if (themeChecking === "dark") {
        const html = document.documentElement;
        html.setAttribute('data-theme', 'dark');
        document.getElementById('theme-icon').innerHTML = `< circle cx = "12" cy = "12" r = "5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12"
        y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64"
        y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"
        /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12"
        x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"
        /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />`
    }

    let responseFetchPost = await fetch(fetchURL.POST_GET_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });
    let output = await responseFetchPost.json();
    console.log(output);

    buildCard(output.data);
});


