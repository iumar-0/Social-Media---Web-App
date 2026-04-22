import profileAccountService from "../service/profile.account.service.js";



const getAccountProfileController = async (req, res, next) => {
    try {

        let { userID } = req;
        let username = req.params.username;

        const responseUserData = await profileAccountService.getAccountProfileService(userID, username);

        return res.status(responseUserData.status).json({
            success: responseUserData.success,
            message: responseUserData.message,
            data: responseUserData.data,
            errCode: responseUserData.errCode,
        });
    } catch (error) {
        next(error);
    }
}

const profileFollowRequestController = async function (req, res, next) {
    try {
        const userID = req.userID
        const profileID = req.body.profileID


        if (!profileID) {
            return res.status(400).json({
                success: false,
                message: "Profile ID required",
                errCode: "PROFILE_ID_REQUIRED",
                data: null
            });
        }

        const requestResponse = await profileAccountService.profileFollowRequestService(
            userID, profileID);

        return res.status(requestResponse.status).json({
            success: requestResponse.success,
            message: requestResponse.message,
            errCode: requestResponse?.errCode,
            data: requestResponse?.data
        });
    } catch (error) {
        next(error);
    }

}

const profileFollowDeleteRequestController = async function (req, res, next) {
    try {
        const userID = req.userID;
        const profileID = req.body.profileID;

        if (!profileID) {
            return res.status(400).json({
                success: false,
                message: "Profile ID required",
                errCode: "PROFILE_ID_REQUIRED",
                data: null
            })
        }

        const deleteRequestResponse = await profileAccountService.profileFollowDeleteRequestService(
            userID, profileID);

        return res.status(deleteRequestResponse.status).json({
            success: deleteRequestResponse.success,
            message: deleteRequestResponse.message,
            errCode: deleteRequestResponse?.errCode,
            data: deleteRequestResponse?.data
        });
    } catch (error) {
        next(error);
    }
}


export const getPendingRequestsController = async (req, res) => {
    try {
        const result = await profileAccountService.getPendingRequestsService(req.userID)
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ success: false })
    }
}

export const acceptFollowRequestController = async (req, res) => {
    try {
        let io = req.app.get("io");

        const result = await profileAccountService.acceptFollowRequestService(
            req.userID,
            req.params.requesterID,
            io
        );
        console.log(result);

        res.status(result.success ? 200 : 400).json(result)
    } catch (error) {
        res.status(500).json({ success: false })
    }
}

export const deleteFollowRequestController = async (req, res) => {
    try {
        const result = await profileAccountService.deleteFollowRequestService(
            req.userID,
            req.params.requesterID
        )
        console.log(result);
        res.status(result.success ? 200 : 400).json(result)
    } catch (error) {
        res.status(500).json({ success: false })
    }
}
export default {
    getAccountProfileController,
    profileFollowRequestController,
    profileFollowDeleteRequestController,
    getPendingRequestsController,
    acceptFollowRequestController,
    deleteFollowRequestController
}