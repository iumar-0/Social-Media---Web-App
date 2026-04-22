import express from "express"

import authMiddleware from "../middleware/authMiddleware.js";
import accountController from "../controller/accountController.js";
import profileController from "../controller/profile.controller.js";
import uploadImageMiddleware from "../middleware/uploadImageMiddleware.js";

export const userProfileRouter = express.Router();


userProfileRouter.route("/profile/image")
    .get(authMiddleware.authMiddlewareToken,
        accountController.GetImageProfileUserController)

    .post(authMiddleware.authMiddlewareToken,
        uploadImageMiddleware.upload_profile_image,
        accountController.PostImageProfileUserController)

    .patch(authMiddleware.authMiddlewareToken,
        uploadImageMiddleware.upload_profile_image,
        accountController.updateImageProfileUserController)

    .delete(authMiddleware.authMiddlewareToken,
        accountController.deleteImageProfileUserController
    );

userProfileRouter.get("/profile/setting",
    authMiddleware.authMiddlewareToken,
    accountController.fetchUserSettingsController
);

userProfileRouter.patch("/profile/privacy",
    authMiddleware.authMiddlewareToken,
    accountController.updatePrivacyUserAccountController
);

userProfileRouter.patch("/profile/username",
    authMiddleware.authMiddlewareToken,
    accountController.usernameupdateUserAccountController
)

userProfileRouter.patch("/profile/update/me/identity",
    authMiddleware.authMiddlewareToken,
    accountController.emailAndNameupdateUserAccountController
)

userProfileRouter.patch("/profile/update/password",
    authMiddleware.authMiddlewareToken,
    accountController.passwordUpdateUserAccountController
)

userProfileRouter.delete("/profile/delete",
    authMiddleware.authMiddlewareToken,
    accountController.deleteProfileUserAccountController
)

// Profile Page

userProfileRouter.get("/profile/:username",
    authMiddleware.authMiddlewareToken,
    profileController.getAccountProfileController
);

userProfileRouter.post("/profile/follow",
    authMiddleware.authMiddlewareToken,
    profileController.profileFollowRequestController
);

userProfileRouter.delete("/profile/unfollow",
    authMiddleware.authMiddlewareToken,
    profileController.profileFollowDeleteRequestController
);

userProfileRouter.get("/requests/pending",
    authMiddleware.authMiddlewareToken,
    profileController.getPendingRequestsController
)

// accept request
userProfileRouter.patch("/requests/accept/:requesterID",
    authMiddleware.authMiddlewareToken,
    profileController.acceptFollowRequestController
)

// delete request
userProfileRouter.delete("/requests/delete/:requesterID",
    authMiddleware.authMiddlewareToken,
    profileController.deleteFollowRequestController
)