class ApiResponse {

    static ok(res, message, data=null){
        return res.status(200).json({
            message,
            success: true.valueOf,
            data
        })
    }

    static created(res,message, data=null){
        return res.status(201).json({
            message,
            success:true,
            data
        })
    }

    static no_content(res,message, data=null){
        res.status(201).json({
            message,
            success:true,
            data
        })
    }
}

export default ApiResponse