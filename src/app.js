import express, { urlencoded } from "express";
import authRoute from "../src/modules/auth/auth.routes.js"
import cookieParser from "cookie-parser";
const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.use("/api/auth/",authRoute)

export default app;