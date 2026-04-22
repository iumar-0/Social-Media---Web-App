import jsonwebtoken from "jsonwebtoken"


const assignCookieToken = async function (res, userID, cookieName, timeJWT, timeCookie) {
    
    const jwtToken = jsonwebtoken.sign(
        { token: userID },
        process.env.JWTTOKENCODE,
        {
            algorithm: "HS256",
            expiresIn: timeJWT,
        }
    );
    res.cookie(cookieName, jwtToken, {
        httpOnly: true,
        maxAge: timeCookie,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
}

const AuthAssignCookieToken = async function (res, authData, cookieName, timeJWT, timeCookie) {

    const jwtToken = jsonwebtoken.sign(
        { token: authData },
        process.env.JWTTOKENCODE,
        {
            algorithm: "HS256",
            expiresIn: timeJWT,
        }
    );
    res.cookie(cookieName, jwtToken, {
        httpOnly: true,
        maxAge: timeCookie,
        secure: false,
        sameSite: "lax",
        path: "/"
    });
}






export default { assignCookieToken, AuthAssignCookieToken } 