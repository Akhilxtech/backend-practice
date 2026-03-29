import { Router } from "express";
import validate from "../../common/middlewares/validate.js"
import RegisterDto from "./dto/register.dto.js";
import * as controller from "../auth/auth.controller.js"
const router=Router();

router.post("/register",validate(RegisterDto),controller.register)
router.post("/verify-email/:token",controller.verifyEmail);
router.post("/login",controller.login);

export default router