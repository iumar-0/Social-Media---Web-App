import { accountModal, DEFAULT_PROFILE_IMAGE } from "../modal/account.modal.js";

const getSideBarProfile = async function (userID) {
    try {
        const profileofCurrentUser = await accountModal.findById(userID)
            .select("name username profile.url");

        return {
            name: profileofCurrentUser.name,
            username: profileofCurrentUser.username,
            profile: profileofCurrentUser.profile.url || DEFAULT_PROFILE_IMAGE,
        };
    } catch (error) {
        throw error;
    }
}

export default {
    getSideBarProfile,
}