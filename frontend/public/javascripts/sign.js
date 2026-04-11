let resendOTPTries = 1;
const fetchCalls = {
    BASE_URL: "http://localhost:3000/",
    SIGNUP_URL: "http://localhost:3000/v1/auth/sign-up",
    TOKEN_URL: "http://localhost:3000/v1/auth/token",
    PROFILE_UPLOAD_URL: "http://localhost:3000/v1/user/profile/image",

}

const signUpPage = {
    timerRow: document.querySelector("#codeTimerRow"),
    timerShow: document.querySelector("#codeTimerCount"),
    codeReSendButton: document.querySelector("#codeResendRow"),
    tokenFieldError: document.querySelector("#tokenFieldError"),
    optLoader: document.querySelector("#loader-opt"),
    optLoaderResend: document.querySelector("#loader-opt-reSend"),
    otpFieldInput: document.querySelector("#opt-code-input-field"),
    optSubmitButton: document.querySelector("#codeVerifyBtn"),
    authPage: document.querySelector(".auth-right"),
    formPage: document.querySelector(".right-panel"),
    profileUploadPage: document.querySelector("#uploadCard"),
    mainPanelPage: document.querySelector(".main-panel"),
    createAccountLoader: document.querySelector("#loader-createAccount")
}

let submitButton = document.querySelector("#create-account-form-button");

const formErrorMessage = {
    name: document.querySelector("#strength-name"),
    username: document.querySelector("#strength-username"),
    email: document.querySelector("#strength-email"),
    password: document.querySelector("#strength-password-1"),
    passwordReenter: document.querySelector("#strength-password-2"),
    agreeCheck: document.querySelector("#agree-button-error"),
    submitButtonError: document.querySelector("#submitButton-error"),
}

const formValues = {
    name: document.querySelector("#user-name"),
    username: document.querySelector("#username-account"),
    email: document.querySelector("#user-email"),
    password: document.querySelector("#user-password"),
    passwordReenter: document.querySelector("#user-password-reEnter"),
    agreeButton: document.querySelector("#agree-checkBox")
}

submitButton.addEventListener("click", async (dets) => {
    try {
        dets.preventDefault();

        // validate User Field
        let validationResponse = validateUserInputField();
        if (!validationResponse) {
            return;
        }

        signUpPage.createAccountLoader.classList.remove("display-none");
        submitButton.disabled = true;

        const formDataSignUp = {
            name: formValues.name.value.trim(),
            username: formValues.username.value.trim(),
            email: formValues.email.value.trim(),
            password: formValues.password.value.trim(),
        };

        let response = await fetch(`${fetchCalls.SIGNUP_URL}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formDataSignUp)
        });

        let output = await response.json();
        console.log(output);

        if (!output.success) {
            output.errCode.forEach(value => {
                console.log(value);
                formErrorMessage[`${value.field}`].textContent = value.message;
                formErrorMessage[`${value.field}`].classList.remove("display-none");
            });
        } else if (output.success) {
            signUpPage.formPage.classList.add("display-none");
            signUpPage.authPage.classList.remove("display-none");
            reSendEmailTimer(1);
        }
        signUpPage.createAccountLoader.classList.add("display-none");
        submitButton.disabled = false;
    } catch (error) {
        console.log(error);
        console.log("Error ", error.message);
        formErrorMessage.passwordReenter = "Try again after some time..."
    }
});

function validateUserInputField() {

    Object.values(formErrorMessage).forEach(element => element.classList.add("display-none"));

    const nameValue = formValues.name.value.trim();
    const usernameValue = formValues.username.value.trim();
    const emailValue = formValues.email.value.trim();
    const passwordValue = formValues.password.value.trim();
    const passwordRenEnterValue = formValues.passwordReenter.value.trim()
    const agreeCheckedValue = formValues.agreeButton.checked;

    let isValid = true;
    if (nameValue === "") {
        showErrorResponse("name", "Name field is required");
        isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(nameValue)) {
        showErrorResponse("name", "Name should only contain letters");
        isValid = false;
    }

    if (usernameValue === "") {
        showErrorResponse("username", "Username field is required");
    }

    if (emailValue === "") {
        showErrorResponse("email", "Email field is required");
        isValid = false;
    }

    if (!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailValue))) {
        showErrorResponse("email", "Email format is not correct");
        isValid = false;
    }

    if (passwordValue === "") {
        showErrorResponse("password", "Password field is required");
        isValid = false;
    }

    if (passwordValue.length < 5) {
        showErrorResponse("password", "Password length should be 5 digits");
        isValid = false;
    }

    if (passwordRenEnterValue === "") {
        showErrorResponse("passwordReenter", "Password Re-Enter field is required");
        isValid = false;
    }

    if (passwordValue !== passwordRenEnterValue) {
        showErrorResponse("passwordReenter", "Password Re-Enter doesn't match");
        isValid = false;
    }

    if (!agreeCheckedValue) {
        showErrorResponse("agreeCheck", "Agree is required...")
    }
    return isValid;
}

function showErrorResponse(element, message) {
    formErrorMessage[`${element}`].classList.remove("display-none");
    formErrorMessage[`${element}`].textContent = message;
}

async function verifyCode() {
    let OTPCode = signUpPage.otpFieldInput.value.trim();

    if (!OTPCode) {
        signUpPage.tokenFieldError.textContent = "Input Field is Empty";
        return;
    } else if (!/^\d{6}$/.test(OTPCode)) {
        signUpPage.tokenFieldError.textContent = "Input field should have digits of 6 length";
        return;
    }

    signUpPage.optLoader.classList.remove("display-none");
    signUpPage.optSubmitButton.disabled = true;
    let response = await fetch(fetchCalls.TOKEN_URL, {
        method: "POST",
        credentials: "include",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tokenField: OTPCode })
    });
    let output = await response.json();
    console.log(output);

    if (!output.success) {
        if (output.errCode[0]?.render === "LOGIN_PAGE") {
            window.location.reload();
            return;
        }
        signUpPage.tokenFieldError.textContent = output.errCode[0].message;

    } else if (output.success && output?.data?.profileImage === "UPLOAD_IMAGE") {
        signUpPage.mainPanelPage.classList.add("display-none");
        signUpPage.profileUploadPage.classList.remove("display-none");

    } else {
        window.location.replace("/feed.html");
    }
    signUpPage.optLoader.classList.add("display-none");
    signUpPage.optSubmitButton.disabled = false;

}

function reSendEmailTimer(customTime = 1) {
    signUpPage.codeReSendButton.classList.add("display-none");
    signUpPage.timerRow.classList.remove("display-none");

    let endTime = Date.now() + (60000 * customTime);
    let count = setInterval(() => {
        let remaining = Math.max(0, endTime - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        signUpPage.timerShow.textContent = seconds;
        if (seconds <= 0) {
            signUpPage.codeReSendButton.classList.remove("display-none");
            signUpPage.timerRow.classList.add("display-none");
            clearInterval(count);
        }
    }, 250)
}


async function resendCode() {
    signUpPage.optLoaderResend.classList.remove("display-none");
    signUpPage.codeReSendButton.disabled = true;
    let response = await fetch(fetchCalls.TOKEN_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
    });

    let output = await response.json();
    console.log(output);

    if (!output.success) {
        if (output.errCode[0]?.render === "LOGIN_PAGE") {
            window.location.reload();
            return;
        }
        signUpPage.tokenFieldError.textContent = output.errCode[0].message;
    } else if (output.success) {
        reSendEmailTimer(resendOTPTries);
        resendOTPTries++;
    }
    signUpPage.optLoaderResend.classList.add("display-none");
    signUpPage.codeReSendButton.disabled = false;

}


let imageInput = document.querySelector("#photoInput");
let errorImageInput = document.querySelector("#image-input-error");
let imageDisplay = document.querySelector("#photoPreview");
let avatarDefaultImage = document.querySelector(".avatar-icon");
let uploadImageButton = document.querySelector("#uploadBtn");
let profileLoaderButton = document.querySelector("#profile-loader-spin");

function handlePhotoPreview(file) {
    let image = file[0];
    let imageDetails = image.type.split("/");


    if (imageDetails[0] !== "image") {
        errorImageInput.textContent = "Only Images are allowed";
        return
    } else if (!["jpg", "png", "jpeg", "webp"].includes(imageDetails[1])) {
        errorImageInput.textContent = "Only .jpg, .jpeg, .png, .webp";
        return
    } else if (file.length > 1) {
        errorImageInput.textContent = "Only one image is allowed";
        return;
    }
    errorImageInput.textContent = "";
    imagePreviewRender(image);
}

function imagePreviewRender(image) {
    let imageRender = URL.createObjectURL(image);
    imageDisplay.src = imageRender;

    imageDisplay.onload = () => {
        imageDisplay.classList.remove("display-none");
        avatarDefaultImage.classList.add("display-none");
        uploadImageButton.disabled = false;
        URL.revokeObjectURL(imageRender);
    }
}

async function uploadPhoto() {
    try {
        uploadImageButton.disabled = true;
        profileLoaderButton.classList.remove("display-none");
        let image = imageInput.files[0];

        let profileFormData = new FormData();
        profileFormData.append("image", image);

        let response = await fetch(fetchCalls.PROFILE_UPLOAD_URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json",
            },
            body: profileFormData
        });

        let output = await response.json();
        console.log(output);
        if (output?.success) {
            window.location.replace("/feed.html");
            return;
        } else {
            errorImageInput.textContent = output.errCode.message;
        }
        uploadImageButton.disabled = false;
        profileLoaderButton.classList.add("display-none");
    } catch (error) {
        console.log(error);
    }
} 