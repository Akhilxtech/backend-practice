import Joi from "joi";
import BaseDto from "../../../common/DTO/base.dto.js"

class RegisterDto extends BaseDto {
    static schema=Joi.object({
        name:Joi.string().trim().min(2).max(30).required(),
        email:Joi.string().email().required().lowercase(),
        password: Joi.string().min(8).message("password must contain 8 chars minimum").required(),
        role: Joi.string().valid("admin", "seller").default("customer")
    })
}

export default RegisterDto;