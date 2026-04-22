import { authSocket } from "./middleware.socket/socket.middleware.js";


export const onlineNotificationUser = {};

export const notificationSocketNamespace = (io) => {

    const notification = io.of("/notification");

    notification.use(authSocket);

    notification.on("connection", (socket) => {

        onlineNotificationUser[socket.userID] = socket.id;

        // global disconnect feed
        socket.on("disconnect", () => {
            delete onlineNotificationUser[socket.userID];
        });
    });
    return notification;
} 