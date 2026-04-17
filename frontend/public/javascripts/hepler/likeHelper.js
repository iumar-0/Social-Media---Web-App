const LIKE_FETCH_BASE_URL = {
    POST_LIKE_URL: "http://localhost:3000/v1/post",
}

let likeButtonProccessing = false;

async function likeButton(likeBtn) {
    try {
        // preventing from the racing condition
        if (likeButtonProccessing) {
            likeBtn.classList.toggle("liked");
            return
        }
        likeButtonProccessing = true;

        let postID = likeBtn.dataset.postid;
        const isLiked = likeBtn.classList.contains("liked");

        isLiked ? unlike_postCall(postID, likeBtn) : like_postCall(postID, likeBtn);

        likeBtn.classList.remove("pop");
        void likeBtn.offsetWidth;
        likeBtn.classList.add("pop");
    } catch (error) {
        console.log(error);
    }
}

async function like_postCall(postid, likeBtn) {

    likeBtn.classList.add("liked");
    try {

        let response = await fetch(LIKE_FETCH_BASE_URL.POST_LIKE_URL + `/${postid}/like`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include"
        });
        let output = await response.json();

        if (!output.success) {
            likeBtn.classList.remove("liked");
        }
    } catch (error) {
        likeBtn.classList.remove("liked");
    } finally {
        likeButtonProccessing = false;
    }
}

async function unlike_postCall(postid, likeBtn) {

    likeBtn.classList.remove("liked");
    try {

        let response = await fetch(LIKE_FETCH_BASE_URL.POST_LIKE_URL + `/${postid}/unlike`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include"
        });
        let output = await response.json();

        console.log(output);
        if (!output.success) {
            likeBtn.classList.add("liked");
        }
    } catch (error) {
        likeBtn.classList.add("liked");
    } finally {
        likeButtonProccessing = false;
    }
}

function handleDoubleTap(postCard, postClick) {

    let likeButton = postCard.querySelector(".pc-like-btn");
    let postID = likeButton.dataset.postid;

    const heart = document.createElement("div");
    heart.className = "dbl-heart";

    heart.innerHTML = `<svg
    width="80" height="80" viewBox="0 0 24 24" fill="#e63946" stroke="#e63946" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg
    >`;

    postClick.appendChild(heart);

    heart.addEventListener("animationend", () => heart.remove());

    // preventing from race Condition
    if (likeButtonProccessing) {
        likeButton.classList.add("liked");
        return
    }
    if (likeButton.classList.contains("liked")) return;
    likeButtonProccessing = true;

    like_postCall(postID, likeButton);
};