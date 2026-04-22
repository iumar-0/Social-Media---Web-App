import { authSocket } from "./middleware.socket/socket.middleware.js";
import { initSocketSignals } from "./io.sockets.calls.js";

export let onlineUsers = {};

export const registerSocket = (io) => {

    io.use(authSocket);

    io.on("connection", (socket) => {
        onlineUsers[socket.userID] = socket.id;

        initSocketSignals(io);

        // disconnect from server
        socket.on("disconnect", () => {
            console.log("user disconnect ::", socket.id);
            delete onlineUsers[socket.userID];

        });
    });
}

