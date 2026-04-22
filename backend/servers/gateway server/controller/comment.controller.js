import commentService from "../service/comment.service.js";

const getCommentsController = async (req, res, next) => {
    try {
        const { postID } = req.params;
        const parentID = req.query?.parentID || null;
        const cursor = req.query?.cursor || null;

        const { userID } = req;

        const commentGetResponse = await commentService.getCommentsService(userID,
            postID, parentID, cursor);

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.status(200).json({
            success: commentGetResponse.success,
            message: commentGetResponse.message,
            errCode: commentGetResponse.errCode,
            data: commentGetResponse.data
        });
    } catch (error) {
        next(error);
    }
}


const addCommentController = async function (req, res, next) {
    try {
        const { userID } = req;
        const { postID, comment, parentId } = req.body;

        if (!postID) {
            return res.status(401).json({
                success: false,
                message: "Post ID is required",
                errCode: { commentField: "Post ID is required" },
                data: null
            });
        }
        if (!comment.trim()) {
            return res.status(401).json({
                success: false,
                message: "Comment is empty",
                errCode: { commentField: "Comment is empty" },
                data: null
            });
        }

        const addCommentResponse = await commentService.addCommentService(
            userID,
            postID,
            comment,
            parentId || null,
        )

        res.status(200).json({
            success: addCommentResponse.success,
            message: addCommentResponse.message,
            errCode: addCommentResponse.errCode,
            data: addCommentResponse.data
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getCommentsController,
    addCommentController
}