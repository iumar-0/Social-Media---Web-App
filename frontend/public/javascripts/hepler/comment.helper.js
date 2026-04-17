const commentList = document.querySelector('#commentsList');

const replyIndictor = document.querySelector("#reply-indicator");
const commentInput = document.getElementById('commentInput');
const commentEmptyDisplay = document.querySelector(".comments-empty");
const commentCountWordsDisplay = document.querySelector(".comment-total-input");
const commentSubmitButton = document.querySelector("#sendBtnComment");
const totalCommentDrawerUi = document.querySelector("#drawerCount");

const commentTemplate = document.querySelector("#commentTemplate");

// Comment states
let disableSubmitButton = false;

let openedCommentPostIDState = null;
let currentCommentIndex = null;
let commentReplyId = null;
let replyStateID = null;
let lastCommentCursor = null;

let topLevelCommentOnlyWithoutReload = null;

// ══════════════════════════════════════════
// COMMENTS
// ══════════════════════════════════════════
async function openComments(postId, totalComment) {

    // validation ===> if the comment exits in cache
    if (openedCommentPostIDState === postId) {
        document.getElementById('drawerOverlay').classList.add('open');
        document.getElementById('commentDrawer').classList.add('open');

        commentList.scrollTo({ top: 0, behavior: 'smooth' });
        return
    }

    commentList.classList.remove("display-none");

    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('commentDrawer').classList.add('open');


    currentCommentIndex = null;
    commentReplyId = null;
    lastCommentCursor = null;
    openedCommentPostIDState = postId;

    // clear old comments
    document.querySelectorAll('.comment-item').forEach(c => c.remove());

    // clearn comment textarea
    commentInput.value = '';
    commentInput.placeholder = 'Add a comment...'
    replyIndictor.classList.add("display-none");

    // open drawer
    document.getElementById('drawerOverlay').classList.add('open')
    document.getElementById('commentDrawer').classList.add('open')

    // closing the body
    document.body.style.overflowY = "hidden";

    const commentsLoadResponse = await fetchComments(postId);

    if (commentsLoadResponse.success) {

        // setting up the variables for the scroll
        openedCommentPostIDState = postId;

        if (commentsLoadResponse.isInvalidCursor) return closeComments();

        // validation if no comment posted
        if (commentsLoadResponse?.data.commentField.length <= 0)
            return commentEmptyDisplay.classList.remove("display-none");

        if (commentsLoadResponse?.data.hasMoreComments) {
            scrollingCommentsLoading();
            lastCommentCursor = commentsLoadResponse?.data.cursor;
        }

        commentList.classList.remove("display-none");
        commentEmptyDisplay.classList.add("display-none");

        buildComment(commentsLoadResponse);
        commentList.scrollBottom = commentList.scrollHeight;
    } else {
        document.getElementById('drawerOverlay').classList.remove('open')
        document.getElementById('commentDrawer').classList.remove('open')

    }

    setTimeout(() => document.getElementById('commentInput').focus(), 400);
    totalCommentDrawerUi.textContent = totalComment;
}

// Comments fetch Url
async function fetchComments(postID, lastCommentCursor = null, parentID = null) {

    const params = new URLSearchParams({
        cursor: lastCommentCursor,
        parentID: parentID
    });

    if (!parentID) params.delete("parentID");

    try {

        const response = await fetch(`http://localhost:3000/v1/comment/${postID}?${params}`, {
            method: "GET",
            credentials: 'include',
        });

        const output = await response.json()
        console.log(output);

        verifingTokenVerfication(output);

        if (!output.success) showToast("Try again later", "");
        return output;
    } catch (error) {
        console.log(error)
    }
}

function buildComment(commentData) {
    try {
        console.log(commentData.message);

        if (!commentData.data.hasMoreComments) commentList.onscroll = null;

        commentData?.data.commentField.forEach(comment => {
            
            const commentTemplateClone = commentTemplate.content.cloneNode(true);

            commentTemplateClone.id = `comment-item-${commentData._id}`;

            let headerComment = commentTemplateClone.querySelector(".comment-avi");

            headerComment.querySelector("img").src = comment?.profile?.url || DEFAULT_PROFILE_IMAGE;
            headerComment.querySelector("img").onclick = () => {
                window.location.href = `/profile.html?username=${comment.userID.username}`;
            }

            headerComment.querySelector(".comment-user").textContent = comment?.userID?.username;
            headerComment.querySelector(".comment-time-txt").textContent = formatTime(comment.createdAt);

            commentTemplateClone.querySelector(".comment-text").textContent = comment.comment;

            commentTemplateClone.querySelector(".reply-btn").onclick = () => {
                setReply(comment.userID.username, comment._id);
            }

            if (comment.replyCount > 0) {
                commentTemplateClone.querySelector(".number-repiles-on-comment").textContent = comment.replyCount;
                commentTemplateClone.querySelector(".number-repiles-on-comment").onclick = () => {
                    viewReplyCommentDepth(comment.postID, comment._id);
                }
            } else {
                commentTemplateClone.querySelector(".replies-container").classList.add("display-none");
            }
            commentList.appendChild(commentTemplateClone);
        });
    } catch (error) {
        console.log(error);
    }
}


let isFetchingCommentOnScroll = false;
function scrollingCommentsLoading() {
    commentList.onscroll = async function (dets) {
        const scrolledPosition = commentList.scrollTop + commentList.clientHeight;
        const bottomThreshold = commentList.scrollHeight - 50;

        if (scrolledPosition >= bottomThreshold) {
            if (isFetchingCommentOnScroll) return;
            isFetchingCommentOnScroll = true;

            const commentsResponseOnScrolling = await fetchComments(
                openedCommentPostIDState, lastCommentCursor, null);

            isFetchingCommentOnScroll = false;
            if (commentsResponseOnScrolling.data.isInvalidCursor) return closeComments();
            
            lastCommentCursor = commentsResponseOnScrolling?.data.cursor;
            buildComment(commentsResponseOnScrolling);
            
            if (!commentsResponseOnScrolling?.data.hasMoreComments) return commentList.onscroll = null;
        }
    }
}

// ─────────────────────────────
// Close Comments Drawer
// ─────────────────────────────
function closeComments() {
    replyStateID = null;
    document.getElementById('drawerOverlay').classList.remove('open');
    document.getElementById('commentDrawer').classList.remove('open');

    // closing the body
    document.body.style.overflowY = "";
}

function setReply(username, commentId) {
    replyStateID = commentId;

    replyIndictor.classList.remove("display-none");
    const input = document.getElementById('commentInput')
    input.placeholder = `Replying to @${username}...`
    input.focus();

    // show cancel reply button
    const cancelBtn = document.getElementById('cancelReply');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            resetReply();
        }
    }
}

// ─────────────────────────────
// Cancel Reply
// ─────────────────────────────
function resetReply() {
    replyStateID = null;
    commentInput.value = "";
    commentInput.placeholder = "Add a comment...";
    replyIndictor.classList.add("display-none");
}

// ─────────────────────────────
// Send Comment or Reply
// ─────────────────────────────
async function sendComment(dets) {
    if (dets.id !== "sendBtnComment") return;

    const input = commentInput.value.trim();
    if (!input) return showToast("Comment is empty", "");

    dets.classList.add('loading');
    try {
        const response = await fetch('http://localhost:3000/v1/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                postID: openedCommentPostIDState,
                comment: input,
                parentId: replyStateID || null  // null = comment, ID = reply
            })
        })

        const output = await response.json()

        // verifingTokenVerfication(output);
        if (!output.success) {
            showToast(output.message, 'error')
            return
        }
        commentInput.style.height = 'auto';
        resetReply();
    } catch (error) {
        console.log("this is wokring");
        console.log(error)
    } finally {
        dets.classList.remove('loading')
    }
}

commentInput.addEventListener("keydown", (dets) => {
    if (dets.key !== "Enter") return;
    sendComment(commentSubmitButton);
});

// ─────────────────────────────
// Socket — Receive New Comment
// ─────────────────────────────
// socket.on("new-comment", (response) => {

//     // ignore if drawer is not open for this post
//     if (response.postID !== currentPostId) return

//     if (response.comment.parentID) {
//         buildReply(response.comment)   // it is a reply ✅
//     } else {
//         buildComment(response.comment) // it is a comment ✅
//     }

//     // update comment count on post card
//     const cc = document.getElementById(`cc - ${ response.postID } `)
//     if (cc) cc.textContent = parseInt(cc.textContent || 0) + 1

//     // update drawer count
//     const drawerCount = document.getElementById('drawerCount')
//     if (drawerCount) {
//         const current = parseInt(drawerCount.textContent.replace(/\D/g, '') || 0)
//         drawerCount.textContent = `(${ current + 1})`
//     }
// })

async function viewReplyCommentDepth(postId, parentId) {
    const commentsLoadResponse = await fetchComments(postId, null, parentId);

    // const

}

function buildReplyCommentDepth(commentData) {

    const createDepthOfCommentItem_div = document.createElement("div");
    createDepthOfCommentItem_div.className = `comment-item-depth-1`

    const DepthSpaceOfCommentItemp_div = document.createElement("div");
    DepthSpaceOfCommentItemp_div.id = `comment-item-depth-1`


    commentData.data.commentField.forEach((comment) => {

    });

    const commentTemplateClone = commentTemplate.content.cloneNode(true);

    // creating the div for the spacing in ut 



    const container = document.getElementById(`replies - ${reply.parentID} `)
    if (!container) return

    const initial = reply.userID?.username?.charAt(0).toUpperCase() || '?'
    const username = reply.userID?.username || 'Unknown'
    const profileUrl = reply.userID?.profile?.url

    const div = document.createElement('div')
    div.className = 'comment-item reply-item'
    div.dataset.commentId = reply._id

    div.innerHTML = `
    < div class="comment-avi small" >
        ${profileUrl
            ? `<img src="${profileUrl}" alt="${username}" />`
            : initial
        }
        </div >
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

commentInput.addEventListener("input", (dets) => {
    let commentText = dets.target.value;
    if (commentText.length < 200) {
        commentCountWordsDisplay.classList.add("display-none");
        return;
    }
    if (commentText.length < 500) {
        commentCountWordsDisplay.classList.remove("display-none");
        commentCountWordsDisplay.querySelector("p").textContent = `${commentText.length}/2000`;
        commentSubmitButton.disabled = false;
        return;
    }
    commentCountWordsDisplay.querySelector("p").textContent = `${commentText.length}/2000`;
    if (commentText.length > 2000) {
        commentCountWordsDisplay.querySelector("p").classList.add("error");
        disableSubmitButton = true;
        commentSubmitButton.disabled = true;
        return

    } else {
        commentCountWordsDisplay.querySelector("p").classList.remove("error");
        commentSubmitButton.disabled = false;
    }
});



// <div class="comment-item">
//     <div class="comment-item-head">
//         <div class="comment-avi">
//             <img src="https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg"
//                 alt="${username}" />
//             <div class="comment-meta-top">
//                 <div class="comment-user">@umar </div>
//                 <p class="comment-time-txt">3 mins ago</p>
//             </div>
//         </div>
//         <div class="comment-body">
//             <div class="comment-text">This is my comment umar. name is Muhammad umar</div>
//         </div>
//         <div class="comment-footer">
//             <button class="pc-act-btn pc-like-btn like-comment liked">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
//                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//                     <path
//                         d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
//                     </path>
//                 </svg>
//                 <span class="pc-btn-txt" data-field="like-count"
//                     id="like-post-69ceac67fe034ddf0e1a8990">2</span>
//                 <div class="pc-btn-spin"></div>
//             </button>
//             <button class="reply-btn" onclick="setReply('${c._id}', '${username}')">
//                 Reply
//             </button>
//         </div>
//     </div>
//     <div class="replies-container">view <span class="number-repiles-on-comment">10</span> replies </div>
// </div>