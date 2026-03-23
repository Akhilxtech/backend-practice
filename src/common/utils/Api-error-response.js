class ApiError extends Error{
    constructor(statusCode, message){
        super(message);
        this.statusCode=this.statusCode;
        this.isOperetional=true;
        Error.captureStackTrace(this, this.constructor)
    }

    static badRequest(message="Bad Request"){
        return new ApiError(400, message)   
    }

    static unauthorized(message="Unauthorized"){
        return new ApiError(401, message);
    }

    static forBidden(message="for-bidden"){
        return new ApiError(403, message);
    }

    static notFound(message="not-found"){
        return new ApiError(404, message);
    }


    static internalServerError(message="internal server error"){
        return new ApiError(500, message);
    }

}

export default ApiError