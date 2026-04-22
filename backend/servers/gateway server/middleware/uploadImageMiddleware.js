import createHttpError from "http-errors";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, errCB) => {

        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            errCB(null, true);
        } else {
            errCB(createHttpError(400, "Only the images and video are allowed"));
        }
    }
});


const upload_image_post = (req, res, next) => {
    try {
        upload.array("post", 10)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_COUNT") {
                    return res.status(400).json({
                        success: false,
                        message: "Files Limit Reached",
                        errCode: { field: "input", message: "Only 10 post are allowed" },
                        data: null
                    });
                }

                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "Files Size Limit",
                        errCode: { field: "input", message: "Only 10 mb posts are allowed" },
                        data: null
                    });
                }
            }
            if (err) throw err;
            next();
        });
    } catch (error) {
        next(error);
    }
}

const upload_profile_image = (req, res, next) => {
    try {
        upload.single("image")(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_COUNT") {
                    return res.status(400).json({
                        success: false,
                        message: "Files Limit Reached",
                        errCode: { field: "input", message: "Only 10 post are allowed" },
                        data: null
                    });
                }

                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "Files Size Limit",
                        errCode: { field: "input", message: "Only 10 mb posts are allowed" },
                        data: null
                    });
                }
            }
            if (err) throw err;
            
            next();
        });
    } catch (error) {
        next(error);
    }
}

export default {
    upload_image_post,
    upload_profile_image
}