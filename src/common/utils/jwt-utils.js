import crypto from "crypto"
import jwt from "jsonwebtoken"
import fs from "fs"
import { readFileSync } from "fs";
import { join } from "path";

const pvtKey = readFileSync(join(process.cwd(), "src/modules/oidc/keys/private.pem"));
const pubKey = readFileSync(join(process.cwd(), "src/modules/oidc/keys/public.pem"));



const generateAccessToken= (payload)=>{
    return jwt.sign(payload,pvtKey,{
        algorithm:"RS256",
        expiresIn:process.env.JWT_ACCESS_EXPIRY||"15m"
    })
}

const verifyAccessToken=(token)=>{
    return jwt.verify(token,pubKey);
}

const generateRefreshToken=(payload)=>{
    return jwt.sign(payload,process.env.JWT_REFRESH_SECRET,{
        expiresIn: process.env.JWT_REFRESH_EXPIRY||"1d"
    })
}

const verifyRefreshToken=(token)=>{
    return jwt.verify(token,process.env.JWT_REFRESH_SECRET)
}

const generateToken= ()=>{
    const rawToken=crypto.randomBytes(32).toString("hex");
    const hashedToken=crypto.createHash('sha256').update(rawToken).digest("hex")

    return {rawToken, hashedToken}
}

const hashToken=(token)=>{
    const hashedToken=crypto.createHash('sha256').update(token).digest('hex');
    return hashedToken;
}


export {
    generateToken,
    verifyAccessToken,
    generateRefreshToken,
    generateAccessToken,
    verifyRefreshToken,
    hashToken
}