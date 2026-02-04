import ApiKey from "../../models/ApiKey.js";
import { hashApiKey } from "../utils/apiKey.js"


export const requireApiKey = async(req,res,next)=>{
    const rawKey = req.headers['x-api-key']

    if(!rawKey){
        return res.status(401).json({message:"Missing Api Key"})
    }

    const keyHash = hashApiKey(rawKey);
    const apiKey = await ApiKey.findOne({keyHash,isActive:true})

    if(!apiKey){
        return res.status(403).json({message:"Invalid API key"})
    }

    //attach org context
    req.apiKey = apiKey;
    req.org= {orgId:apiKey.orgId}
    next();
}