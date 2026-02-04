import ApiUsage from "../../../models/ApiUsage.js";

export const getMonthlyUsage = async(orgId)=>{
    const startOfMonth = new Date()
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    return ApiUsage.countDocuments({
        orgId,
        createdAt: {$gte:startOfMonth}
    })
}