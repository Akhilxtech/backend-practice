import { Router } from "express";
import validate from "../../common/middlewares/validate.js"
import RegisterDto from "./dto/register.dto.js";
import LoginDTO from "./dto/login.dto.js";
import ForgotPasswordDTO from "./dto/forgot-password.dto..js"
import ResetPasswordDTO from "./dto/reset-password.dto.js";
import * as controller from "../auth/auth.controller.js"
import { authenticate } from "./auth.middleware.js";
const router=Router();


// public routes
router.post("/register",validate(RegisterDto),controller.register);
router.post("/verify-email/:token",controller.verifyEmail);
router.post("/login",validate(LoginDTO),controller.login);
router.post("/forgot-password",validate(ForgotPasswordDTO),controller.forgotPassword);
router.post("/reset-password/:token",validate(ResetPasswordDTO),controller.resetPassword);
router.post("/refresh-token",controller.newAccessToken);

// protected routes
router.use(authenticate)
router.post("/logout",controller.logout);
router.get("/profile",controller.getMe);

export default router