import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";

import accountService from '../service/accountService.js';
import cookieAssign from '../utils/cookieAssign.js';

const TIME_7Days = 7 * 24 * 60 * 60 * 1000

const createUserAccountController = async function (req, res, next) {
    try {
        let formUserData = req.body;

        let createAccount = await accountService.createAccountService(formUserData);

        if (!createAccount.success) {
            return res.status(createAccount.status).json({
                success: false,
                message: createAccount.message,
                errCode: createAccount.errCode,
                data: null
            });
        }
        cookieAssign.assignCookieToken(
            res,
            createAccount.data.userID,
            "token",
            "15m",
            24 * 60 * 60 * 1000,
        );

        return res.status(201).json({
            success: true,
            message: "Account Created Successfully",
            errCode: null,
            data: null
        });
    } catch (error) {
        next(createHttpError(404, error.message));
    }
}

const authGoogleController = async function (req, res, next) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google token is missing",
                errCode: { authError: "Try again after some time" },
                data: null
            });
        }

        const responseAuthService = await accountService.authGoogleService(res, credential);

        return res.status(responseAuthService.status).json({
            success: responseAuthService.success,
            message: "Google login Successfull",
            errCode: responseAuthService.errCode,
            data: { accountStatus: responseAuthService?.data?.accountStatus }
        });

    } catch (error) {
        console.log(error);

        if (error.stack.includes('google-auth-library')) {
            return res.status(400).json({
                success: false,
                message: "Google token Error",
                errCode: { authError: "Google verification failed. Please login again." },
                data: null
            });
        }
        next(error);
    }
}

const authGoogleCreateAccountController = async function (req, res, next) {
    try {
        const { userAuthDetails } = req;
        const { username } = req.body;


        if (!username.trim()) {
            return res.status(401).json({
                success: false,
                message: "username is missing",
                errCode: { authError: "username is missing" },
                data: null
            });
        }

        const responseAuthCreateService = await accountService.authGoogleCreateService(userAuthDetails, username);
        if (responseAuthCreateService.success) {
            cookieAssign.assignCookieToken(
                res,
                responseAuthCreateService.data,
                "token",
                "7d",
                TIME_7Days
            );
        }

        return res.status(responseAuthCreateService.status).json({
            success: responseAuthCreateService.success,
            message: responseAuthCreateService.message,
            errCode: responseAuthCreateService.errCode,
            data: { accountStatus: responseAuthCreateService?.data?.accountStatus || null }
        });
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(401).json({
                success: false,
                message: "Username already exits",
                errCode: { username: "USERNAME_UNIQUE" },
                data: null
            });
        }
        next(error);
    }
}

const verifyTokenController = async function (req, res, next) {
    try {
        let { userID } = req;
        console.log("user id", userID);

        let { tokenField } = req.body;

        let tokenVerifing = await accountService.verifyUserTokenService(userID, tokenField);

        if (!tokenVerifing.success) {
            return res.status(tokenVerifing.status).json({
                success: false,
                message: tokenVerifing.message,
                errCode: tokenVerifing.errCode,
                data: null
            });
        }

        cookieAssign.assignCookieToken(
            res,
            tokenVerifing.data.userID,
            "token",
            "1d",
            TIME_7Days
        );

        return res.status(201).json({
            success: true,
            message: "Account Verifed Successfully",
            errCode: null,
            data: tokenVerifing.data
        });
    } catch (error) {
        next(error);
    }
}

const tokenReSendController = async function (req, res, next) {
    try {
        let { userID } = req;
        let resendTokenUserLogin = await accountService.tokenResendUserService(userID);

        if (!resendTokenUserLogin.success) {
            return res.status(resendTokenUserLogin.status).json({
                success: false,
                message: resendTokenUserLogin.message,
                errCode: resendTokenUserLogin.errCode,
                data: null
            });
        }
        cookieAssign.assignCookieToken(
            res,
            userID,
            "token",
            "15m",
            15 * 60 * 1000,
        );
        return res.status(201).json({
            success: true,
            message: "Email Resend Successfully",
            errCode: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

const loginUserAccountController = async function (req, res, next) {
    try {
        let { emailOrUsername, password } = req.body;

        let verifingUserAccount = await accountService.loginUserAccountService(emailOrUsername, password);

        if (!verifingUserAccount?.success) {
            if (verifingUserAccount?.errCode[0].render === "OTP_VALIDATION") {

                cookieAssign.assignCookieToken(
                    res,
                    verifingUserAccount.data.userID,
                    "token",
                    "15m",
                    15 * 60 * 1000,
                );
            }
            return res.status(verifingUserAccount.status).json({
                success: false,
                message: verifingUserAccount.message,
                errCode: verifingUserAccount.errCode,
                data: null
            });
        }

        cookieAssign.assignCookieToken(
            res,
            verifingUserAccount.data.userID,
            "token",
            "1d",
            TIME_7Days,
        );

        return res.status(verifingUserAccount.status).json({
            success: true,
            message: verifingUserAccount.message,
            errCode: verifingUserAccount.errCode,
            data: verifingUserAccount.data
        });
    } catch (error) {
        next(error);
    }
}

const emailTokenSendforgetPasswordController = async function (req, res, next) {
    try {
        const { email } = req.body;

        const responseSendEmailOnForgetPassword = await accountService.emailTokenSendforgetPasswordService(email);

        return res.status(200).json({
            success: true,
            message: "Verfication Code Send",
            errCode: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

const verifyResetPasswordTokenController = async function (req, res, next) {
    try {
        const token = req.params?.token;
        if (!token.trim()) {
            return res.status(401).json({
                success: false,
                message: "Token not found",
                errCode: { tokenField: "TOKEN_NOT_FOUND" },
                data: null,
            });
        }

        const responseVerifyResetPasswordToken = await accountService.verifyResetPasswordTokenService(token);

        return res.status(responseVerifyResetPasswordToken.status).json({
            success: responseVerifyResetPasswordToken.success,
            message: responseVerifyResetPasswordToken.message,
            errCode: responseVerifyResetPasswordToken.errCode,
            data: responseVerifyResetPasswordToken.data
        });
    } catch (error) {
        console.log(error);

        if (error instanceof jsonwebtoken.JsonWebTokenError ||
            error instanceof jsonwebtoken.TokenExpiredError || error instanceof SyntaxError) {
            return res.status(401).json({
                success: false,
                message: "Session Expired",
                errCode: { tokenField: "SESSION_EXPIRED" },
                data: null,
            });
        }
        next(error);
    }
}

const resetPasswordUpdateController = async function (req, res, next) {
    try {
        const token = req.params?.token;
        const { password, confirmPassword } = req.body;
        if (!token.trim()) {
            return res.status(401).json({
                success: false,
                message: "Token not found",
                errCode: { tokenField: "TOKEN_NOT_FOUND" },
                data: null,
            });
        }

        const responseResetPassword = await accountService.resetPasswordUpdateService(token, password, confirmPassword);

        return res.status(responseResetPassword.status).json({
            success: responseResetPassword.success,
            message: responseResetPassword.message,
            errCode: responseResetPassword.errCode,
            data: responseResetPassword.data
        });
    } catch (error) {

        if (error instanceof jsonwebtoken.JsonWebTokenError ||
            error instanceof jsonwebtoken.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Session Expired",
                errCode: { tokenField: "SESSION_EXPIRED" },
                data: null,
            });
        }
        next(error);
    }
}

const fetchUserSettingsController = async function (req, res, next) {
    try {
        let { userID } = req;
        let userSettingResponse = await accountService.fetchUserSettingService(userID);

        return res.status(201).json({
            success: userSettingResponse ? true : false,
            message: userSettingResponse ? "User Profile Setting" : "User Profile Setting Not Found",
            data: userSettingResponse ? userSettingResponse : null,
            errCode: null,
        });

    } catch (error) {
        next(error);
    }
}

const GetImageProfileUserController = async function (req, res, next) {
    try {
        let { userID } = req;

        const responseUserProfile = await accountService.GetimageUserProfileService(userID);

        return res.status(responseUserProfile.status).json({
            success: responseUserProfile.success,
            message: responseUserProfile.message,
            errCode: responseUserProfile.errCode,
            data: responseUserProfile.data
        });
    } catch (error) {
        next(error);
    }
}

const PostImageProfileUserController = async function (req, res, next) {
    try {
        let { userID } = req;
        let image = req.file;

        const uploadUserProfileImage = await accountService.PostImageUserProfileService(userID, image);

        return res.status(uploadUserProfileImage.status).json({
            success: uploadUserProfileImage.success,
            message: uploadUserProfileImage.message,
            errCode: uploadUserProfileImage.errCode,
            data: uploadUserProfileImage.data
        });
    } catch (error) {
        next(error);
    }
}

const updateImageProfileUserController = async function (req, res, next) {
    try {
        const { userID } = req;
        const image = req.file;

        const updateUserProfileImage = await accountService.updateImageUserProfileService(userID, image);

        return res.status(201).json({
            success: true,
            message: "Profile Image deleted",
            errCode: null,
            data: { profileUrl: updateUserProfileImage?.data || null }
        });

    } catch (error) {
        next(error);
    }
}

const deleteImageProfileUserController = async function (req, res, next) {
    try {
        let { userID } = req;

        const deletingUserProfileImage = await accountService.deleteImageProfileUserService(userID);

        return res.status(deletingUserProfileImage.status).json({
            success: deletingUserProfileImage.success,
            message: deletingUserProfileImage.message,
            errCode: deletingUserProfileImage.errCode,
            data: { profileUrl: deletingUserProfileImage?.data }
        });
    } catch (error) {
        next(error);
    }
}

const updatePrivacyUserAccountController = async function (req, res, next) {
    try {
        let { userID } = req;
        let { isPrivate } = req.body;

        let io = req.app.get("io");
        let ioProfile = io.profileio;

        const updatePrivacyProfileResponse = await accountService.updatePrivacyUserAccountService(userID, isPrivate, ioProfile);

        return res.status(201).json({
            success: true,
            message: updatePrivacyProfileResponse ? "The profile is private" : "The profile is public",
            errCode: null,
            data: updatePrivacyProfileResponse
        });

    } catch (error) {
        next(error);
    }
}

const usernameupdateUserAccountController = async function (req, res, next) {
    try {
        let { userID } = req;
        let { username } = req.body;

        const updatingUsernameSettingResponse = await accountService.usernameupdateUserAccountService(userID, username);

        if (updatingUsernameSettingResponse.success) {
            cookieAssign.assignCookieToken(
                res,
                updatingUsernameSettingResponse.data.userID,
                "token",
                "7d",
                TIME_7Days
            );
        }

        return res.status(updatingUsernameSettingResponse.status).json({
            success: updatingUsernameSettingResponse.success,
            message: updatingUsernameSettingResponse.message,
            errCode: updatingUsernameSettingResponse.errCode,
            data: updatingUsernameSettingResponse.data
        });
    } catch (error) {
        next(error);
    }
}

const emailAndNameupdateUserAccountController = async function (req, res, next) {
    try {
        let { userID } = req;
        let { name, email } = req.body;

        const NameandEmailupdatingSettingResponse = await accountService.emailAndNameupdateUserAccountService(
            userID, name, email);

        if (NameandEmailupdatingSettingResponse.success) {
            cookieAssign.assignCookieToken(
                res,
                NameandEmailupdatingSettingResponse.data.userID,
                "token",
                "7d",
                TIME_7Days
            );
        }

        return res.status(NameandEmailupdatingSettingResponse.status).json({
            success: NameandEmailupdatingSettingResponse.success,
            message: NameandEmailupdatingSettingResponse.message,
            errCode: NameandEmailupdatingSettingResponse.errCode,
            data: (NameandEmailupdatingSettingResponse.success) ?
                { rawEmail: NameandEmailupdatingSettingResponse?.data?.rawEmail } :
                null
        });
    } catch (error) {
        next(error);
    }
}

const passwordUpdateUserAccountController = async function (req, res, next) {
    try {
        const { userID } = req;
        const { currentPassword, newPassword, newconfirmPassword } = req.body;
        console.log(userID, currentPassword, newPassword, newconfirmPassword);

        const responsePasswordUpdate = await accountService.passwordUpdateUserAccountService(
            userID, currentPassword, newPassword, newconfirmPassword
        );

        return res.status(responsePasswordUpdate.status).json({
            success: responsePasswordUpdate.success,
            message: responsePasswordUpdate.message,
            errCode: responsePasswordUpdate.errCode,
            data: (responsePasswordUpdate.success) ? responsePasswordUpdate.data : null
        });
    } catch (error) {
        next(error);
    }
}

const deleteProfileUserAccountController = async function (req, res, next) {
    try {
        const { userID } = req;

        const responseDeleteAccount = await accountService.deleteProfileUserAccountService(userID);

        return res.status(responseDeleteAccount.status).json({
            success: responseDeleteAccount.success,
            message: responseDeleteAccount.message,
            errCode: responseDeleteAccount.errCode,
            data: responseDeleteAccount.data
        });
    } catch (error) {
        console.log(error);

        // fallback error response
        return res.status(401).json({
            success: false,
            message: "Try again after some time",
            errCode: null,
            data: null
        });
    }
}

export default {
    // Login and Sign up
    createUserAccountController,
    authGoogleController,
    authGoogleCreateAccountController,
    verifyTokenController,
    tokenReSendController,
    emailTokenSendforgetPasswordController,
    verifyResetPasswordTokenController,
    resetPasswordUpdateController,

    // User account
    loginUserAccountController,
    fetchUserSettingsController,
    GetImageProfileUserController,
    PostImageProfileUserController,
    updateImageProfileUserController,
    deleteImageProfileUserController,
    updatePrivacyUserAccountController,
    usernameupdateUserAccountController,
    emailAndNameupdateUserAccountController,
    passwordUpdateUserAccountController,
    deleteProfileUserAccountController
}