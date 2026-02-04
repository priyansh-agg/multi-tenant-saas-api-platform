import ApiUsage from "../../../models/ApiUsage.js";


export const getUsageSummary = async(req,res)=>{
    const {orgId,role} = req.org;

    if(!["OWNER","ADMIN"].includes(role)){
        return res.status(403).json({
            message:"Forbidden"
        })
    }
    const total = await ApiUsage.countDocuments({orgId})

    const today = await ApiUsage.countDocuments({
        orgId,
        createdAt:{
            $gte:new Date(new Date().setHours(0,0,0,0))
        }
    })

    res.json({
        totalRequests: total,
        todayRequests:today
    })
}