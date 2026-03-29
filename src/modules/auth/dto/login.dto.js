import Joi from "joi";
import BaseDto from "../../../common/DTO/base.dto.js";

class LoginDTO extends BaseDto{
    static schema=Joi.object({
        email:Joi.string().email().required().lowercase(),
        password:Joi.string().min(8).message("password must be minimum 8 chars").required()

    })
}

export default LoginDTO;