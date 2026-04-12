import fs from "fs"

// write

fs.writeFile("async.txt","hello async",(err)=>{
    if(err){
        console.log("error writing file: ", err);
    }
    else console.log("file written successfully");
    
})

console.log("hii");
