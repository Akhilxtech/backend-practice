import ApiError from "../utils/Api-error-response.js"
const validate=(baseDtoClass)=>{
    return (req,res,next)=>{
        const {error,value}=baseDtoClass.validate(req.body);

        if(error){
            throw ApiError.badRequest(error);
        }
        req.body=value;
        
        next();
        
    }
}

export default validate