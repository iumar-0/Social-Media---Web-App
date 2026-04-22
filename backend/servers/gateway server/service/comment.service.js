import mongoose from "mongoose";
import { commentModal } from "../modal/comment.modal.js"
import { postModal } from "../modal/post.modal.js"

// ─────────────────────────────
// Get Comments with Replies
// ─────────────────────────────

const getCommentsService = async (userID, postID, parentID, cursor) => {
    try {
        const findQuery = { postID };
        if (parentID) findQuery.parentID = parentID;

        let isInvalidCursor = null;
        if (cursor !== "null" && typeof cursor === "string") {
            // Validating the Comment query
            const cursorIdDecode = Buffer.from(cursor, "base64").toString("ascii");

            if (mongoose.Types.ObjectId.isValid(cursorIdDecode)) {
                findQuery._id = { $lt: cursorIdDecode };
            } else {
                console.log("Decoded Id of comment changed");
                isInvalidCursor = true
            }
        }
        console.log(findQuery);

        const comments = await commentModal.find(findQuery)
            .sort({ createdAt: -1 })
            .limit(11)
            .populate("userID", "username profile.url");

        if (!comments) {
            return {
                success: false,
                message: "No comment",
                data: { commentField: null },
                errCode: null
            }
        }

        let nextCursor = false;
        let hasMoreComments = comments.length > 10;

        const commentPaginate = hasMoreComments ? comments.slice(0, -1) : comments;

        if (hasMoreComments) {
            const lastCommentId = comments[comments.length - 2]?._id;
            nextCursor = Buffer.from(lastCommentId).toString("base64");
        }

        return {
            success: true,
            message: "Comments fetched",
            data: {
                commentField: commentPaginate,
                cursor: nextCursor,
                isInvalidCursor,
                hasMoreComments
            },
            errCode: null
        }
    } catch (error) {
        throw error
    }
}


// ─────────────────────────────
// Add Comment or Reply
// ─────────────────────────────
const addCommentService = async (userID, postID, comment, parentId_ReplyTo = null) => {
    try {
        let commentDepth = 0;

        if (parentId_ReplyTo) {
            // estimate the nesting of comment
            const depthValidation = await commentModal.findOne({
                _id: parentId_ReplyTo,
                postID: postID,
            }).sort({ createdAt: -1 }).select("depth");

            commentDepth = (depthValidation.depth < 2) ? depthValidation.depth + 1 : 2;
        }

        const newComment = await commentModal.create({
            postID,
            userID,
            comment,
            parentId_ReplyTo,
            depth: commentDepth
        });

        const totalCommentsAfter = await postModal.findByIdAndUpdate(postID,
            { $inc: { comment: +1 } },
            { "returnDocument": "after" }
        ).select("comment -_id");

        if (parentId_ReplyTo) {
            // adding the comments total figure
            await commentModal.findByIdAndUpdate(parentId_ReplyTo,
                { $inc: { replyCount: +1 } },
                { "returnDocument": "after" }
            ).select("comment -_id");
        }

        const commentUploadToNotification = await commentModal
            .findById(newComment._id)
            .populate("userID", "name username profile.url")
            .populate({
                path: "postID",
                select: "images.url",
                options: {
                    images: { $slice: 1 }
                }
            }).lean();
        
        console.log(commentUploadToNotification);

        return {
            success: true,
            message: "Comment added",
            errCode: null,
            data: { commentData: newComment },
        }

    } catch (error) {
        throw error
    }
}

export default {
    getCommentsService,
    addCommentService,
}