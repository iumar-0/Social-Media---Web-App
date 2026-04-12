// URL Backend 
const MAIN_BACKEND_URL = "http://localhost:3000/v1"

// Client Side login code GoogleAuth
const CLIENT_ID = "YOUR_GOOGLE_AUTH_CLIENT_CODE";


const googleLoginButton = document.querySelector(".btn-google");
const googleLoginError = document.getElementById("strength-auth-emial");

const profileUsernamePage = document.querySelector("#usernameCard");
const mainRightPanelPage = document.querySelector(".right-panel");

const usernameInputField = document.querySelector("#username-field");
const errorUsernameInputField = document.querySelector("#username-error-msg");




googleLoginButton.addEventListener("click", (dets) => {
    google.accounts.id.renderButton(document.querySelector(".btn-google"),
        {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            logo_alignment: "left",
        });
});

const handleCredentialResponse = async (authData) => {
    if (!authData || !authData.credential) {
        googleLoginError.classList.remove("display-none");
        googleLoginError.textContent = "Try again after some time";
        return;
    }
    console.log(authData);

    let response = await fetch(`${MAIN_BACKEND_URL}/auth/google/token`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: authData?.credential })
    });

    let output = await response.json();
    console.log(output);

    if (!output.success) {
        googleLoginError.textContent = `${output.errCode.authError}`;
        return
    }
    if (output.data.accountStatus === "USERNAME_PENDING") {
        profileUsernamePage.classList.remove("display-none");
        mainRightPanelPage.classList.add("display-none");
        return
    }
    console.log("login successfull");
    window.location.href = ("/feed.html");
}

function googlePopup() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        use_fedcm_for_prompt: false
    });

    google.accounts.id.prompt((Notification) => {
        if (Notification.isSkippedMoment()) {
            console.log("Google login dismissed");
        }

        if (Notification.isNotDisplayed()) {
            const reason = Notification.getNotDisplayedReason();

            if (reason === "suppressed_by_user") {
                console.log("User previously dismissed → fallback");
            }
        }
    });
}

const submitFinalRegistration = async function (dets) {

    if (!usernameInputField.value.trim()) {
        errorUsernameInputField.classList.remove("display-none");
        errorUsernameInputField.textContent = "Username is empty";
        return
    }
    dets.disabled = true;
    dets.querySelector("#username-loader-spin").classList.remove("display-none");
    errorUsernameInputField.classList.add("display-none");
    let response = await fetch(`${MAIN_BACKEND_URL}/auth/google/token/callback`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInputField.value })
    });

    let output = await response.json();
    console.log(output);

    if (output.success) {
        console.log("login successfull");
        window.location.replace("/feed.html");
    }
    errorUsernameInputField.classList.remove("display-none");
    if (output?.errCode?.username === "USERNAME_UNIQUE") {
        errorUsernameInputField.textContent = "Username already exits";
    }
    if (output?.errCode?.token) {
        errorUsernameInputField.textContent = output?.errCode?.message;
    }
    dets.querySelector("#username-loader-spin").classList.add("display-none");
    dets.disabled = false;
}