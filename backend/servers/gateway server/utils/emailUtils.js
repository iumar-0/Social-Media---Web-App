import createHttpError from "http-errors";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USEREMAIL,
        pass: process.env.EMAILPASSWORD
    }
});
const emailVerficationSenderUntils = function (name, email, text) {
    try {
        console.log(text);

        let emailOptions = {
            from: process.env.USEREMAIL,
            to: email,
            subject: "Verfication Code",
            html: `<html>
                <head>
                    <meta charset="UTF-8">
                        <title>Welcome Email</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #333;">Chatterra to Our App!</h2>
                        <p style="color: #555; font-size: 16px;">Hi ${name}, thank you for joining us. Your account is ready to go. Verfication code is recived</p>
                        <a href="{{login_url}}" style="display: inline-block; padding: 10px 20px; margin-top: 10px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">${text}</a>
                        <p style="color: #aaa; font-size: 12px; margin-top: 20px;">If you didn’t sign up, ignore this email.</p>
                    </div>
                </body>
            </html>`
        }

        transporter.sendMail(emailOptions);
    } catch (error) {
        throw createHttpError(404, "Try again, Email not send");
    }
}

const resetPasswordEmailSenderUtils = function (email, verificationUrl) {
    try {
        const emailOptions = {
            from: process.env.USEREMAIL,
            to: email,
            subject: "Chatterra Reset Password",
            html: `<html>
            <head>
                <meta charset="UTF-8">
                <title>Chatterra Reset Password</title>
            </head>

            <body style="margin:0;padding:0;background-color: #b9b9b9;font-family: Arial, sans-serif;">
                <title>Email Verification</title>
                <div
                    style="max-width:600px;margin: 40px;background:#ffffff;padding:30px;border-radius:10px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                    <h2 style="color:#333; margin-bottom:10px;">Reset Password</h2>

                    <p style="color:#555; font-size:16px; line-height:1.5;">
                            A request has been made to reset your password. Please confirm this action by clicking the button below. </p>
                    </p>

                    <a href="${verificationUrl} target="_blank"
                        style="display:inline-block;margin-top:20px;padding:12px 25px;font-size:16px;color:#ffffff;background-color: #000000;text-decoration:none;border-radius:6px;font-weight:bold;">
                        Verify Email
                    </a>

                    <p style="color:#777; font-size:14px; margin-top:25px;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>

                    <p style="word-break:break-all;color: #000000;font-size:13px;">
                        ${verificationUrl}
                    </p>

                    <p style="color:#aaa; font-size:12px; margin-top:30px;">
                        If you didn’t create this account, you can safely ignore this email.
                    </p>
                </div>
            </body>

            </html>`
        }
        transporter.sendMail(emailOptions);
    } catch (error) {
        throw createHttpError(404, "Try again, Email not send");
    }

}

const formatEmail = function (email) {
    let [local, domain] = email.split("@");
    let [username, tagName] = local.split("+");
    return `${username}@${domain} `;
}

export default {
    formatEmail,
    emailVerficationSenderUntils,
    resetPasswordEmailSenderUtils
}