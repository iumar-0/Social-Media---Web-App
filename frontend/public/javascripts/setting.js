let userData;

const FETCH_URL = {
    PROFILE_SETTING_URL: "http://localhost:3000/v1/user/profile/setting",
    PROFILE_UPLOAD_URL: "http://localhost:3000/v1/user/profile/image",
    PROFILE_PRIVACY_URL: "http://localhost:3000/v1/user/profile/privacy",
    PROFILE_USERNAME_UPDATE_URL: "http://localhost:3000/v1/user/profile/username",
    PROFILE_NAME_EMAIL_UPDATE_URL: "http://localhost:3000/v1/user/profile/update/me/identity",
    PROFILE_PASSWORD_UPDATE_URL: "http://localhost:3000/v1/user/profile/update/password",
    PROFILE_DELETE_UPDATE_URL: "http://localhost:3000/v1/user/profile/delete",
}

const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/deklbsgkm/image/upload/default_Photo_insta_iz3kev.jpg";


document.addEventListener("DOMContentLoaded", async () => {
    let response = await fetch(FETCH_URL.PROFILE_SETTING_URL, {
        credentials: "include"
    });

    let output = await response.json();
    verifingTokenVerfication(output);

    if (output.success) {
        userData = output.data;
        defaultSettingUpdate()
    }
});

function defaultSettingUpdate() {
    document.getElementById("avatarImg").src = userData.profile?.url || DEFAULT_PROFILE_IMAGE;
    document.querySelector("#profile-photo-header img").src = userData.profile?.url || DEFAULT_PROFILE_IMAGE;
    if (userData.profile?.url) {
        document.getElementById("delete-profile-user").classList.remove("display-none");
    } else {
        document.getElementById("delete-profile-user").classList.add("display-none");
    }

    if (userData.isPrivate) document.getElementById("privToggle").classList.add("on");
    else document.getElementById("privToggle").classList.remove("on");

    // disable username button default
    const updateUsernameButton = document.getElementById('usernameSaveBtn');
    updateUsernameButton.disabled = true;

    document.querySelector("#profile-button").onclick = () => {
        updateProfilePageLinkUsername(userData.username)
    }

    document.querySelector(".sb-profile").onclick = () => {
        updateProfilePageLinkUsername(userData.username)
    }

    document.getElementById("usernameInput").value = userData.username;
    document.getElementById("profile-username-header").textContent = "@" + userData.username;

    document.getElementById("nameInput").value = userData.name;
    document.getElementById("profile-name-header").textContent = userData.name;
    document.getElementById("emailInput").value = userData.rawEmail;
}


// ══════════════════════════════════
// AVATAR UPLOAD
// ══════════════════════════════════
async function handleAvatarUpload(files) {
    if (!files.length) return;
    const file = files[0];
    let imageType = file.type.split("/");

    if (file.size > 20 * 1024 * 1024) {
        setAvatarStatus('File too large. Max 5MB.', 'err'); return;
    }
    if (imageType[0] !== "image") {
        setAvatarStatus('Only Image is allowed', 'err');
        return;
    } else if (!["jpg", "png", "jpeg", "webp"].includes(imageType[1])) {
        setAvatarStatus('Only .jpg, .jpeg, .png, .webp', 'err');
        return;
    } else if (file.length > 1) {
        errorImageInput.textContent = "Only signle image is allowed";
        return;
    }

    const wrap = document.getElementById('avatarWrap');
    wrap.classList.add('uploading');
    setAvatarStatus('Uploading…', '');

    const fileURl = URL.createObjectURL(file);

    const img = document.getElementById('avatarImg');
    img.src = fileURl;

    // sending new profile to backend
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(FETCH_URL.PROFILE_UPLOAD_URL, {
        method: 'PATCH',
        headers: {
            "Accept": "application/json"
        },
        credentials: 'include',
        body: formData
    });
    const data = await response.json();
    wrap.classList.remove('uploading');

    if (data.success) {
        img.src = data.data.profileUrl;
        document.querySelector("#profile-photo-header img").src = data.data.profileUrl;
        setAvatarStatus('Profile updated!', 'ok');
        document.getElementById("delete-profile-user").classList.remove("display-none");
    } else {
        setAvatarStatus(data.message + 'Try again.', 'err');
    }
}

async function deleteProfile(deleteButton) {
    deleteButton.disabled = true;
    let response = await fetch(FETCH_URL.PROFILE_UPLOAD_URL, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });

    let output = await response.json();
    if (output.success) {
        document.getElementById("avatarImg").src = DEFAULT_PROFILE_IMAGE;
        document.querySelector("#profile-photo-header img").src = DEFAULT_PROFILE_IMAGE;

        document.getElementById("delete-profile-user").classList.add("display-none");
    } else {
        setAvatarStatus(output.message + 'Try again.', 'err');
    }
    deleteButton.disabled = false;
}

function setAvatarStatus(msg, type) {
    const el = document.getElementById('avatarStatus');
    el.textContent = msg;
    el.className = 'avatar-status ' + type;
}

function updateProfilePageLinkUsername(username) {
    window.location.href = `/profile.html?username=${username}`;
}

// ══════════════════════════════════
// PRIVACY TOGGLE
// ══════════════════════════════════
async function togglePrivateAccount(privacybtn) {
    privacybtn.disabled = true

    if (userData.isPrivate) document.getElementById('privToggle').classList.remove('on');
    else document.getElementById('privToggle').classList.add('on');

    let isPrivate = privacybtn.classList.contains("on");
    console.log(isPrivate);

    // private account fetch
    let response = await fetch(FETCH_URL.PROFILE_PRIVACY_URL, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate })
    });

    let output = await response.json();

    console.log(output);

    if (output.success) {
        userData.isPrivate = output.data;
        showToast(isPrivate ? 'Account set to Private' : 'Account set to Public', 'success');
    }
    privacybtn.disabled = false;
}

// ══════════════════════════════════
// USERNAME — updating
// ══════════════════════════════════
async function onUsernameInput(usernameValue, notTyping = true) {
    const updateUsernameButton = document.getElementById('usernameSaveBtn');
    if (usernameValue === userData.username) {
        updateUsernameButton.disabled = true;
        const validationMessage = document.getElementById('usernameMsg');
        validationMessage.className = 'field-msg ok';
        validationMessage.textContent = 'no change';
        if (notTyping) {
            setTimeout(() => {
                validationMessage.textContent = '';
                const inputUsername = document.getElementById('usernameInput');
                inputUsername.classList.remove('ok', 'err');

            }, 10000);
        }
        return
    }
    updateUsernameButton.disabled = false;
}

async function saveUsername() {
    const updateUsernameButton = document.getElementById('usernameSaveBtn');
    updateUsernameButton.classList.add('loading');
    updateUsernameButton.disabled = true;

    const foucesDiv = document.getElementById('usernameWrap');
    const validationMessage = document.getElementById('usernameMsg');
    const validationIcon = document.getElementById('usernameIcon');
    const inputUsername = document.getElementById('usernameInput');

    // reset
    foucesDiv.classList.remove('checking');
    inputUsername.classList.remove('ok', 'err');
    validationMessage.textContent = '';

    if (!inputUsername.value.trim()) {
        inputUsername.classList.add('err');
        validationMessage.className = 'field-msg err';
        validationMessage.textContent = 'Input is required';
        return
    };

    if (!/^[a-zA-Z0-9._]+$/.test(inputUsername.value)) {
        inputUsername.classList.add('err');
        validationMessage.className = 'field-msg err';
        validationMessage.textContent = 'Use only letters, numbers, underscores, or dots';
        return
    }

    const response = await fetch(FETCH_URL.PROFILE_USERNAME_UPDATE_URL, {
        method: "PATCH",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUsername.value })
    });

    const output = await response.json();
    console.log(output);

    if (output.success) {
        userData.username = inputUsername.value;
        onUsernameInput(inputUsername.value, false);

        inputUsername.classList.add('ok');
        validationIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>`;
        validationMessage.className = 'field-msg ok';
        validationMessage.textContent = '@' + inputUsername.value + ' is available';
        document.getElementById("profile-username-header").textContent = "@" + inputUsername.value;

        document.querySelector("#profile-button").onclick = () => {
            updateProfilePageLinkUsername(inputUsername.value)
        }

        document.querySelector(".sb-profile").onclick = () => {
            updateProfilePageLinkUsername(inputUsername.value)
        }

        setTimeout(() => {
            validationIcon.innerHTML = ``;
            validationMessage.textContent = '';
            inputUsername.classList.remove('ok');
        }, 10000);

        showToast('Username updated!', 'success');
    } else {
        inputUsername.classList.add('err');
        validationIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>`;
        validationMessage.className = 'field-msg err';
        validationMessage.textContent = output.errCode.usernameField;
        updateUsernameButton.disabled = false;
    }
    updateUsernameButton.classList.remove('loading');
}

// ══════════════════════════════════
// NAME & EMAIL SAVE
// ══════════════════════════════════
async function saveInfo() {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const emailMsg = document.getElementById('emailMsg');
    emailMsg.textContent = '';

    if (!name) { showToast('Name is required', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailMsg.className = 'field-msg err';
        emailMsg.textContent = 'Enter a valid email address';
        return;
    }

    const personalDetailsUpdateButton = document.getElementById('infoSaveBtn');
    personalDetailsUpdateButton.classList.add('loading');
    personalDetailsUpdateButton.disabled = true;

    // ── YOUR FETCH GOES HERE ──
    const response = await fetch(FETCH_URL.PROFILE_NAME_EMAIL_UPDATE_URL, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
    });

    let output = await response.json();

    if (output.success) {
        userData.rawEmail = output.data.rawEmail;
        userData.name = name;
        document.getElementById("profile-name-header").textContent = userData.name;

        console.log(userData);

        showToast('Profile updated', 'success');
    } else {
        emailMsg.className = 'field-msg err';
        emailMsg.textContent = output.errCode.emailField;
    }
    personalDetailsUpdateButton.classList.remove('loading');
    personalDetailsUpdateButton.disabled = false;
}

// ══════════════════════════════════
// PASSWORD
// ══════════════════════════════════
function checkStrength(val) {
    const bars = ['sb1', 'sb2', 'sb3', 'sb4'].map(id => document.getElementById(id));
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    bars.forEach(b => b.style.background = 'var(--border)');
    if (!val) return;
    let score = 0;
    if (val.length >= 5) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    for (let i = 0; i < score; i++) bars[i].style.background = colors[score - 1];
}

function checkPassMatch() {
    const np = document.getElementById('newPass').value;
    const cp = document.getElementById('confirmPass').value;
    const msg = document.getElementById('passMatchMsg');
    if (!cp) { msg.textContent = ''; return; }
    if (np === cp) { msg.className = 'field-msg ok'; msg.textContent = 'Passwords match'; }
    else { msg.className = 'field-msg err'; msg.textContent = 'Passwords do not match'; }
}

function togglePass(id, iconSpan) {
    const input = document.getElementById(id);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    iconSpan.innerHTML = isText
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>`;
}

async function savePassword() {
    document.querySelector("#passMatchMsg1").classList.add("display-none");

    const current = document.getElementById('currentPass').value.trim();
    const newP = document.getElementById('newPass').value.trim();
    const confirmPassword = document.getElementById('confirmPass').value.trim();

    if (!current) { showToast('Enter your current password', 'error'); return; }
    if (newP.length < 5) { showToast('Password must be at least 6 characters long', 'error'); return; }
    if (newP !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }

    const btn = document.getElementById('passSaveBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    const response = await fetch(FETCH_URL.PROFILE_PASSWORD_UPDATE_URL, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            currentPassword: current,
            newPassword: newP,
            newconfirmPassword: confirmPassword
        })
    });

    const output = await response.json();
    verifingTokenVerfication(output);

    btn.classList.remove('loading');
    btn.disabled = false;

    if (output.success) {
        //Default password fields 
        {
            document.getElementById('currentPass').value = '';
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';
            ['sb1', 'sb2', 'sb3', 'sb4'].forEach(id => document.getElementById(id).style.background = 'var(--border)');
            document.getElementById('passMatchMsg').textContent = '';
        }
        showToast('Password changed', 'success');
        return
    }

    showToast(output.message, 'error');
    if (output?.errCode.errorField === "NEW_PWD_ERROR") {
        document.getElementById('passMatchMsg').textContent = output.errCode.message;
        document.getElementById('passMatchMsg').classList.add("err");
        return
    }
    if (output?.errCode.errorField === "CURRENT_PWD_ERROR") {
        document.querySelector("#passMatchMsg1").textContent = "Wrong password";
        document.querySelector("#passMatchMsg1").classList.remove("display-none");
    }

}
// ══════════════════════════════════
// DELETE ACCOUNT
// ══════════════════════════════════
async function confirmDelete() {
    let response = await fetch(FETCH_URL.PROFILE_DELETE_UPDATE_URL, {
        method: 'DELETE',
        credentials: 'include',
    });
    let output = await response.json();
    if (output.success) {
        showToast('Account deletion requested', 'error');
        setTimeout(() => {
            window.location.replace("/sign.html");
        }, 4000);
    } else {
        showToast('Try again after some time', 'error');
    }
}

// ══════════════════════════════════
// THEME
// ══════════════════════════════════
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeKnobIcon');
const html = document.documentElement;

function toggleTheme() {
    const dark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', dark ? 'light' : 'dark');
    themeToggle.classList.toggle('on', !dark);
    themeIcon.innerHTML = dark
        ? `<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />`
        : `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />`;
    localStorage.setItem("social-media-theme", dark ? 'light' : 'dark')
}

document.addEventListener("DOMContentLoaded", () => {
    let themeChecking = localStorage.getItem("social-media-theme");
    if (themeChecking === "dark") {
        html.setAttribute("data-theme", "dark");
        themeToggle.classList.toggle('on', true);
        themeIcon.innerHTML = `<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />`;
    }
});
// ══════════════════════════════════
// SIDEBAR
// ══════════════════════════════════
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sbOverlay').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sbOverlay').classList.remove('open'); }

// ══════════════════════════════════
// TOAST
// ══════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast ' + type; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function verifingTokenVerfication(data) {
    if (!data.success && data?.errCode[0]?.render === "LOGIN_PAGE") {
        window.location.replace("/login.html");
    }
}

function verifingTokenVerfication(data) {
    console.log(data);

    if (!data.success && data?.errCode[0]?.render === "LOGIN_PAGE") {
        window.location.replace("/login.html");
    }
}