import crypto from "crypto"
import jwt from "jsonwebtoken"


const generateAccessToken= (payload)=>{
    return jwt.sign(payload,process.env.JWT_ACCESS_SECRET,{
        expiresIn:process.env.JWT_ACCESS_EXPIRY||"15m"
    })
}

const verifyAccessToken=(token)=>{
    return jwt.verify(token,process.env.JWT_ACCESS_SECRET);
}

const generateRefreshToken=(payload)=>{
    return jwt.sign(payload,process.env.JWT_REFRESH_SECRET,{
        expiresIn: process.env.JWT_REFRESH_EXPIRY||"1d"
    })
}

const verifyRefreshToken=(token)=>{
    jwt.verify(token,process.env.JWT_REFRESH_SECRET)
}

const generateToken= ()=>{
    const rawToken=crypto.randomBytes(32).toString("hex");
    const hashedToken=crypto.createHash('sha256').update(rawToken).digest("hex")

    return {rawToken, hashedToken}
}

export {
    generateToken,
    verifyAccessToken,
    generateRefreshToken,
    generateAccessToken,
    verifyRefreshToken
}