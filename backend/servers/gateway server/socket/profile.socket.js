import { authSocket } from "./middleware.socket/socket.middleware.js";



export const onlineProfileUser = {};

export const profileSocketNamespace = (io) => {

    const profile = io.of("/profile");

    profile.use(authSocket);

    profile.on("connection", (socket) => {
        if (!socket?.userID) return socket.disconnect();

        onlineProfileUser[socket.userID] = socket.id;

        // global disconnect feed
        socket.on("disconnect", () => {
            delete onlineProfileUser[socket.userID];
        });
    });
    return profile;
} 