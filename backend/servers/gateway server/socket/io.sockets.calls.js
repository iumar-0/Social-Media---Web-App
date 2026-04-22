import { feedSocketNamespace } from "./post.scoket.js";
import { profileSocketNamespace } from "./profile.socket.js";
import { notificationSocketNamespace } from "./notification.scoket.js";

let ioGlobal = null;

let ioFeed = null;
let ioProfile = null;
let ioComment = null;
let ioNotification = null;

export const initSocketSignals = (ioInsatance) => {
    ioGlobal = ioInsatance;

    ioFeed = feedSocketNamespace(ioInsatance);
    ioProfile = profileSocketNamespace(ioInsatance);
    ioNotification = notificationSocketNamespace(ioInsatance);
}

export const ioGet = () => (
    {
        initSocketSignals,
        ioGlobal,
        ioFeed,
        ioProfile,
        ioComment,
        ioNotification
    }
)