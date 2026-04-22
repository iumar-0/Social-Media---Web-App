import cloudinary from "../config/configcloudinary.js"

export const uploadImagesPromises = (images) => {
    return images.map(imageValue => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                {
                    folder: "chattera/post",
                    resource_type: "auto"
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve({
                        url: result.secure_url,
                        image_id: result.public_id,
                        format: result.format,
                        resource_type: result.resource_type
                    });
                }
            );
            // sending the image buffer
            stream.end(imageValue.buffer);
        });
    });
}

export function uploadProfilePromises(image) {
    return new Promise((resolve, reject) => {

        let stream = cloudinary.uploader.upload_stream(
            { folder: "chattera/profile" },
            (error, result) => {
                if (error) reject(error)
                else resolve({
                    url: result.secure_url,
                    image_id: result.public_id,
                    format: result.format,
                    resource_type: result.resource_type
                });
            }
        );
        // sending the image buffer
        stream.end(image.buffer);
    });
}

export const URLuploadProfilePromise = async function (imageURl) {
    try {
        let uploadProfile = await cloudinary.uploader.upload(imageURl, {
            folder: "chattera/profile",
            overwrite: false,
            resource_type: "image"
        });

        return {
            url: uploadProfile.secure_url,
            image_id: uploadProfile.public_id,
            format: uploadProfile.format,
            resource_type: uploadProfile.resource_type
        }
    } catch (error) {
        throw error;
    }
}

export const deletePostPromise = async function (deletePayloadImages, deletePayloadVideo) {
    try {
        await Promise.all([
            (deletePayloadImages.length > 0) ? cloudinary.api.delete_resources(deletePayload, { resource_type: "image" })
                : Promise.resolve(null),

            (deletePayloadVideo.length > 0) ? cloudinary.api.delete_resources(deletePayload, { resource_type: "video" })
                : Promise.resolve(null),
        ]);
    } catch (error) {
        throw error;
    }
}