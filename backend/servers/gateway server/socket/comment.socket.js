if (!account.isPrivate) {
    // public → global emit
    io.emit("new-comment", eventData)
} else {
    // private → only online followers
    const onlineUserIDs = Object.keys(onlineUsers)

    const onlineFollowers = await followModal.find({
        following: post.userID,
        follower: { $in: onlineUserIDs },
        status: "active"
    }).select("follower")

    onlineFollowers.forEach(({ follower }) => {
        const socketId = onlineUsers[follower]
        if (socketId) {
            io.to(socketId).emit("new-comment", eventData);

        }
    })

    // also send to post owner
    const ownerSocketId = onlineUsers[post.userID]
    if (ownerSocketId) {
        io.to(ownerSocketId).emit("new-comment", eventData)
    }
}
