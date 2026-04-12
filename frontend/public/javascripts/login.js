let resendOTPTries = 1;
const fetchCalls = {
    BASE_URL: "http://localhost:3000/",
    LOGIN_URL: "http://localhost:3000/v1/auth/login",
    TOKEN_URL: "http://localhost:3000/v1/auth/token",
    PROFILE_UPLOAD_URL: "http://localhost:3000/v1/user/profile/image",

}


const LoginPage = {
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
    loginAccountLoader: document.querySelector("#loader-loginAccount"),
    buttonLoginAccount: document.querySelector(".btn-signin"),
    mainPanelPage: document.querySelector(".main-panel"),
    profileUploadPage: document.querySelector("#uploadCard"),
}

const formErrorMessage = {
    email: document.querySelector("#strength-email"),
    password: document.querySelector("#strength-password"),
}

const formValues = {
    email: document.querySelector("#email-field"),
    password: document.querySelector("#password-field"),
}

LoginPage.buttonLoginAccount.addEventListener("click", async (dets) => {
    try {
        dets.preventDefault();
        let email = formValues.email.value;
        let password = formValues.password.value;
        if (!validateUserInputField(email, password)) {
            return;
        }
        LoginPage.loginAccountLoader.classList.remove("display-none");
        LoginPage.buttonLoginAccount.disabled = true;
        let response = await fetch(fetchCalls.LOGIN_URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ emailOrUsername: email, password: password })
        });

        let output = await response.json();
        console.log(output);

        if (output.success && output?.data?.profileImage === "UPLOAD_IMAGE") {
            LoginPage.mainPanelPage.classList.add("display-none");
            LoginPage.profileUploadPage.classList.remove("display-none");


        } else if (output.success) {
            window.location.replace("/home.html");
            return;


        } else if (output.errCode[0]?.render === "OTP_VALIDATION") {

            LoginPage.formPage.classList.add("display-none");
            LoginPage.authPage.classList.remove("display-none");
            reSendEmailTimer(resendOTPTries);


        } else {
            formErrorMessage[`${output.errCode[0]?.field}`].classList.remove("display-none");
            formErrorMessage[`${output.errCode[0]?.field}`].textContent = output.errCode[0].message;


        }

        LoginPage.loginAccountLoader.classList.add("display-none");
        LoginPage.buttonLoginAccount.disabled = false;
    } catch (error) {
        console.log(error);
    }
});


function validateUserInputField(emailValue, passwordValue) {

    Object.values(formErrorMessage).forEach(element => element.classList.add("display-none"));
    let isValid = true;

    if (emailValue === "") {
        showErrorResponse("email", "Email field is required");
        isValid = false;
    }

    // Only if API requires searching on the Email
    
    // if (!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailValue))) {
    //     showErrorResponse("email", "Email format is not correct");
    //     isValid = false;
    // }

    if (passwordValue === "") {
        showErrorResponse("password", "Password field is required");
        isValid = false;
    }

    if (passwordValue.length < 5) {
        showErrorResponse("password", "Password length should be 5 digits");
        isValid = false;
    }
    return isValid;
}

function showErrorResponse(element, message) {
    formErrorMessage[`${element}`].classList.remove("display-none");
    formErrorMessage[`${element}`].textContent = message;
}


function reSendEmailTimer(customTime = 1) {
    LoginPage.codeReSendButton.classList.add("display-none");
    LoginPage.timerRow.classList.remove("display-none");

    let endTime = Date.now() + (60000 * customTime);
    let count = setInterval(() => {
        let remaining = Math.max(0, endTime - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        LoginPage.timerShow.textContent = seconds;
        if (seconds <= 0) {
            LoginPage.codeReSendButton.classList.remove("display-none");
            LoginPage.timerRow.classList.add("display-none");
            clearInterval(count);
        }
    }, 250)
}

async function resendCode() {
    LoginPage.optLoaderResend.classList.remove("display-none");
    LoginPage.codeReSendButton.disabled = true;
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
            window.location.href = "/login.html";
            return;
        }
        LoginPage.tokenFieldError.textContent = output.errCode[0].message;
    } else if (output.success) {
        reSendEmailTimer(resendOTPTries);
        resendOTPTries++;
    }
    LoginPage.optLoaderResend.classList.add("display-none");
    LoginPage.codeReSendButton.disabled = false;

}

async function verifyCode() {
    let OTPCode = LoginPage.otpFieldInput.value.trim();

    if (!OTPCode) {
        LoginPage.tokenFieldError.textContent = "Input Field is Empty";
        return;
    } else if (!/^\d{6}$/.test(OTPCode)) {
        LoginPage.tokenFieldError.textContent = "Input field should have digits of 6 length";
        return;
    }

    LoginPage.optLoader.classList.remove("display-none");
    LoginPage.optSubmitButton.disabled = true;
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
            window.location.replace("/login.html");
            return;
        }
        LoginPage.tokenFieldError.textContent = output.errCode[0].message;

    } else if (output.success && output?.data?.profileImage === "UPLOAD_IMAGE") {
        LoginPage.mainPanelPage.classList.add("display-none");
        LoginPage.profileUploadPage.classList.remove("display-none");

    } else if (output.success) {
        window.location.hre = "/home.html"
    }
    LoginPage.optLoader.classList.add("display-none");
    LoginPage.optSubmitButton.disabled = false;

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
            window.location.replace("/home.html");
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