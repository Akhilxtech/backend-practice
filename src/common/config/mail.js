import nodemailer from "nodemailer"
import { emailBody } from "./mailgen.js";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_TRAP_HOST,
  port: 2525,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail=async (email,subject,html)=>{
    await transporter.sendMail({
        from: `${process.env.SMTP_FROM_EMAIL}`,
        to:email,
        subject,
        html,
    });
}

const sendVerificationMail=async (name,email,token)=>{

    const body=emailBody(name,`verify-email`,"To continue Verify your email", "verify your email",token);
    await transporter.sendMail({
        from: `${process.env.SMTP_FROM_EMAIL}`,
        to:email,
        subject:"Account Verification",
        html: body
    });
}

const sendResetPasswordMail=async (name,email,token)=>{
    const options={
      path:"forgot-password",
      intro:"we received your request to reset your password",
      instructions:"To reset your password please click below button",
      btnText:"Reset Password"
    }
    const body=emailBody(name,options.path,options.btnText,options.intro,options.instructions,token);
    await transporter.sendMail({
        from: `${process.env.SMTP_FROM_EMAIL}`,
        to:email,
        subject:"Account Verification",
        html: body
    });
}

export {sendMail, sendVerificationMail,sendResetPasswordMail}