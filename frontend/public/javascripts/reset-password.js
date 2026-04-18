const BASE_URL = "http://localhost:3000/v1";

lucide.createIcons();
let tokenValidate = null;
const html = document.documentElement;

const updateBtn = document.getElementById('updateBtn');
const loaderBoxAuth = document.querySelector('#loadingState')
const formState = document.querySelector('#formState');
const successState = document.querySelector('#successState');
const errMsgP1 = document.querySelector(".err-message-p-1");
const errMsgP2 = document.querySelector(".err-message-p-2");


const errState = {
    err1: errMsgP1,
    err2: errMsgP2,
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    token = params.get('token');

    if (!token) {
        loaderBoxAuth.querySelector(".spinner").classList.add("display-none");
        loaderBoxAuth.querySelector("p").textContent = "This link is not valid";
        return
    }
    tokenValidate = token.trim().split(' ')[0];
    const response = await fetch(`${BASE_URL}/auth/reset-password/token/${tokenValidate}`, {
        method: "GET",
    });

    const output = await response.json();
    console.log(output);

    setTimeout(() => {
        loaderBoxAuth.querySelector(".spinner").classList.add("display-none");
        if (output.success) {
            loaderBoxAuth.classList.add('display-none');
            formState.classList.remove('display-none');
        } else {
            loaderBoxAuth.querySelector("p").textContent = output.message;
            formState.innerHTML = "";
        }
    }, 1400);

});

// Update Password Logic
updateBtn.addEventListener('click', async () => {
    const password = document.getElementById('password-input-1').value.trim();
    const confirmPassword = document.getElementById('password-input-2').value.trim();

    if (!passwordValidation(password, confirmPassword)) return;

    const response = await fetch(`${BASE_URL}/auth/reset-password/token/${tokenValidate}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ password, confirmPassword })
    });

    const output = await response.json();
    console.log(output);

    if (output.success) {
        formState.classList.add('display-none');
        successState.classList.remove('display-none');
    } else {
        errState[`${output.errCode.errorField}`].classList.remove("display-none");
        errState[`${output.errCode.errorField}`].textContent = output.errCode.message;
    }
});

function passwordValidation(password, confirmPassword) {
    errMsgP1.classList.add("display-none");
    errMsgP2.classList.add("display-none");

    if (password === "") {
        errMsgP1.textContent = "Input field is empty"
        errMsgP1.classList.remove("display-none");
        return false
    }
    if (confirmPassword === "") {
        errMsgP2.textContent = "Input field is empty"
        errMsgP2.classList.remove("display-none");
        return false
    }
    if (password.length < 6) {
        errMsgP1.textContent = "At least 6 char"
        errMsgP1.classList.remove("display-none");
        return false
    }
    if (confirmPassword.length < 6) {
        errMsgP2.textContent = "At least 6 char"
        errMsgP2.classList.remove("display-none");
        return false
    }

    if (confirmPassword !== password) {
        errMsgP2.textContent = "Password doesnot match"
        errMsgP2.classList.remove("display-none");
        return false
    }
    return true
}

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />`;
    } else {
        input.type = 'password';
        icon.innerHTML = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let themeChecking = localStorage.getItem("social-media-theme");
    if (themeChecking === "dark") {
        html.setAttribute("data-theme", "dark");
    }
});