import "dotenv/config";
import app from "./src/app.js";
import connectMongo from "./src/common/config/db.js";



const PORT=process.env.PORT||8080;

const main = async () => {

    // DB connection

    await connectMongo();
    app.listen(PORT,(req,res)=>{
        console.log(`server is running on Port ${PORT} at ${process.env.NODE_ENV} `);
        
    })

}

main().catch((errors)=>{
    console.log("Error: ",errors);
    process.exit(1);
    
})