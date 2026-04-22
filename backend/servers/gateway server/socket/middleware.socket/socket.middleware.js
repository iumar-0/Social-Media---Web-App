import cookie from "cookie";
import jwt from "jsonwebtoken";

export const authSocket = ((socket, next) => {
    try {
        let rawCookie = socket.handshake.headers.cookie;
        if (!rawCookie) return next(new Error("TOKEN_NOT_FOUND"));

        const parsedCookie = cookie.parse(rawCookie);
        const token = parsedCookie?.token;

        if (!token) return next(new Error("TOKEN_NOT_FOUND"));

        try {
            let decode = jwt.verify(token, process.env.JWTTOKENCODE);
            socket.userID = decode.token;
            next();
        } catch (error) {
            return next(new Error("TOKEN_EXPIRED"));
        }

    } catch (error) {
        return next(new Error(error.message));
    }
});
