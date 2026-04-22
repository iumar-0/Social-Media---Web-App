const BASE_URL = "http://localhost:3000/v1";

// Initialize Icons
lucide.createIcons();

const themeBtn = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

// 2. Success State Logic
const sendBtn = document.getElementById('sendBtn');
const emailInput = document.getElementById('emailInput');
const requestState = document.getElementById('requestState');
const successState = document.getElementById('successState');
const displayEmail = document.getElementById('displayEmail');
const errEmailInput = document.querySelector('.err-message-email');

sendBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!emailValidation(email)) return;

    // Smooth transition
    requestState.style.opacity = '0';


    let response = await fetch(BASE_URL + "/auth/forget-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email: email })
    });

    const output = await response.json();
    console.log(output);
    requestState.classList.add('display-none');
    successState.classList.remove('display-none');
    displayEmail.innerText = email;

    successState.style.animation = 'fadeIn 0.7s ease forwards';

});


function emailValidation(email) {
    if (!email) {
        errEmailInput.classList.remove("display-none");
        errEmailInput.textContent = "Email input is empty"
        return false;
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        errEmailInput.classList.remove("display-none");
        errEmailInput.textContent = "Enter a valid email"
        return false;
    }

    if (email.length > 256) {
        errEmailInput.classList.remove("display-none");
        errEmailInput.textContent = "Email should be less then 256 characters"
        return false;
    }
    return true;
}


document.addEventListener("DOMContentLoaded", () => {
    let themeChecking = localStorage.getItem("social-media-theme");
    if (themeChecking === "dark") {
        html.setAttribute("data-theme", "dark");
    }
});