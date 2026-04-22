import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    postID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
        required: true
    }
});
likeSchema.index({ userID: 1, postID: 1 }, { unique: true });

export const likeModal = new mongoose.model("like", likeSchema);

