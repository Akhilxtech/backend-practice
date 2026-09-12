import * as authService from "../auth/auth.service.js"
import ApiResponse from "../../common/utils/Api-response.js"
import cookieParser from "cookie-parser";
import ApiError from "../../common/utils/Api-error-response.js";

const register=async (req,res)=>{
    const user=await authService.register(req.body);
    ApiResponse.created(res,"user registered Successfully", user);

}

const verifyEmail=async (req,res)=>{
    try {
        const user=await authService.verifyEmail(req.params.token);
        ApiResponse.ok(res,"verification Successfull", user)
    } catch (error) {
        console.log(error);
        
    }
}

const login=async (req,res)=>{
   try {
     const {userObj,accessToken, refreshToken}=await authService.login(req.body);
     res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="Production",
        sameSite:"strict",
        maxAge:7*24*60*60*1000 // 7 days
     })

     
     
     ApiResponse.ok(res, "login successfull", {userObj,accessToken})
     
   } catch (error) {
        console.log(error);
        
    
   }
}

const logout=async(req,res)=>{
    try {
        const user=await authService.logout(req.user.id);
        res.clearCookie("refreshToken",{
            httpOnly:true,
            secure:process.env.NODE_ENV==="Production",            
            sameSite:"Strict",
        })
        ApiResponse.ok(res,"logout successfully");
    } catch (error) {
        console.log(error);
        
        
    }
}

const getMe=async(req,res)=>{
    try {
        const user=await authService.getMe(req.user.id);
        ApiResponse.ok(res,"user details",user);
        
    } catch (error) {
        console.log(error);
        
    }
}

const forgotPassword=async(req,res)=>{
    try {
        await authService.forgotPassword(req.body)
        ApiResponse.ok(res,"mail sent successfully" )
    } catch (error) {
        console.log("error sending mail check service",error);
    }
}

const resetPassword=async(req,res)=>{
    try {
        const {token}=req.params;
        const {newPassword}=req.body;

        

        
        await authService.resetPassword(token,newPassword);
        ApiResponse.ok(res,"password reset successfull")
    } catch (error) {
        console.log("error reseting password: ",error);
    }
}

const newAccessToken = async (req, res, next) => {

    try {

        const token = req.cookies?.refreshToken;

        if (!token) {
            throw ApiError.unauthorized("Refresh token is missing");
        }

        const { accessToken, refreshToken } =
            await authService.generateNewAcessToken(token);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return ApiResponse.ok(
            res,
            "Access Token Generated successfully",
            { accessToken }
        );

    } catch (error) {

        next(error);
    }
};

const uploadAvatar=async(req,res)=>{
    try {
        
        const file=req.file;
        if(!file){
            return ApiError.badRequest("No file uploaded. please send file with field name avatar")
        }


        const result=await authService.handleupload(req.user.id,file);
        
        return ApiResponse.ok(res,"Avatar uploaded successfully",{avatarURL:result.url})
    } catch (error) {
        return ApiError.forBidden(error.message || "error uploading avatar")
    }
}

export {register,verifyEmail,login,logout, getMe,forgotPassword,resetPassword,newAccessToken,uploadAvatar};