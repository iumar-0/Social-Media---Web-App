import express from "express"
import authMiddleware from "../middleware/authMiddleware.js"

export const chatRouter = express.Router();

chatRouter.post("/",
    authMiddleware.authMiddlewareToken,
);

chatRouter.get("/:postID",
    authMiddleware.authMiddlewareToken,
);
