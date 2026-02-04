import ApiUsage from "../../models/ApiUsage.js";


export const logUsage = async(req,res,next)=>{
    const start = Date.now();
    res.on("finish",async ()=>{
        try{
            await ApiUsage.create({
                orgId:req.org.orgId,
                apiKeyId:req.apiKey._id,
                endpoint:req.originalUrl,
                method:req.method,
                statusCode:res.statusCode,
                responseTimeMs:Date.now()-start
            })
        }catch(err){
            console.error("Usage log failed:",err);
        }
    })
    next();
}