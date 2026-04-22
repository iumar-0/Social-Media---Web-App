import postService from "../service/postService.js";
import cookieAssign from "../utils/cookieAssign.js";

const getAllPosts = async function (req, res, next) {
    try {
        let { userID } = req;
        const allPostData = await postService.getAllPostService(userID);

        cookieAssign.assignCookieToken(
            res,
            userID,
            "token",
            "7d",
            7 * 24 * 60 * 60 * 1000,
        );

        return res.status(200).json({
            success: true,
            message: "All posts",
            errCode: null,
            data: {
                posts: allPostData.postData,
                mapToSidebarProfile: allPostData.mapToSidebarProfile
            }
        });
    } catch (error) {
        next(error);
    }
}

const userAddPostController = async function (req, res, next) {
    try {
        if (req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Image is required",
                errCode: [{
                    field: "image",
                    message: "Image is required",
                    render: "IMAGE_VALIDATION"
                }],
                data: null
            });
        }

        let { userID } = req;
        let { description } = req.body;


        const userPostAddResponse = await postService.userAddPostService(userID, req.files, description);


        if (!userPostAddResponse.success) {
            return res.status(userPostAddResponse.status).json({
                success: false,
                message: userPostAddResponse?.message || null,
                errCode: userPostAddResponse?.errCode || null,
                data: null
            });
        }
        cookieAssign.assignCookieToken(
            res,
            userID,
            "token",
            "7d",
            7 * 24 * 60 * 60 * 1000,
        );

        return res.status(201).json({
            success: true,
            message: userPostAddResponse.message,
            errCode: null,
            data: userPostAddResponse.data
        });
    } catch (error) {
        next(error);
    }
}

const userDeletePostController = async function (req, res, next) {
    try {
        const { userID } = req;
        const { postID } = req.params;

        const deletePostResponse = await postService.userDeletePostService(postID);

        cookieAssign.assignCookieToken(
            res,
            userID,
            "token",
            "7d",
            7 * 24 * 60 * 60 * 1000,
        );

        return res.status(deletePostResponse.status).json({
            success: deletePostResponse.success,
            message: deletePostResponse.message,
            errCode: deletePostResponse.errCode,
            data: deletePostResponse.data
        });
    } catch (error) {
        next(error);
    }
}

const likeUserPostController = async function (req, res, next) {
    try {
        let { userID } = req;
        let { postID } = req.params;

        let callingLikeService = await postService.likeUserPostService(userID, postID);

        if (!callingLikeService.success) {
            return res.status(201).json({
                success: false,
                message: callingLikeService?.message,
                errCode: null,
                data: null
            });
        }

        return res.status(201).json({
            success: true,
            message: callingLikeService.message,
            errCode: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

const unlikeUserPostController = async function (req, res, next) {
    try {
        let { userID } = req;
        let { postID } = req.params;

        let callingunLikeService = await postService.unlikeUserPostService(userID, postID);

        if (!callingunLikeService.success) {
            return res.status(201).json({
                success: false,
                message: callingunLikeService.message,
                errCode: null,
                data: null
            });
        }

        return res.status(201).json({
            success: true,
            message: callingunLikeService.message,
            errCode: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}


export default {
    getAllPosts,
    userAddPostController,
    userDeletePostController,
    likeUserPostController,
    unlikeUserPostController,
}