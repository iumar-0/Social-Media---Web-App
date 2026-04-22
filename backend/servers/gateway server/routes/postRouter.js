import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadImageMiddleware from "../middleware/uploadImageMiddleware.js";
import userPostController from "../controller/userPostController.js";

export const postRouter = express.Router();


postRouter.get("/all",
    authMiddleware.authMiddlewareToken,
    userPostController.getAllPosts
);

postRouter.post("/upload",
    authMiddleware.authMiddlewareToken,
    uploadImageMiddleware.upload_image_post,
    userPostController.userAddPostController
);
postRouter.delete("/:postID/delete",
    authMiddleware.authMiddlewareToken,
    userPostController.userDeletePostController
);

postRouter.post("/:postID/like",
    authMiddleware.authMiddlewareToken,
    userPostController.likeUserPostController
);

postRouter.delete("/:postID/unlike",
    authMiddleware.authMiddlewareToken,
    userPostController.unlikeUserPostController
);

// postRouter.post('/comment',
//     authMiddleware.authMiddlewareToken,
//     userPostController.postComment
// );

// postRouter.get('/comment/:postID',
//     authMiddleware.authMiddlewareToken,
//     userPostController.fetchComments
// );