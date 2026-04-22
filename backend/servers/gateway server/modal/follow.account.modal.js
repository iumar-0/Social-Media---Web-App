import mongoose from "mongoose";

let followAccountSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "active"],
        default: "active"
    }
}, { timestamps: true });

followAccountSchema.index({ follower: 1, following: 1 }, { unique: true })

export const followModal = new mongoose.model("follow", followAccountSchema);