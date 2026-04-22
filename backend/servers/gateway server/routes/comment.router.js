import express from "express"

import authMiddleware from "../middleware/authMiddleware.js";
import commentController from "../controller/comment.controller.js";


export const commentRouter = express.Router()

commentRouter.get("/:postID",
    authMiddleware.authMiddlewareToken,
    commentController.getCommentsController
);

commentRouter.post("/",
    authMiddleware.authMiddlewareToken,
    commentController.addCommentController
);