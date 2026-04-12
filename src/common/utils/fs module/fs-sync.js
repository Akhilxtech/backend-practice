import fs from "fs"

// 1. write

fs.writeFileSync("test.txt","hello");
//  // agar file exist krti hai toh likh dega nhi exist kregi toh create kr dega


// 2. read

// const data=fs.readFileSync("test.txt",'utf-8')

// console.log(data);


// fs.appendFileSync("test.txt", "\nhello from append")


// creating folder

// fs.mkdirSync("myfolder/innerfolder",{recursive:true})// recursive:true=check folder exist or not if not create it and inside that create innerfolder

// delete file

// fs.unlinkSync("test.txt") // only work for file not folder

// rename

// fs.renameSync("test.txt","test1.txt")


// copy

// fs.cpSync("test1.txt","test.txt")

// rm to delete folder

// fs.rmSync("myfolder", {recursive:true})

// diff b/w rmdirsync and rmsync

//  rmdir is used to remove empty folder