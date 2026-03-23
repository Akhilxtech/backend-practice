import Joi from "joi";

class BaseDto {
    static schema=Joi.object({});

    static validate(data){
        const {value,error}=this.schema.validate(data,{
            abortEarly:false, // validate whole schema then send errors
            stripUnknown:true // reomove those fields from data whose not defined in schema
        });


        if(error){
            const errors=error.details.map((e)=> e.message);
            return {value:null,error};
        }
        else{
            return {value,error:null}
        }
    }
}