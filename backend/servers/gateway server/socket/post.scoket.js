import { authSocket } from "./middleware.socket/socket.middleware.js";



export const onlineFeedUser = {};

export const feedSocketNamespace = (io) => {

    const feed = io.of("/feed");

    feed.use(authSocket);

    feed.on("connection", (socket) => {

        if (!socket?.userID) return socket.disconnect();
        onlineFeedUser[socket.userID] = socket.id;

        // global disconnect feed
        socket.on("disconnect", () => {

            delete onlineFeedUser[socket.userID];
            console.log("User disconnected on feed");
        });
    });
    return feed;
} 