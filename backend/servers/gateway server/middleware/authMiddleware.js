import jsonwebtoken from "jsonwebtoken";

import { accountModal } from "../modal/account.modal.js";

const authMiddlewareToken = async function (req, res, next) {
    let token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token not found. Try again",
            errCode: [{ token: "tokenField", message: "Token not found. Try again" }],
            data: null
        });
    }

    try {
        const decode = jsonwebtoken.verify(token, process.env.JWTTOKENCODE);
        req.userID = decode.token;

        const validateUserID = await accountModal.findById(req.userID);
        if (!validateUserID) {
            // if user doesnot exit in Database >>>>
            return res.status(401).json({
                success: false,
                message: "User not found",
                errCode: [{ token: "tokenField", message: "User not found", render: "LOGIN_PAGE" }],
                data: null
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token Expired",
            errCode: [{ token: "tokenField", message: "Token Expired.", render: "LOGIN_PAGE" }],
            data: null
        });

    }
}

const googleAuthMiddlewareToken = async function (req, res, next) {
    const authCookie = req.cookies?.chattreAuth;
    if (!authCookie) {
        return res.status(401).json({
            success: false,
            message: "Session expired. Try again",
            errCode: { token: "tokenField", message: "Session expired. Try again" },
            data: null
        });
    }
    try {
        const decode = jsonwebtoken.verify(authCookie, process.env.JWTTOKENCODE);
        req.userAuthDetails = decode.token;
        next();
    } catch (error) {
        if (error instanceof jsonwebtoken.JsonWebTokenError || error instanceof jsonwebtoken.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Token Expired",
                errCode: { token: "tokenField", message: "Token Expired. Try again" },
                data: null
            });
        }
        next(error);
    }
}

export default {
    authMiddlewareToken,
    googleAuthMiddlewareToken
}