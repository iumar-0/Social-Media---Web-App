import mongoose from "mongoose";

import { accountModal } from "../modal/account.modal.js";
import { followModal } from "../modal/follow.account.modal.js";
import { postModal } from "../modal/post.modal.js";

import sidebarProfileAccountService from "../utils/sidebar.profile.account.service.js";
import socketRealTimeUtil from "../utils/socket.real.time.util.js";


const getAccountProfileService = async function (userID, username) {
    try {

        const userAggregation = await accountModal.aggregate([
            {
                $match: { username: username }
            },
            // get followers count
            // 1. Get ONLY active followers
            {
                $lookup: {
                    from: "follows",
                    let: { profileID: "$_id" }, // Define the variable to use inside the pipeline
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$following", "$$profileID"] }, // Match the ID
                                        { $eq: ["$status", "active"] }         // Filter by Status
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followers"
                }
            },

            // 2. Get ONLY active following
            {
                $lookup: {
                    from: "follows",
                    let: { profileID: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$follower", "$$profileID"] }, // Match the ID
                                        { $eq: ["$status", "active"] }        // Filter by Status
                                    ]
                                }
                            }
                        }
                    ],
                    as: "following"
                }
            },

            // get posts count
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "userID",
                    as: "posts"
                }
            },

            // check if currentUser is following this profile
            {
                $lookup: {
                    from: "follows",
                    let: { profileID: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$follower", new mongoose.Types.ObjectId(userID)] },
                                        { $eq: ["$following", "$$profileID"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "isFollowingData"
                }
            },

            // add all computed fields
            {
                $addFields: {
                    followersCount: { $size: "$followers" },
                    followingCount: { $size: "$following" },
                    postsCount: { $size: "$posts" },
                    isOwnProfile: { $eq: ["$_id", new mongoose.Types.ObjectId(userID)] },

                    isFollowing: {
                        $cond: {
                            if: { $eq: ["$_id", new mongoose.Types.ObjectId(userID)] },
                            then: "$$REMOVE",
                            else: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$isFollowingData",
                                                as: "f",
                                                cond: { $eq: ["$$f.status", "active"] }  // only active
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    },

                    // ✅ new field
                    isPending: {
                        $cond: {
                            if: { $eq: ["$_id", new mongoose.Types.ObjectId(userID)] },
                            then: "$$REMOVE",
                            else: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$isFollowingData",
                                                as: "f",
                                                cond: { $eq: ["$$f.status", "pending"] }  // only pending
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    },

                    isPrivate: {
                        $cond: {
                            if: { $eq: ["$_id", new mongoose.Types.ObjectId(userID)] },
                            then: "$$REMOVE",
                            else: "$isPrivate"
                        }
                    }
                }
            },

            // clean output — remove sensitive fields
            {
                $project: {
                    password: 0,
                    email: 0,
                    rawEmail: 0,
                    status: 0,
                    expireAt: 0,
                    __v: 0,
                    followers: 0,
                    following: 0,
                    posts: 0,
                    isFollowingData: 0,
                    "profile.format": 0,
                    "profile.image_id": 0
                }
            }

        ]);

        if (!userAggregation.length) {
            return {
                success: false,
                message: "User not found",
                data: null,
                errCode: { field: "NO_USERNAME_FOUND", message: "No profile found" },
                status: 404
            };
        }

        const mapToSidebarProfile = await sidebarProfileAccountService.getSideBarProfile(userID);

        let isPrivate = userAggregation[0]?.isPrivate;
        let isFollowing = userAggregation[0]?.isFollowing;
        let isOwnProfile = userAggregation[0]?.isOwnProfile;
        let isPending = userAggregation[0]?.isPending;

        if (isPrivate && !isFollowing && !isOwnProfile) {
            return {
                success: true,
                message: "Private Profile",
                data: {
                    profile: userAggregation[0],
                    post: null,
                    mapToSidebarProfile,
                    isFollowing,
                    isPending,
                    isPrivate,
                    isOwnProfile
                },
                errCode: null,
                status: 200
            };
        }

        let profileFindingUserID = userAggregation[0]._id;
        const posts = await postModal.aggregate([

            // get posts of this profile only
            {
                $match: {
                    userID: new mongoose.Types.ObjectId(profileFindingUserID),
                    status: { $ne: "archived" }  // exclude archived
                }
            },

            // get comment count per post
            {
                $lookup: {
                    from: "comments",
                    let: { postID: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$postID", "$$postID"] }
                            }
                        }
                    ],
                    as: "comments"
                }
            },

            // check if current user liked this post
            {
                $lookup: {
                    from: "likes",
                    let: { postID: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$postID", "$$postID"] },
                                        { $eq: ["$userID", new mongoose.Types.ObjectId(userID)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "likedByUser"
                }
            },

            // add computed fields
            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                    liked: { $gt: [{ $size: "$likedByUser" }, 0] }
                }
            },

            // add user info to each post
            {
                $addFields: {
                    userID: {
                        _id: userAggregation[0]._id,
                        username: userAggregation[0].username,
                        name: userAggregation[0].name,
                        profile: {
                            url: userAggregation[0].profile?.url || null
                        }
                    }
                }
            },

            // clean output
            {
                $project: {
                    comments: 0,
                    likedByUser: 0,
                    __v: 0,
                    hashtag: 0,
                    mentions: 0,
                    "images.format": 0,
                    "images.image_id": 0
                }
            },

            // latest posts first
            { $sort: { createdAt: -1 } }

        ]);
        return {
            success: true,
            message: isOwnProfile ? "Own profile" : isPrivate ? "Private Profile" : "Public Profile",
            data: {
                profile: userAggregation[0],
                mapToSidebarProfile,
                posts,
                isPrivate,
                isFollowing,
                isPending,
                isOwnProfile,
            },
            errCode: null,
            status: 200
        }

    } catch (error) {
        throw error;
    }
}

const profileFollowRequestService = async function (userID, profileID) {
    try {
        if (userID.toString() === profileID.toString()) {
            return {
                success: false,
                message: "Cannot follow yourself",
                errCode: "SELF_FOLLOW",
                data: null,
                status: 400
            }
        }

        const profile = await accountModal
            .findById(profileID)
            .select("isPrivate username")

        if (!profile) {
            return {
                success: false,
                message: "Profile not found",
                errCode: "PROFILE_NOT_FOUND",
                data: null
            }
        }

        const status = profile.isPrivate ? "pending" : "active"

        await followModal.create({
            follower: userID,
            following: profileID,
            status
        });

        await socketRealTimeUtil.onFollowUnfollowRequestNotification(
            userID, profileID, profile.isPrivate);

        return {
            success: true,
            message: profile.isPrivate
                ? "Follow request sent"
                : "Following account",
            errCode: null,
            data: { isPrivate: profile.isPrivate },
            status: 201
        }

    } catch (error) {
        if (error.code === 11000) {
            return {
                success: false,
                message: "Already following",
                errCode: { isFollowing: true },
                data: null,
                status: 401
            }
        }
        throw error
    }
}

const profileFollowDeleteRequestService = async function (userID, profileID) {
    try {
        if (userID.toString() === profileID.toString()) {
            return {
                success: false,
                message: "Cannot unfollow yourself",
                errCode: "SELF_UNFOLLOW",
                data: null,
                status: 400
            }
        }

        const deletingFollowData = await followModal
            .findOneAndDelete({ follower: userID, following: profileID })
            .select("status");

        if (!deletingFollowData) {
            return {
                success: false,
                message: "Not following this account",
                errCode: "NOT_FOLLOWING",
                data: null,
                status: 400
            }
        }

        if (deletingFollowData.status === "pending") {
            // delete follow request Notification
            socketRealTimeUtil.customPersonNotification(profileID);
        }

        socketRealTimeUtil.onFollowUnfollowRequestNotification(
            userID, profileID);

        return {
            success: true,
            message: "Unfollowed successfully",
            errCode: null,
            data: null,
            status: 200
        }

    } catch (error) {
        throw error
    }
}




// services/follow.service.js

// ACCEPT REQUEST
export const acceptFollowRequestService = async function (userID, requesterID, io) {
    try {

        const updated = await followModal.findOneAndUpdate(
            {
                follower: requesterID,
                following: userID,
                status: "pending"
            },
            { status: "active" },
            { returnDocument: 'after' }  // ✅ fix warning
        )

        if (!updated) {
            return {
                success: false,
                message: "Request not found",
                errCode: "REQUEST_NOT_FOUND",
                data: null
            }
        }

        const followersCount = await followModal.countDocuments({
            following: userID,
            status: "active"
        })

        // total following — how many people this user follows
        const followingCount = await followModal.countDocuments({
            follower: userID,
            status: "active"
        })

        io.emit("follow-count-update", {
            followersCount,
            followingCount,
            profileID
        });

        return {
            success: true,
            message: "Request accepted",
            errCode: null,
            data: null
        }

    } catch (error) {
        throw error
    }
}

// DELETE REQUEST
export const deleteFollowRequestService = async function (userID, requesterID) {
    try {

        const deleted = await followModal.deleteOne({
            follower: requesterID,
            following: userID,
            status: "pending"
        })

        if (deleted.deletedCount === 0) {
            return {
                success: false,
                message: "Request not found",
                errCode: "REQUEST_NOT_FOUND",
                data: null
            }
        }

        return {
            success: true,
            message: "Request deleted",
            errCode: null,
            data: null
        }

    } catch (error) {
        throw error
    }
}

// GET ALL PENDING REQUESTS
export const getPendingRequestsService = async function (userID) {
    try {

        const requests = await followModal
            .find({
                following: userID,
                status: "pending"
            })
            .populate("follower", "username name profile")
            .sort({ createdAt: -1 })

        return {
            success: true,
            message: "Pending requests",
            errCode: null,
            data: requests
        }

    } catch (error) {
        throw error
    }
}

export default {
    getAccountProfileService,
    profileFollowRequestService,
    profileFollowDeleteRequestService,
    acceptFollowRequestService,
    deleteFollowRequestService,
    getPendingRequestsService
}