import User from "../auth/auth.model.js"
import ApiError from "../../common/utils/Api-error-response.js";
import { generateAccessToken, generateRefreshToken, generateToken, hashToken, verifyRefreshToken } from "../../common/utils/jwt-utils.js";
import { sendMail, sendResetPasswordMail, sendVerificationMail } from "../../common/config/mail.js";

import fs from "fs"
import imageKitClient from "../../common/config/imagekit.js";
import ImageKit, { toFile } from '@imagekit/nodejs';



const register=async ({name,email,password,role})=>{
    const alreadyExist=await User.findOne({email});
    if(alreadyExist) throw ApiError.conflict("User already Exist");

    const {rawToken,hashedToken}=generateToken();
    const user=await User.create({ //create and save 
        name,
        email,
        password,
        role,
        verificationToken:hashedToken,
        verificationTokenExpiry:Date.now()+5*60*1000,
    })
    try {
        await sendVerificationMail(name,email,rawToken);
    } catch (error) {
        await User.findByIdAndDelete(user?.id);
        console.log("error sending mail: ",error);
        
    }
    const userObj= user.toObject();
    delete userObj.password;
    delete userObj.verificationToken;
    return userObj;
}

const verifyEmail=async (token)=> {
    if(!token) throw ApiError.missing("token is missing");
    const hashedToken=hashToken(token);
    const user=await User.findOne({verificationToken:hashedToken}).select("+verificationToken +verificationTokenExpiry");
    
    if(!user) throw ApiError.notFound("user not found");
    if(user.verificationTokenExpiry<Date.now()){
        throw ApiError.badRequest("verification Token Expired")
    }
    user.isVerified=true;
    user.verificationToken=undefined
    user.verificationTokenExpiry=undefined
    await user.save();    
    return user;

}


const login=async({email,password})=>{
    const user= await User.findOne({email}).select("+password +verificationToken +verificationTokenExpiry");
    if(!user) throw ApiError.notFound("user not found");

    const isMatch=await user.comparePassword(password)
    if(!isMatch) throw ApiError.unauthorized("email or password is invalid");

    if(!user.isVerified) {
        console.log("token expiry: ",user.verificationTokenExpiry);
        
        if(user.verificationTokenExpiry<Date.now()){
            
            const {rawToken,hashedToken}=generateToken();
            user.verificationToken=hashedToken;
            user.verificationTokenExpiry=Date.now()+15*60*1000;
            await user.save({validateBeforeSave:false})
            try {
                await sendVerificationMail(email,rawToken);
                console.log("mail sent successfully");
                
                
            } catch (error) {
                console.log("error sending mail: ",error );
                
            }        
        }
        throw ApiError.forBidden("please check your mail and verify first")

    }
    

    const accessToken=generateAccessToken({id:user._id, email:user.email, role:user.role})
    const refreshToken=generateRefreshToken({id: user._id, email:user.email, role: user.role});

    user.refreshToken=hashToken(refreshToken);
    await user.save({validateBeforeSave:false});

    const userObj=user.toObject()

    delete userObj.password
    delete userObj.refreshToken
    delete userObj.verificationToken
    delete userObj.verificationTokenExpiry

    return {userObj, accessToken, refreshToken};

}

const logout=async(userId)=>{
    await User.findByIdAndUpdate(userId,{refreshToken:null});
}

const generateNewAcessToken = async (token) => {

    if (!token) {
        throw ApiError.badRequest("Refresh token missing");
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {

        if (error.name === "TokenExpiredError") {
            throw ApiError.unauthorized(
                "Refresh token expired. Please login again."
            );
        }

        throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await User.findById(decoded.id)
        .select("+refreshToken");

    if (!user) {
        throw ApiError.notFound("User not found");
    }

    if (user.refreshToken !== hashToken(token)) {
        throw ApiError.unauthorized("Invalid refresh token");
    }

    const accessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        role: user.role
    });

    const refreshToken = generateRefreshToken({
        id: user._id,
        email: user.email,
        role: user.role
    });

    // Rotate refresh token
    user.refreshToken = hashToken(refreshToken);

    await user.save({
        validateBeforeSave: false
    });

    return {
        accessToken,
        refreshToken
    };
};
const getMe=async(userId)=>{
    const user=await User.findById(userId);
    if(!user) throw ApiError("user not found");
    return user;
}

const forgotPassword=async({email})=>{
    const user=await User.findOne({email});
    if(!user) throw ApiError.notFound("user not found");

    const {rawToken,hashedToken}= generateToken();

    user.resetPasswordToken=hashedToken;
    user.resetPasswordTokenExpiry=Date.now()+5*60*1000,
    user.save({validateBeforeSave:false});
    try {
        await sendResetPasswordMail(user.name,email,rawToken);
        console.log("forgot password mail sent");
        
    } catch (error) {
        console.log("error sending forgotpassword mail",error);
    }
}

const resetPassword=async(token, newPassword)=>{
    const hashedToken=hashToken(token);
    const user=await User.findOne({resetPasswordToken:hashedToken}).select("+resetPasswordToken +resetPasswordTokenExpiry");
    
    if(!user) throw ApiError.notFound("user not found");
    if(user.resetPasswordTokenExpiry<Date.now()){
        throw ApiError.badRequest("token expired")
    }

    user.password=newPassword;
    user.resetPasswordToken=null;
    user.resetPasswordTokenExpiry=null;
    await user.save();

}


const handleupload=async(id,file)=>{
   try {

    const user=await User.findById(id);
    if(!user){
        throw new ApiError.missing("user not found");
    }

    // const fileStream=fs.createReadStream(file.path)


    const uploadResponse=await imageKitClient.files.upload({

        file: await toFile(file.buffer),
        fileName:file.originalname,
        folder:"/user-avatars"
    })
    user.avatar=uploadResponse.url
    await user.save({validateBeforeSave:false})

    // fs.unlinkSync(file.path);
    return {
        url:uploadResponse.url,
        fileId:uploadResponse.fileId
    }


        

 
   } catch (error) {
        console.log("handleupload error:", error); // yeh kya print karta hai?
        throw error;
   }

}
export {
    register,
    verifyEmail,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    generateNewAcessToken,
    handleupload

}