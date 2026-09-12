import multer from "multer"
import path from "path"

const storage = multer.memoryStorage();
const upload=multer({
    storage:storage,
    limits:{
        fileSize:1024*1024*2
    },
    fileFilter:(req,file,cb)=>{
        const allowedList=["image/png","image/jpeg", "image/webp"]
        if(allowedList.includes(file.mimetype)){
            cb(null, true)
        }
        else{
            cb(new error("file type not accepted"),false)
        }
    }
})


export default upload