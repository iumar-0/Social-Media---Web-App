const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg"

// ─────────────────────────
// Socket connection
// ─────────────────────────
const socket = io("http://localhost:3000", {
    withCredentials: true
})

socket.on("connect", () => {
    console.log("connected:", socket.id)
})

socket.on("connect_error", (error) => {
    if (error.message === "TOKEN_NOT_FOUND" ||
        error.message === "TOKEN_EXPIRED") {
        window.location.replace("/login.html")
    }
})

// ─────────────────────────
// Live follow request
// ─────────────────────────
socket.on("follow-request", (response) => {
    console.log("new request:", response)

    // add new request card to top of list
    addRequestCard(response.requester)

    // update badge
    updateBadge(1)
})
socket.on("delete-request", (response) => {
    console.log("new request:", response)

    // add new request card to top of list
    deleteCard(response.data.deletedID);
});
