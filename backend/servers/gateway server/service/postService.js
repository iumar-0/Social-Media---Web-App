import mongoose from "mongoose";

import { DEFAULT_PROFILE_IMAGE } from "../modal/account.modal.js";
import { postModal } from "../modal/post.modal.js";
import { likeModal } from "../modal/like.modal.js";
import { commentModal } from "../modal/comment.modal.js";

import { uploadImagesPromises, deletePostPromise } from "../utils/upload.image.cloud.js";

import sidebarProfileAccountService from "../utils/sidebar.profile.account.service.js";
import socketRealTimeUtil from "../utils/socket.real.time.util.js";


const getAllPostService = async function (currentUserID) {
    try {
        let allPostDataGatheringFromDB = await postModal.aggregate([
            // Step 1 — lookup follow info for each post's owner
            {
                $lookup: {
                    from: "follows",
                    let: { ownerID: "$userID" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        // is currentUser following post owner?
                                        { $eq: ["$follwer", new mongoose.Types.ObjectId(currentUserID)] },
                                        { $eq: ["$following", "$$ownerID"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followInfo"
                }
            },

            // Step 2 — add isFollowing field
            {
                $addFields: {
                    isFollowing: { $gt: [{ $size: "$followInfo" }, 0] }
                }
            },

            // Step 3 — filter posts
            {
                $match: {
                    $or: [
                        { status: "public" },
                        {
                            $and: [
                                { status: "private" },
                                { isFollowing: true }
                            ]
                        }
                    ]
                }
            },
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
            // Step 4 — lookup user info
            {
                $lookup: {
                    from: "accounts",
                    localField: "userID",
                    foreignField: "_id",
                    as: "userID",
                    pipeline: [
                        { $project: { name: 1, username: 1, profile: 1 } }
                    ]
                }
            },
            { $unwind: "$userID" },

            // Step 5 — check if current user liked this post
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
                                        { $eq: ["$userID", new mongoose.Types.ObjectId(currentUserID)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "likedByUser"
                }
            },

            // Step 6 — add hasLiked field
            {
                $addFields: {
                    hasLiked: { $gt: [{ $size: "$likedByUser" }, 0] },
                    commentCount: { $size: "$comments" }
                }

            },

            // Step 7 — clean output
            {
                $project: {
                    followInfo: 0,
                    likedByUser: 0,
                    isFollowing: 0,
                    __v: 0,
                    "images.format": 0
                }
            }
        ]);

        const mapToSidebarProfile = await sidebarProfileAccountService.getSideBarProfile(currentUserID);

        return {
            postData: allPostDataGatheringFromDB,
            mapToSidebarProfile
        };
    } catch (error) {
        throw error;
    }
}

const userAddPostService = async function (userID, imageFiles, description,) {
    try {
        // image upload and details
        let urls = await Promise.all(uploadImagesPromises(imageFiles));

        // Collecting the hastags
        let collectingHashtags = description.match(/#\w+/g) || [];
        let collectingMentions = description.match(/@\w+/g) || [];

        let hashtag = [...new Set(collectingHashtags)];
        let mentions = [...new Set(collectingMentions)];

        let postCreating = await postModal.create({
            userID: userID,
            images: urls,
            content: description,
            hashtag,
            mentions
        });

        let postData = await postModal.findById(postCreating._id)
            .populate("userID", "name username profile isPrivate")
            .select("-_v -status -images.format");


        if (!(postData?.userID.profile)) {
            postData.userID.profile = { url: DEFAULT_PROFILE_IMAGE };
        }

        if (!postData.userID.isPrivate) {
            // emiting to the global users on public account
            socketRealTimeUtil.emitNewPostPublic(postData);
        } else {
            // console.log("private account");
            // let fetchingFollowers = await followModal.find({ following: userID });
        }
        // let followersList = await followModal.find({ following: userID }).select("follwer -_id");



        return { success: true, status: 201, data: postData, message: "Post created" };
    } catch (error) {
        console.log(error);

        throw error;
    }
}

const userDeletePostService = async function (postID) {
    try {
        let deletePost = await postModal.findByIdAndDelete(postID).select("images.image_id resource_type -_id");

        if (!deletePost) {
            return {
                success: false,
                message: "No post found",
                errCode: { errorField: "No Post found" },
                data: null,
                status: 401
            }
        }
        const mapPostDeleteIds = deletePost.images.flatMap(post => post.image_id);

        const filterImagesOnly = mapPostDeleteIds.filter(postMedia => postMedia.resource_type === "image");
        const filterVideosOnly = mapPostDeleteIds.filter(postMedia => postMedia.resource_type === "video");
        await deletePostPromise(filterImagesOnly, filterVideosOnly);

        await likeModal.deleteMany({ postID });
        await commentModal.deleteMany({ postID });

        return {
            success: true,
            message: "Post deleted",
            errCode: null,
            data: null,
            status: 200
        }
    } catch (error) {
        throw error;
    }
}

const likeUserPostService = async function (user_id, post_id) {
    try {

        let existingLike = await likeModal.findOne({ userID: user_id, postID: post_id });

        if (existingLike) {
            return {
                success: false,
                message: "Post already liked",
                errCode: null,
                data: null
            }
        }
        
        await likeModal.create({ userID: user_id, postID: post_id });

        const totalLikes = await postModal.findByIdAndUpdate(post_id,
            { $inc: { like: +1 } },
            { returnDocument: 'after' }
        ).select("like -_id");

        socketRealTimeUtil.likePostSocket({ post: post_id, like: totalLikes.like });

        return {
            success: true,
            message: "Post liked",
            errCode: null,
            data: null
        }
    } catch (error) {
        throw error;
    }
}

const unlikeUserPostService = async function (user_id, post_id) {
    try {

        let deleteLike = await likeModal.deleteOne({ userID: user_id, postID: post_id });

        if (deleteLike.deletedCount === 0) {
            return {
                success: false,
                message: "like not found",
                errCode: null,
                data: null
            }
        }

        const totalLikes = await postModal.findOneAndUpdate(
            { _id: post_id, like: { $gt: 0 } },
            { $inc: { like: -1 } },
            { returnDocument: 'after' }
        ).select("like -_id");

        socketRealTimeUtil.likePostSocket({ post: post_id, like: totalLikes.like });

        return {
            success: true,
            message: "Post unliked",
            errCode: null,
            data: null
        }
    } catch (error) {
        throw error;
    }
}

export default {
    getAllPostService,
    userAddPostService,
    userDeletePostService,
    userDeletePostService,
    likeUserPostService,
    unlikeUserPostService,

}