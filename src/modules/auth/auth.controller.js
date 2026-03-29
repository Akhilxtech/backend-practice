import * as authService from "../auth/auth.service.js"
import ApiResponse from "../../common/utils/Api-response.js"

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
     const user=await authService.login(req.body);
     ApiResponse.ok(res, "login successfull", user)
   } catch (error) {
        console.log(error);
        
    
   }
}
export {register,verifyEmail,login};