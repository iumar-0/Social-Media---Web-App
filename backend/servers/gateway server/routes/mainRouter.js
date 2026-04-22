import express from "express";
import { authRouter } from "./auth.js";
import { postRouter } from "./postRouter.js";
import { userProfileRouter } from "./user.profileRouter.js";
import { commentRouter } from "./comment.router.js";

export const mainRouter = express.Router();

mainRouter.use("/v1/auth", authRouter);

mainRouter.use("/v1/user", userProfileRouter);

mainRouter.use("/v1/post", postRouter);

mainRouter.use("/v1/comment", commentRouter);