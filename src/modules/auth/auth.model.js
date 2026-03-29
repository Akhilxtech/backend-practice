import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema=new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        requred:[true,"name is required"],
        minlength:2,
        maxlength:30
    },
    email:{
        type: String,
        trim: true,
        requred:[true,"email is required"],
        unique:true,
        lowercase:true
    },
    password:{
        type: String,
        requred:[true,"password is required"],
        minLength:8,
        select:false
    },
    isVerified:{
        type: Boolean,
        default:false
    },
    role:{
        type: String,
        enum: ["admin", "Customer", "Seller"],
        default: "Customer"

    },
    verificationToken:{
        type:String,
        select:false
    },
    refreshToken:{
        type:String,
        select:false,
    },
    resetPasswordToken:{
        type:String,
        select:false 
    },
    resetPasswordTokenExpiry:{
        type:Date,
        select:false,
    },
    verificationTokenExpiry:{
        type:Date,
        default:()=> Date.now()+5*60*1000, // 5 mins
        select:false
    }




},{timestamps:true})

userSchema.pre("save", async function(){
    if(!this.isModified("password")) return;
    this.password=await bcrypt.hash(this.password,12)
})

userSchema.methods.comparePassword= async function(clearText){
    return bcrypt.compare(clearText,this.password)
}
export default mongoose.model("User",userSchema);