import Joi from "joi";
import BaseDto from "../../../common/DTO/base.dto.js";

class ResetPasswordDTO extends BaseDto{
    static schema=Joi.object({
        newPassword:Joi.string().min(8).message("password must be minimum 8 chars").required()
       
        
    })
}

export default ResetPasswordDTO;