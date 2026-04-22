import mongoose from "mongoose"

const commentSchema = new mongoose.Schema({
    postID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
        required: true,
        index: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
        trim: true
    },
    parentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment',
        default: null,
        index: true
    },
    replyCount: {
        type: Number,
        default: 0
    },
    depth: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

export const commentModal = new mongoose.model("comment", commentSchema)