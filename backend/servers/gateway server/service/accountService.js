import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";

import cloudinary from "../config/configcloudinary.js";
import authGoogle from "../config/auth.google.js";

import { accountModal, DEFAULT_PROFILE_IMAGE } from "../modal/account.modal.js";
import { tokenModal } from "../modal/token.modal.js";
import { followModal } from "../modal/follow.account.modal.js";

import cookieAssign from "../utils/cookieAssign.js";

import emailUtils from "../utils/emailUtils.js";
import { uploadProfilePromises, URLuploadProfilePromise } from "../utils/upload.image.cloud.js";
import socketRealTimeUtil from "../utils/socket.real.time.util.js";


const TIME_15Mins = 15 * 60 * 1000;
const TIME_7Days = 7 * 24 * 60 * 60 * 1000

const createAccountService = async function (accountForm) {
    try {
        let { name, username, email, password } = accountForm;
        const userNameValidate = username.trim().toLowerCase();
        if (!userNameValidate) {
            return {
                success: false,
                message: "username is empty",
                errCode: [{ field: "username", message: "Username is Empty" }],
                status: 400,
                data: null
            }
        }

        const formatedEmail = emailUtils.formatEmail(email);

        let ValidateUserAccountExits = await accountModal.findOne({ username: username })
            .select("status");

        if (ValidateUserAccountExits) {
            return {
                success: false,
                message: "Account Already Exits",
                errCode: [{ field: "username", message: "Username Already Exits" }],
                status: 400,
                data: null
            }
        }

        let creatingUserAccount = new accountModal({
            name: name,
            username: username,
            email: formatedEmail,
            rawEmail: email,
            password: password,
            expireAt: new Date(Date.now() + TIME_15Mins)
        });

        const generateCode = Math.floor(100000 + Math.random() * 900000).toString();
        const cryptoGenerted = crypto.createHash("sha256").update(generateCode).digest("hex");
        let tokenCreatingForUserAccount = new tokenModal({
            userID: creatingUserAccount._id,
            tokenHash: cryptoGenerted,
            expiresAt: new Date(Date.now() + TIME_15Mins)
        });

        await creatingUserAccount.save();
        emailUtils.emailVerficationSenderUntils(name, email, generateCode);
        await tokenCreatingForUserAccount.save();

        return {
            success: true,
            message: "Account Created Successfully",
            errCode: null,
            status: 201,
            data: {
                userID: creatingUserAccount._id,
                token: generateCode,
                code: "OTP_CHECK"
            }
        }
    } catch (error) {
        // unique constrain error
        if (error.code === 11000) {
            let fieldName = Object.keys(error.keyValue)[0];
            console.log(fieldName);
            return {
                success: false,
                message: "Validation Errors",
                errCode: [{ field: fieldName, message: error.message }],
                status: 400,
                data: null
            }
        }
        // validation input error
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => ({
                field: err.path,
                message: err.message
            }));
            return {
                success: false,
                message: "Validation Errors",
                errCode: errors,
                status: 400,
                data: null
            }
        }
        throw error;
    }
}

const authGoogleService = async function (response, credential) {
    try {

        const ticket = await authGoogle.client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email_verified || payload.iss !== "https://accounts.google.com") {
            return {
                success: false,
                message: "Account not verified. Try other way",
                errCode: { authError: "Account not verified. Try other way" },
                status: 401,
                data: null
            }
        }

        const userValidate = await accountModal.findOne({ googleId: payload.sub });

        if (!userValidate) {

            let userAuthObject = {
                name: payload.name,
                email: payload.email,
                profile: payload.picture,
                googleId: payload.sub
            }

            cookieAssign.AuthAssignCookieToken(
                response,
                userAuthObject,
                "chattreAuth",
                "15m",
                15 * 60 * 60
            );
            return {
                success: true,
                message: "Account Created Successfully",
                errCode: null,
                status: 201,
                data: { accountStatus: "USERNAME_PENDING" }
            }
        }
        console.log(userValidate);

        cookieAssign.assignCookieToken(
            response,
            userValidate._id,
            "token",
            "7d",
            TIME_7Days
        );
        return {
            success: true,
            message: "Account login Successfully",
            errCode: null,
            status: 201,
            data: { accountStatus: null }
        };
    } catch (error) {
        throw error;
    }
}

const authGoogleCreateService = async function (userAuthDetails, username) {
    let imageUpload = null;
    try {
        const validateUsername = await accountModal.findOne({ username });
        if (validateUsername) {
            return {
                success: false,
                message: "username already exits",
                errCode: { message: "username already exits", username: "USERNAME_UNIQUE" },
                status: 401,
                data: null
            }
        }
        imageUpload = await URLuploadProfilePromise(userAuthDetails.profile);

        const createUserAccount = await accountModal.create({
            name: userAuthDetails.name,
            email: emailUtils.formatEmail(userAuthDetails.email),
            rawEmail: userAuthDetails.email,
            username: username,
            status: "active",
            profile: imageUpload,
            googleId: userAuthDetails.googleId,
            authProvider: ["google"]
        });

        return {
            success: true,
            message: "Account login Successfully",
            errCode: null,
            status: 201,
            data: createUserAccount._id
        }
    } catch (error) {
        console.log(error);

        if (imageUpload) await cloudinary.uploader.destroy(imageUpload.profile.image_id, { resource_type: 'image' });
        throw error;
    }
}

const verifyUserTokenService = async function (userID, token) {
    try {

        let tokenFind = await tokenModal.findOne({ userID: userID })
            .sort({ createdAt: -1 });

        console.log(tokenFind);

        if (!tokenFind) {
            return {
                success: false,
                message: "Token Expired",
                errCode: [{ field: "tokenField", message: "Token Expired" }],
                status: 400,
                data: null
            }
        }

        let userTokenHash = crypto.createHash("sha256").update(token).digest("hex");

        if (tokenFind.tokenHash !== userTokenHash) {
            return {
                success: false,
                message: "Wrong Token",
                errCode: [{ token: "tokenField", message: "Wrong Token" }],
                data: null,
                status: 401
            }
        }

        let userAccountVerfiedUpdate = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { status: "active", expireAt: null } },
            { new: true }
        );

        const responseData = {
            userID: userAccountVerfiedUpdate._id,
        }

        if (!userAccountVerfiedUpdate.profile) {
            responseData.profileImage = "UPLOAD_IMAGE";
            responseData.profileURL = DEFAULT_PROFILE_IMAGE;
        }

        return {
            success: true,
            message: "Account Verifed Successfully",
            errCode: null,
            status: 201,
            data: responseData
        };
    } catch (error) {
        throw error;
    }
}

const tokenResendUserService = async function (userID) {
    try {

        let userData = await tokenModal.findOne({ userID: userID })
            .populate("userID", "rawEmail name")

        if (!userData) {
            return {
                success: false,
                message: "Verification expired. Please sign up again",
                errCode: [{ field: "tokenFieldError", message: "Verification expired. Please sign up again" }],
                status: 400,
                data: null
            }
        }

        let generateCode = Math.floor(100000 + Math.random() * 900000).toString();
        let cryptoGenerted = crypto.createHash("sha256").update(generateCode).digest("hex");

        let creatingToken = new tokenModal({
            userID: userID,
            tokenHash: cryptoGenerted,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        emailUtils.emailVerficationSenderUntils(
            userData.userID.name,
            userData.userID.rawEmail,
            generateCode
        );

        await accountModal.findByIdAndUpdate(userID,
            { $set: { expireAt: new Date(Date.now() + TIME_15Mins) } }
        )

        await creatingToken.save();

        return {
            success: true,
            message: "Email send Successfully",
            errCode: null,
            status: 201,
            data: {
                userID: userID,
            }
        };
    } catch (error) {
        throw error;
    }
}

const loginUserAccountService = async function (emailOrUsername, password) {
    try {
        let fetchingUserDets = await accountModal
            .findOne({ $or: [{ rawEmail: emailOrUsername }, { username: emailOrUsername }] })
            .select("rawEmail username name password status profile authProvider");

        if (!fetchingUserDets) {
            return {
                success: false,
                message: "Account do not Exits",
                errCode: [{ field: "email", message: "Account does not Exit" }],
                status: 400,
                data: null
            };
        }

        if (!fetchingUserDets.authProvider.includes("local")) {
            return {
                success: false,
                message: "Account do not Exits",
                errCode: [{ field: "password", message: "This account is linked with Google. Use Google Login." }],
                status: 400,
                data: null
            };
        }

        if (fetchingUserDets.password !== password) {
            return {
                success: false,
                message: "Wrong password",
                errCode: [{ field: "password", message: "Wrong password" }],
                status: 400,
                data: null
            }
        }

        if (fetchingUserDets.status === "pending") {
            const generateCode = Math.floor(100000 + Math.random() * 900000).toString();
            const cryptoGenerted = crypto.createHash("sha256").update(generateCode).digest("hex");

            await tokenModal.create({
                userID: fetchingUserDets._id,
                tokenHash: cryptoGenerted,
                expiresAt: new Date(Date.now() + TIME_15Mins)
            });

            emailUtils.emailVerficationSenderUntils(
                fetchingUserDets.name,
                fetchingUserDets.rawEmail,
                generateCode
            );

            return {
                success: false,
                message: "Verify User Email",
                errCode: [{ field: "", message: "Verify User Email", render: "OTP_VALIDATION" }],
                status: 200,
                data: { userID: fetchingUserDets._id }
            }
        }

        const responseData = { userID: fetchingUserDets._id }

        if (!fetchingUserDets.profile) {
            responseData.profileImage = "UPLOAD_IMAGE";
            responseData.profileURL = DEFAULT_PROFILE_IMAGE;
        }

        return {
            success: true,
            message: "Account Verifed Successfully",
            errCode: null,
            status: 200,
            data: responseData
        }
    } catch (error) {
        throw error;
    }
}

const emailTokenSendforgetPasswordService = async function (email) {
    try {
        const findEmail = await accountModal.findOne({
            $or: [{ email: email }, { rawEmail: email }]
        }).select("rawEmail");

        if (!findEmail) {
            console.log("Email not found reversing");
            return {
                success: false,
                message: "Email not found",
                errCode: { emailField: "Email Not found" },
                data: null
            }
        }

        // creating the token
        const generateCode = Math.floor(100000 + Math.random() * 900000).toString();
        const cryptoGenerted = crypto.createHash("sha256").update(generateCode).digest("hex");
        await tokenModal.create({
            userID: findEmail._id,
            tokenHash: cryptoGenerted,
            expiresAt: new Date(Date.now() + 20 * 60 * 1000)
        });

        const jwtToken = jsonwebtoken.sign(
            {
                token: cryptoGenerted,
                userID: findEmail._id
            },
            process.env.JWTTOKENCODE,
            {
                algorithm: "HS256",
                expiresIn: "20m",
            }
        );
        const generateURL = `http://localhost:5500/reset-password.html?token=${jwtToken}`;
        emailUtils.resetPasswordEmailSenderUtils(email, generateURL);
        return {
            success: true,
            message: "Email verfication code send",
            errCode: null,
            status: 201,
            data: null
        }
    } catch (error) {
        throw error;
    }
}

const verifyResetPasswordTokenService = async function (jwtToken) {
    try {
        const authToken = jwtToken.trim();
        const decodeAuthToken = jsonwebtoken.verify(authToken, process.env.JWTTOKENCODE);
        const { token, userID } = decodeAuthToken;

        if (token === "" || userID === "") {
            // Validation on token
            return {
                success: false,
                message: "This link is no longer valid",
                errCode: { tokenField: "TOKEN_EXPIRED" },
                status: 401,
                data: null,
            }
        }

        const findingToken = await tokenModal.findOne({ userID })
            .sort({ createdAt: -1 });
        console.log(findingToken);

        if (!findingToken) {
            console.log("empty working");

            return {
                success: false,
                message: "This link is no longer valid",
                errCode: { tokenField: "TOKEN_EXPIRED" },
                status: 401,
                data: null,
            }
        }

        if (token !== findingToken.tokenHash) {
            return {
                success: false,
                message: "This link is no longer valid",
                errCode: { tokenField: "TOKEN_EXPIRED" },
                status: 401,
                data: null,
            }
        }
        return {
            success: true,
            message: "Link Verfied",
            errCode: null,
            status: 200,
            data: null,
        }
    } catch (error) {
        throw error;
    }
}

const resetPasswordUpdateService = async function (jwtToken, password, confirmPassword) {
    try {
        if (password !== confirmPassword) {
            return {
                success: false,
                message: "Password not match",
                errCode: { tokenField: "PASSWORD_NOT_MATCHED" },
                status: 401,
                data: null,
            }
        }
        const authToken = jwtToken.trim();
        const decodeAuthToken = jsonwebtoken.verify(authToken, process.env.JWTTOKENCODE);
        const { token, userID } = decodeAuthToken;

        const findingToken = await tokenModal.findOne({ userID })
            .sort({ createdAt: -1 });

        if (!findingToken) {
            return {
                success: false,
                message: "This link is no longer valid",
                errCode: { tokenField: "TOKEN_EXPIRED" },
                status: 401,
                data: null,
            }
        }

        if (token !== findingToken.tokenHash) {
            return {
                success: false,
                message: "This link is no longer valid",
                errCode: { tokenField: "TOKEN_EXPIRED" },
                status: 401,
                data: null,
            }
        }

        const setPassword = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { password }, $addToSet: { authProvider: "local" } });

        await tokenModal.deleteMany({ userID });

        return {
            success: true,
            message: "Password Updated",
            errCode: null,
            data: null,
            status: 201
        }
    } catch (error) {
        throw error;
    }
}

const GetimageUserProfileService = async function (userID) {
    try {
        let fetchingUserProfileDB = await accountModal.findById(userID)
            .select("profile -_id");

        if (!fetchingUserProfileDB) {
            return {
                success: false,
                message: "Account do not Exits",
                errCode: { field: "username", message: "Account does not Exit" },
                status: 400,
                data: null
            }
        }
        return {
            success: true,
            message: "Profile Image",
            errCode: null,
            status: 200,
            data: { image: fetchingUserProfileDB.profile.url }
        }
    } catch (error) {
        next(error);
    }
}

const PostImageUserProfileService = async function (userID, image) {
    try {
        let validatingProfileImageStatus = await accountModal.findById(userID);
        if (!validatingProfileImageStatus) {
            return {
                success: false,
                message: "Account do not Exits",
                errCode: { field: "image", message: "Account does not Exit" },
                status: 404,
                data: null
            }
        }

        if (validatingProfileImageStatus.status === "username_pending" && validatingProfileImageStatus?.profile?.image_id) {
            try {
                await cloudinary.uploader.destroy(validatingProfileImageStatus.profile.image_id,
                    { resource_type: 'image' });
            } catch (error) {
                console.log("Image deleting failed due to ", error.message);
            }
        }

        const imageUrl = await (uploadProfilePromises(image));

        let updatingProfilePhoto = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { profile: imageUrl, status: "active" } },
            { returnDocument: 'after' }
        ).select("name profile status");

        return {
            success: true,
            message: "Profile Image uploaded",
            errCode: null,
            status: 201,
            data: { image: updatingProfilePhoto.profile.url }
        };

    } catch (error) {
        throw error;
    }
}

const updateImageUserProfileService = async function (userID, image) {
    try {
        let findUserProfile = await accountModal.findById(userID).select("profile");
        let uploadImage = await (uploadProfilePromises(image));

        if (findUserProfile.profile?.url) {
            let a = await cloudinary.uploader.destroy(findUserProfile.profile.image_id,
                { resource_type: 'image' });
            console.log(a);

        }

        let updateProfileImage = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { profile: uploadImage, status: "active" } },
            { "returnDocument": "after" }
        );
        return {
            success: true,
            message: "Profile Image deleted",
            errCode: null,
            status: 201,
            data: updateProfileImage.profile.url
        }
    } catch (error) {
        throw error;
    }
}

const deleteImageProfileUserService = async function (userID) {
    try {
        let findUserProfile = await accountModal.findById(userID).select("profile");

        if (!findUserProfile.profile?.url) {
            return {
                success: false,
                message: "Profile Image already deleted",
                errCode: null,
                status: 201,
                data: null
            }
        }

        let response = await cloudinary.uploader.destroy(findUserProfile.profile.image_id,
            { resource_type: 'image' });

        if (response.result === "ok") {
            await accountModal.findByIdAndUpdate(
                userID,
                { $set: { profile: null } },
                { "returnDocument": "after" }
            );
            return {
                success: true,
                message: "Profile Image deleted",
                errCode: null,
                status: 201,
                data: DEFAULT_PROFILE_IMAGE
            }
        } else {
            return {
                success: false,
                message: "No profile image deleted. Try again",
                errCode: null,
                status: 201,
                data: null
            }
        }
    } catch (error) {
        throw error;
    }
}

const fetchUserSettingService = async function (userID) {
    try {
        let userSettingDefault = await accountModal.findById(userID)
            .select("-authProvider -googleId -status -password -email -expireAt -profile.format -profile.image_id -_id -__v");

        return userSettingDefault;
    } catch (error) {
        throw error;
    }
}

const updatePrivacyUserAccountService = async function (userID, isPrivate, ioProfile) {
    try {
        let privacyUpdate = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { isPrivate: isPrivate } },
            { "returnDocument": "after" }
        ).select("isPrivate");

        if (!privacyUpdate.isPrivate) {
            await followModal.updateMany(
                { following: { $in: userID } },
                { $set: { status: "active" } }
            );
            // socketRealTimeUtil.onFollowUnfollowRequestNotification(null, userID, null, ioProfile);
        }
        return privacyUpdate.isPrivate;
    } catch (error) {
        throw error;
    }
}

const usernameupdateUserAccountService = async function (userID, username) {
    try {
        const validateUsernameUserAccount = await accountModal.findOne({ username });

        if (validateUsernameUserAccount) {
            return {
                success: false,
                message: "username already exits",
                errCode: { usernameField: "username already exits" },
                data: null,
                status: 408,

            }
        }

        const updatingUsernameUserAccount = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { username: username } },
            { "returnDocument": "after" }
        ).select("username");

        return {
            success: true,
            message: "username updated",
            errCode: null,
            status: 201,
            data: { userID: updatingUsernameUserAccount._id }
        }
    } catch (error) {
        throw error;
    }
}

const emailAndNameupdateUserAccountService = async function (userID, name, email) {
    try {

        const validateUsernameUserAccount = await accountModal.findOne({
            rawEmail: email, _id: { $ne: userID }
        }).select("rawEmail email");

        const formatedEmail = emailUtils.formatEmail(email);

        if (
            validateUsernameUserAccount?.email === formatedEmail ||
            validateUsernameUserAccount?.rawEmail === email
        ) {
            return {
                success: false,
                message: "email already exits",
                errCode: { emailField: "email already exits" },
                data: null,
                status: 408,

            }
        }

        const updatingEmailandNameUserAccount = await accountModal.findByIdAndUpdate(
            userID,
            { $set: { name, email, rawEmail: email } },
            { "returnDocument": "after" }
        ).select("rawEmail");

        return {
            success: true,
            message: "User account credeients updated",
            errCode: null,
            status: 201,
            data: {
                userID: updatingEmailandNameUserAccount._id,
                rawEmail: updatingEmailandNameUserAccount.rawEmail
            }
        }
    } catch (error) {
        throw error;
    }
}

const passwordUpdateUserAccountService = async function (userID, currentPassword, newPassword, newconfirmPassword) {
    try {
        if (newPassword !== newconfirmPassword) {
            return {
                success: false,
                message: "Passwords do not match",
                errCode: {
                    errorField: "NEW_PWD_ERROR",
                    message: "Passwords do not match"
                },
                data: null,
                status: 401
            }
        }
        if (newPassword.length < 6) {
            return {
                success: false,
                message: "Password lenght should be min 6 char",
                errCode: {
                    errorField: "NEW_PWD_ERROR",
                    message: "Password lenght should be min 6 char"
                },
                data: null,
                status: 401
            }
        }

        const findingUserAccount = await accountModal.findById(userID);

        if (!findingUserAccount.authProvider.includes("local")) {
            return {
                success: false,
                message: "This account is linked with Google. Use Google Login.",
                errCode: {
                    errorField: "NEW_PWD_ERROR",
                    message: "This account is linked with Google. Use forget password."
                },
                data: null,
                status: 401
            }
        }

        if (findingUserAccount.password !== currentPassword) {
            return {
                success: false,
                message: "Current password not matched",
                errCode: {
                    errorField: "CURRENT_PWD_ERROR",
                    message: "Current password not matched"
                },
                data: null,
                status: 401
            }
        }

        await accountModal.findByIdAndUpdate(
            userID,
            { $set: { password: newPassword } });

        return {
            success: true,
            message: "Password update successfully",
            errCode: null,
            data: null,
            status: 201
        }
    } catch (error) {
        throw error;
    }
}

const deleteProfileUserAccountService = async function (userID) {
    try {
        const deletingRequest = await accountModal.findByIdAndDelete(userID);

        return {
            success: true,
            message: "Profile deleted successfully",
            errCode: null,
            data: null,
            status: 201
        }
    } catch (error) {
        throw error;
    }
}

export default {
    // Login and Sign up
    createAccountService,
    authGoogleService,
    authGoogleCreateService,
    verifyUserTokenService,
    tokenResendUserService,
    emailTokenSendforgetPasswordService,
    verifyResetPasswordTokenService,
    resetPasswordUpdateService,

    // User account
    fetchUserSettingService,
    loginUserAccountService,
    GetimageUserProfileService,
    PostImageUserProfileService,
    updateImageUserProfileService,
    deleteImageProfileUserService,
    updatePrivacyUserAccountService,
    usernameupdateUserAccountService,
    emailAndNameupdateUserAccountService,
    passwordUpdateUserAccountService,
    deleteProfileUserAccountService
}