import cookieParser from "cookie-parser";
import ApiError from "../../common/utils/Api-error-response.js";
import { verifyAccessToken } from "../../common/utils/jwt-utils.js";
import  User  from "./auth.model.js"

const authenticate=async(req,res,next)=>{

    // cookies method

    // const token= req.cookies.refreshToken;
    // if(!token) throw ApiError.unauthorized("Not Authenticated")

    // headers method

    let token;
    if(req.headers.authorization?.startsWith("Bearer")){
        token=req.headers.authorization.split(" ")[1];
    }

    if(!token) throw ApiError.unauthorized("Not Authenticated")

    const decodedToken=verifyAccessToken(token);
    const user=await User.findById(decodedToken.id)
    if(!user) throw ApiError.unauthorized("user no longer Exist");
    req.user={
        id:user._id,
        name:user.name,
        email:user.email,
        role:user.role
    }
    next();
}

const authorize=(...role)=>{
    return (req,res,next)=>{
        if(!role.includes(req.user.role)){
            throw ApiError.unauthorized("You don't have permission to perform this action")
        }
        next();
    };
};

export {
    authenticate,
    authorize
}