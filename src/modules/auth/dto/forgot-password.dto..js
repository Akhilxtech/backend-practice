import Joi from "joi";
import BaseDto from "../../../common/DTO/base.dto.js";
import { forgotPassword } from "../auth.service.js";

class ForgotPasswordDTO extends BaseDto{
    static schema=Joi.object({
        email: Joi.string().email().lowercase().required()
    })
}

export default ForgotPasswordDTO