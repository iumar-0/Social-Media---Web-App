function socketAuthError(error) {
    console.log(error);

    if (error.message === "TOKEN_NOT_FOUND" || error.message === "TOKEN_EXPIRED") {
        window.location.replace("/login.html");
    }
}
// =====================
// Main socket connection
// =====================
const socket = io("http://localhost:3000",
    { withCredentials: true }
);
socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (error) => socketAuthError(error));


socket.on("post:like-update", (response) => {
    const likePostCard = document.getElementById(`like-post-${response.post}`);
    if (!likePostCard) return;
    likePostCard.textContent = response.like;
});
// =====================
// feed socket connection
// =====================
const feedSocket = io("http://localhost:3000/feed",
    { withCredentials: true }
);

feedSocket.on("feed:public-post-published", (response) => {
    console.log(response);
    buildCard(response.post);
});

feedSocket.on("connect_error", (error) => socketAuthError(error));

// states to keep the track of feed
let posts = [];
let currentPostId = null;
let allImages_or_vedio = [];
let allInputPostToBASE64 = [];
let activeInputFeildPost = 0;

const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg";
const skeletonLoader = document.querySelector("#sk1");
const emptyFeedMessage = document.querySelector("#emptyState");

const fetchURL = {
    POST_ADD_URL: "http://localhost:3000/v1/post/upload",
    POST_GET_URL: "http://localhost:3000/v1/post/all",
}

const uploadFormInput = {
    fileInput: document.querySelector("#fileInput"),
    addMoreFileInput: document.querySelector("#add-more-images-input-field"),
    postDescription: document.querySelector("#captionTxt"),
    locationAddPost: document.querySelector("#location-add-button"),
    tagPeopleAddPost: document.querySelector("#tag-people-post"),
    submitPostButton: document.getElementById('shareBtn'),
    // loader buttons
    uploadPostLoader: document.querySelector("#fabRing"),
    loaderToolTip: document.querySelector(".fab-tooltip"),
    uploadButtonPost: document.querySelector(".fab-btn")
}

function hideSkeleton() {
    ['sk1', 'sk2', 'sk3'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
}

function renderFeed() {
    document.querySelectorAll('.post-card').forEach(c => c.remove());
    const empty = document.getElementById('emptyState');
    if (!posts.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const feed = document.getElementById('feedWrap');
    [...posts].reverse().forEach(p => feed.insertBefore(buildCard(p), empty));
}

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


function autoResize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

function openUpload() {
    resetUpload();
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeUpload() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function handleModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeUpload();
}

function resetUpload() {
    allImages_or_vedio = [];
    allInputPostToBASE64 = [];
    activeInputFeildPost = 0;

    document.getElementById('captionTxt').value = '';
    document.getElementById('capCount').textContent = '0';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('previewArea').classList.remove('visible');
    document.getElementById('previewMainImg').src = '';
    document.getElementById('previewMainVid').src = '';
    document.getElementById('previewBadge').textContent = '';
    uploadFormInput.fileInput.value = "";
    uploadFormInput.addMoreFileInput.value = "";
    document.querySelector("#error-input-post").textContent = "";
    renderThumbs();
}

function handleFiles(files) {
    if (!files.length) return;
    allImages_or_vedio = Array.from(files);
    allInputPostToBASE64 = [];
    activeInputFeildPost = 0;

    // making all files to file reader base 64
    readAll(allImages_or_vedio)
        .then(srcs => {
            allInputPostToBASE64 = srcs;
            showPreview();
        });
}


function addMore(postDetails) {
    if (!postDetails.length) return;
    const newPost = Array.from(postDetails);

    readAll(newPost).then(newPostToBase64 => {
        allImages_or_vedio = [...allImages_or_vedio, ...newPost];
        allInputPostToBASE64 = [...allInputPostToBASE64, ...newPostToBase64];
        renderThumbs();
        updateBadge();
    });
}


function readAll(files) {
    return Promise.all(Array.from(files).map((f) => new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(f);
    })));
}


function showPreview() {
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('previewArea').classList.add('visible');
    setMainMedia(0);
    renderThumbs();
    updateBadge();
}


function setMainMedia(idx) {
    activeInputFeildPost = idx;

    const isVid = allImages_or_vedio[idx]?.type?.startsWith('video');
    const img = document.getElementById('previewMainImg');
    const vid = document.getElementById('previewMainVid');

    if (isVid) {
        img.style.display = 'none';
        vid.style.display = 'block';
        vid.src = allInputPostToBASE64[idx];
    }
    else {
        vid.style.display = 'none';
        img.style.display = 'block';
        img.style.opacity = 0;
        img.src = allInputPostToBASE64[idx];
        img.onload = () => {
            img.style.opacity = 1
        };

    }
    document.querySelectorAll('.thumb-item').forEach((t, i) => {
        // making the other previews none
        t.classList.toggle('active', i === idx)
    });
    updateBadge();
}

function renderThumbs() {

    const strip = document.getElementById('thumbStrip');
    const add = document.getElementById('thumbAdd');

    strip.querySelectorAll('.thumb-item').forEach(t => t.remove());

    // creating all the preview elements
    allInputPostToBASE64.forEach((src, i) => {

        const item = document.createElement('div');
        item.className = 'thumb-item' + (i === activeInputFeildPost ? ' active' : '');
        item.onclick = () => setMainMedia(i);
        const isVid = allImages_or_vedio[i]?.type?.startsWith('video');

        if (isVid) {
            const v = document.createElement('video');
            v.src = src;
            v.muted = true;
            item.appendChild(v);
        }
        else {
            const image = document.createElement('img');
            image.src = src;
            image.alt = '';
            item.appendChild(image);
        }
        // delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'thumb-rm';
        deleteButton.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>';
        deleteButton.onclick = e => {
            e.stopPropagation();
            removeFile(i);
        };
        item.appendChild(deleteButton);
        strip.insertBefore(item, add);
    });
}

function removeFile(idx) {
    // removing the file first

    allImages_or_vedio.splice(idx, 1);
    allInputPostToBASE64.splice(idx, 1);

    // checking if array become empty
    if (!allImages_or_vedio.length) {
        document.getElementById('dropZone').style.display = 'flex';
        document.getElementById('previewArea').classList.remove('visible');
        renderThumbs();
        updateBadge();
        return;
    }

    // if last image delete then change current to new last image
    if (activeInputFeildPost >= allImages_or_vedio.length) {
        activeInputFeildPost = allImages_or_vedio.length - 1;
    }

    renderThumbs();
    setMainMedia(activeInputFeildPost);
}

function updateBadge() {
    document.getElementById('previewBadge').textContent =
        allImages_or_vedio.length > 1 ? `${activeInputFeildPost + 1} / ${allImages_or_vedio.length}` : '1';
}

// dragging Post Images
Sortable.create(document.querySelector("#thumbStrip"), {
    animation: 150,
    draggable: ".thumb-item",
    filter: "#thumbAdd",
    preventOnFilter: false,
    onEnd: (event) => {
        let { newIndex, oldIndex } = event

        let [movedElement_input] = allImages_or_vedio.splice(oldIndex, 1);
        let [movedElement_base64] = allInputPostToBASE64.splice(oldIndex, 1);

        allImages_or_vedio.splice(newIndex, 0, movedElement_input);
        allInputPostToBASE64.splice(newIndex, 0, movedElement_base64);
        renderThumbs();
        setMainMedia(newIndex);
    }
});

async function submitPost() {
    try {
        // closing upload for background upload
        if (!allImages_or_vedio.length) {
            document.querySelector("#error-input-post").textContent = "No post selected";
            return;
        }
        closeUpload();
        uploadFormInput.uploadPostLoader.classList.remove("display-none");
        uploadFormInput.loaderToolTip.textContent = "Uploading...";
        uploadFormInput.uploadButtonPost.disabled = true;


        let submitForm = new FormData();
        allImages_or_vedio.forEach(post => submitForm.append("post", post))
        submitForm.append("description", uploadFormInput.postDescription.value);

        let response = await fetch(fetchURL.POST_ADD_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json"
            },
            credentials: "include",
            body: submitForm
        });

        let output = await response.json();

        if (!output.success) {
            showToast(output.message, 'error');
            verifingTokenVerfication(output);
            resetUpload();
            return;
        }
        {
            // on success removing loader
            showToast('Post shared!', 'success');
            uploadFormInput.uploadPostLoader.classList.add("display-none");
            uploadFormInput.loaderToolTip.textContent = "Upload post";
            uploadFormInput.uploadButtonPost.disabled = false;
            resetUpload();
        }
    } catch (error) {
        console.log(error);
    }
}


// intail observer can be used sometime --> for testing
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {

        const postId = entry.target.dataset.postid

        if (entry.isIntersecting) {
        } else {
        }

    });
}, { threshold: 0.5 });


function buildCard(postData) {
    if (postData.length === 0) {
        emptyFeedMessage.classList.remove("display-none");
        skeletonLoader.classList.add("display-none");
        return;
    }
    postData.forEach((post) => {
        try {
            const feed = document.getElementById('feedWrap');
            const template = document.querySelector("#postTemplate");

            // ✅ fix — clone into variable first, THEN querySelector
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector(".post-card");
            card.dataset.postid = "post-" + post._id;

            // ── HEADER ──
            const user = post.userID;
            const username = user?.username || "Unknown";

            let imageProfile = card.querySelector(".profile-photo-post");
            imageProfile.src = post.userID?.profile?.url || DEFAULT_PROFILE_IMAGE;
            imageProfile.id = post.userID?._id;
            imageProfile.onclick = () => {
                openProfile(username);
            }

            let nameProfile = card.querySelector('.username-profile')
            nameProfile.textContent = username;
            nameProfile.onclick = () => {
                openProfile(username);
            }

            card.querySelector('[data-field="time"]').textContent = getTimeAgo(post.createdAt);

            // ── MEDIA ──
            const images = post.images || [];
            const carousel = card.querySelector('[data-field="carousel"]');
            const track = card.querySelector('[data-field="track"]');
            const dotsWrap = card.querySelector('[data-field="dots"]');
            const counter = card.querySelector('[data-field="counter"]');
            const btnPrev = card.querySelector('[data-field="arrow-left"]');
            const btnNext = card.querySelector('[data-field="arrow-right"]');

            // build slides
            images.forEach((imgObj) => {
                const slide = document.createElement("div");
                slide.className = "pc-slide";

                const isVideo = imgObj.url?.match(/\.(mp4|webm|ogg|mov)$/i);

                if (isVideo) {
                    const vid = document.createElement("video");
                    vid.src = imgObj.url;
                    vid.controls = true;
                    vid.muted = true;
                    vid.loop = true;
                    vid.playsInline = true;
                    slide.appendChild(vid);
                } else {
                    const img = document.createElement("img");
                    img.src = imgObj.url;
                    img.alt = "post";
                    img.loading = "lazy";
                    img.onload = () => {
                        console.log("image added");
                    }
                    slide.appendChild(img);
                }

                track.appendChild(slide);
            });

            // ── SINGLE IMAGE — remove carousel nodes entirely ──
            if (images.length <= 1) {
                btnPrev.remove();
                btnNext.remove();
                dotsWrap.remove();
                counter.remove();
            }

            // ── MULTI IMAGE — wire up carousel ──
            if (images.length > 1) {
                let current = 0;
                counter.classList.add("visible");

                images.forEach((_, i) => {
                    const dot = document.createElement("span");
                    dot.className = "pc-dot" + (i === 0 ? " active" : "");
                    dot.onclick = () => goTo(i);
                    dotsWrap.appendChild(dot);
                });

                const goTo = (idx) => {
                    current = idx;
                    track.style.transform = `translateX(-${current * 100}%)`;
                    dotsWrap.querySelectorAll(".pc-dot")
                        .forEach((d, i) => d.classList.toggle("active", i === current));
                    counter.textContent = `${current + 1} / ${images.length}`;
                    btnPrev.disabled = current === 0;
                    btnNext.disabled = current === images.length - 1;
                };

                btnPrev.onclick = () => { if (current > 0) goTo(current - 1); };
                btnNext.onclick = () => { if (current < images.length - 1) goTo(current + 1); };
                goTo(0);
            }

            // ── LIKE ──
            const likeBtn = card.querySelector('[data-field="like-btn"]');
            const likeCount = card.querySelector('[data-field="like-count"]');
            likeBtn.id = "like-btn-" + post._id;
            likeBtn.dataset.postid = post._id;

            likeCount.id = 'like-post-' + post._id;
            likeCount.textContent = post.like || 0;
            console.log(post);

            if (post.hasLiked) {
                likeBtn.classList.add("liked");
            }

            likeBtn.onclick = async (e) => {
                likeButton(likeBtn);
            };

            // ── COMMENT ──
            const cBtn = card.querySelector('[data-field="comment-btn"]');
            const cCount = card.querySelector('[data-field="comment-count"]');
            cBtn.id = "comment-btn-" + post._id;
            cCount.id = "cc-" + post._id;
            cCount.textContent = post.commentCount || 0;
            cBtn.onclick = () => openComments(post._id, post.commentCount);

            // ── CAPTION ──
            if (post.content) {
                const capDiv = card.querySelector('[data-field="caption"]');
                capDiv.style.display = "block";
                capDiv.querySelector('[data-field="cap-user"]').textContent = username;
                capDiv.querySelector('[data-field="cap-text"]').textContent = post.content;
            }

            observer.observe(card);
            feed.prepend(card);
        } catch (error) {
            console.log(error);
        }
    });
    skeletonLoader.classList.add("display-none");
}

// side bar ---> MOBILE
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sbOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sbOverlay').classList.remove('open');
}


let toastTimer;

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');

    toast.classList.remove("display-none");
    if (type) {
        toast.classList.add(type);
    }
    toast.textContent = msg;
    let toastTimer = setTimeout(() => {
        toast.classList.add("display-none");
        if (type) {
            toast.classList.remove(type);
        }
    }, 2800);
}


function openProfile(username) {
    window.location.href = `/profile.html?username=${username}`;
}

function updateProfilePageLinkUsername(usernameDetails) {
    document.querySelector("#profile-button").onclick = () => {
        window.location.href = `/profile.html?username=${usernameDetails.username}`;
    }
    document.querySelector(".sb-profile").onclick = () => {
        updateProfilePageLinkUsername(userData.username)
    }

    document.getElementById("profile-username-header").textContent = "@" + usernameDetails.username;
    document.getElementById("profile-name-header").textContent = usernameDetails.name;
    document.querySelector("#profile-photo-header img").src = usernameDetails.profile || DEFAULT_PROFILE_IMAGE;

    document.querySelector(".modal-uname").textContent = "@" + usernameDetails.username;
    document.getElementById("modal-audience-name").textContent = usernameDetails.name;
    document.getElementById("modal-avi-img").src = usernameDetails.profile || DEFAULT_PROFILE_IMAGE;
}



function verifingTokenVerfication(data) {
    if (!data.success && data?.errCode[0]?.render === "LOGIN_PAGE") {
        window.location.replace("/login.html");
    }
}

function toggleFollow(btn) {
    const isFollowing = btn.classList.contains('following');

    if (!isFollowing) {
        // ── FOLLOW — burst animation ──
        btn.classList.add('following');
        btn.querySelector('.follow-label').textContent = 'Following';

        // ripple
        const ripple = document.createElement('div');
        ripple.className = 'f-ripple';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());

        // particles
        const colors = ['#6d28d9', '#a855f7', '#ec4899', '#f97316', '#3b82f6'];
        const container = btn.querySelector('.follow-particles');
        const count = 10;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('span');
            p.className = 'fp';

            const angle = (360 / count) * i;
            const dist = 28 + Math.random() * 16;
            const rad = (angle * Math.PI) / 180;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;

            p.style.cssText = `
        --tx: ${tx}px;
        --ty: ${ty}px;
        background: ${colors[i % colors.length]};
        animation-delay: ${Math.random() * 0.08}s;
      `;
            container.appendChild(p);
            p.addEventListener('animationend', () => p.remove());
        }

    } else {
        btn.classList.remove('following');
        btn.querySelector('.follow-label').textContent = 'Follow';
    }

}

const feedwrap = document.getElementById("feedWrap");

let lastTap = 0;

feedwrap.addEventListener("pointerup", (e) => {
    const postClick = e.target.closest(".pc-carousel");
    if (!postClick) return;
    let postCard = e.target.closest(".post-card");

    const now = Date.now();

    if (now - lastTap < 300) {
        handleDoubleTap(postCard, postClick);
    }

    lastTap = now;
});