import express from "express";

import accountController from "../controller/accountController.js";
import authMiddleware from "../middleware/authMiddleware.js";

export const authRouter = express.Router();

authRouter.post("/sign-up", accountController.createUserAccountController);

authRouter.post("/google/token", accountController.authGoogleController);

authRouter.post("/google/token/callback",
    authMiddleware.googleAuthMiddlewareToken,
    accountController.authGoogleCreateAccountController);

authRouter.use("/token", authMiddleware.authMiddlewareToken);

authRouter
    .route("/token")
    .get(accountController.tokenReSendController)
    .post(accountController.verifyTokenController);

authRouter.post("/login",
    accountController.loginUserAccountController);

// Reset Password Routes
authRouter.post("/forget-password",
    accountController.emailTokenSendforgetPasswordController);

authRouter

    .route("/reset-password/token/:token")
    .get(accountController.verifyResetPasswordTokenController)
    .patch(accountController.resetPasswordUpdateController);