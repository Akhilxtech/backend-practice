import express, { urlencoded } from "express";
import authRoute from "../src/modules/auth/auth.routes.js"
import cookieParser from "cookie-parser";
import multer from "multer";
import ApiResponse from "./common/utils/Api-response.js";
import path from "path"

import fs from "fs"
import { error, log } from "console";

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


// store in disk

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext=path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})


// store in memory

// const storage=multer.memoryStorage();


const upload = multer({ 
    storage: storage, 
    limits:{// to limit filesize
    fileSize:1024*1024*2
    },
    fileFilter:(req,file,cb)=>{
        const allowedList=["image/png","image/jpeg", "application/pdf"]
        if(allowedList.includes(file.mimetype)){
            cb(null, true)
        }
        else{
            cb(new error("file type not accepted"),false)
        }
    }
})



// app.post("/upload",upload.single("file"),(req,res)=>{
//     const buff=req.file.buffer;
//     fs.writeFileSync('public/uploads/file.jpg',buff)
//     ApiResponse.ok(res,"file uploaded")
    
// })

// app.post("/upload",upload.array("photos"), (req,res)=>{
//     console.log(req.files);
//     ApiResponse.ok(res,"file uploaded")

    
// })

// app.post("/upload",upload.fields([
//     {name:"avatar", maxCount:4}
// ]), (req,res)=>{
//     console.log(req.files);
//     ApiResponse.ok(res,"file uploaded")

    
// })








app.use("/api/auth/",authRoute)

export default app;