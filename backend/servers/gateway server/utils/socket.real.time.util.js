import { accountModal } from "../modal/account.modal.js";
import { followModal } from "../modal/follow.account.modal.js";

import { ioGet } from "../socket/io.sockets.calls.js";
import { onlineNotificationUser } from "../socket/notification.scoket.js";
import { onlineProfileUser } from "../socket/profile.socket.js";

const onFollowUnfollowRequestNotification = async function (userID, profileID, isProfilePrivate = false) {
    try {
        // Send real - time data to online user (Profile Page Only)

        if (isProfilePrivate) {
            // Notify private profile owner

            const requester = await accountModal
                .findById(userID)
                .select("username name profile.url");

            const ownerSocketId = onlineProfileUser[profileID.toString()]

            if (ownerSocketId) {
                ioGet().ioNotification.to(ownerSocketId).emit("follow-request", {
                    requester,
                    message: `${requester.username} requested to follow you`,
                    data: { followID: userID }
                });
            }
        }

        const followersCount = await followModal.countDocuments({
            following: profileID,
            status: "active"
        });

        const followingCount = await followModal.countDocuments({
            follower: profileID,
            status: "active"
        });

        ioGet().ioProfile.emit("profile:follow-state-update", {
            followersCount,
            followingCount,
            profileID
        });
    } catch (error) {
        console.log("error in followers request");
    }
}

const likePostSocket = async function (likePayoad) {
    try {
        ioGet().ioGlobal.emit("post:like-update", likePayoad);

    } catch (error) {
        console.log("error in emiting likes");

    }
}

const customPersonNotification = async function (profileID) {
    try {
        const ownerSocketId = onlineNotificationUser[profileID.toString()];
        if (ownerSocketId) {
            // delete request in the notification coner
            ioNotification.to(ownerSocketId).emit("delete-request", {
                message: "Request deleted",
                data: { deletedID: userID }
            });
        }
    } catch (error) {
        console.log("There in sending the nofication scoket");
    }
}

const emitNewPostPublic = async function (postPayload) {
    try {
        ioGet().ioFeed.emit("feed:public-post-published", { post: [postPayload] });

    } catch (error) {
        console.log("error in emiting feed post add");
    }
}

export default {
    // Feed and Profile 
    onFollowUnfollowRequestNotification,
    likePostSocket,
emitNewPostPublic,
    // Notification
    customPersonNotification,
}