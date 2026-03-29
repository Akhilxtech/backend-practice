import nodemailer from "nodemailer"


// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_TRAP_HOST,
  port: 2525,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail=async (to,subject,html)=>{
    await transporter.sendMail({
        from: `${process.env.SMTP_FROM_EMAIL}`,
        to,
        subject,
        html,
    });
}

const sendVerificationMail=async (email,token)=>{
    await transporter.sendMail({
        from: `${process.env.SMTP_FROM_EMAIL}`,
        to:email,
        subject:"Account Verification",
        html: `<h2>Email Verify Karo</h2>
        <a href="${process.env.BASE_URL}/verify-email/${token}">
          Click here to verify
        </a>`
    });
}

export {sendMail, sendVerificationMail}