import { Router } from "express";
import validate from "../../common/middlewares/validate.js"
import RegisterDto from "./dto/register.dto.js";
import * as controller from "../auth/auth.controller.js"
import { authenticate } from "./auth.middleware.js";
const router=Router();

router.post("/register",validate(RegisterDto),controller.register);
router.post("/verify-email/:token",controller.verifyEmail);
router.post("/login",controller.login);
router.post("/logout",authenticate,controller.logout);
router.get("/profile",authenticate,controller.getMe);
router.post("/forgot-password",controller.forgotPassword);
router.post("/reset-password/:token",controller.resetPassword);

export default router