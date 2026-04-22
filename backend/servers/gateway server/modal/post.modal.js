import mongoose from "mongoose";
import { format } from "morgan";

const postSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    images: {
        type: [
            {
                format: { type: String, required: true },
                image_id: { type: String, required: true },
                url: { type: String, required: true },
                resource_type: { type: String, required: true }
            }
        ],
    },
    content: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["private", "public", "archived"],
        default: "public"
    },
    hashtag: {
        type: [String],
        default: [null],
        trim: true,
        lowercase: true
    },
    mentions: {
        type: [String],
        default: [null],
        trim: true,
        lowercase: true
    },
    like: {
        type: Number,
        default: 0
    },
    comment: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

export const postModal = new mongoose.model("post", postSchema);