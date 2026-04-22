import mongoose from "mongoose";

const tokenVerficationSehema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    tokenHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

tokenVerficationSehema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export let tokenModal = mongoose.model("token", tokenVerficationSehema);
