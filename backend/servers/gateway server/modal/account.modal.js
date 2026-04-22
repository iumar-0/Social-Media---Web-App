import mongoose from "mongoose";
import { stringify } from "querystring";

const accountSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required"],
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [50, "Name characters cannot exceed 50"]
    },
    username: {
        type: String,
        trim: true,
        minlength: [2, "Username must be at least 2 characters"],
        maxlength: [30, "Username characters cannot exceed 30"],
        unique: true,
        default: null
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/, "Invalid email format"]
    },
    rawEmail: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email Alreay Exists"],
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/, "Invalid email format"]
    },
    password: {
        type: String,
        minlength: [5, "Name must be at least 5 characters"]
    },
    googleId: {
        type: String,
        unique: true,
        index: true,
        default: null,
    },
    authProvider: {
        type: [String],
        enum: ["local", "google"],
        default: ["local"]
    },
    status: {
        type: String,
        enum: ["pending", "active", "pending_deletion", "username_pending"],
        default: "pending"
    },
    expireAt: {
        type: Date,
        default: null
    },
    profile: {
        type: {
            format: { type: String },
            image_id: { type: String },
            url: { type: String },
            resource_type: { type: String }
        },
        default: null
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [50, "Description must be 50 characters or less."],
        default: null
    }
}, { timestamps: true });

accountSchema.index(
    { expireAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: { status: { $in: ["pending", "pending_deletion"] } }
    });

accountSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {

            await mongoose.model('post').deleteMany({ userID: doc._id }, { session });
            await mongoose.model('like').deleteMany({ userID: doc._id }, { session });
            await mongoose.model('comment').deleteMany({ userID: doc._id }, { session });
            
            await mongoose.model('follow').deleteMany({
                $or: [{ following: doc._id, }, { follower: doc._id }]
            }, { session });

            await session.commitTransaction();
        } catch (error) {
            console.log("Aborting deleting");
            session.abortTransaction();
        } finally {
            session.endSession();
        }
    }
});

export const accountModal = mongoose.model("account", accountSchema);

export const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg";
