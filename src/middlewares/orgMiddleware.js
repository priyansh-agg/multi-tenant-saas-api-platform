import Membership from "../../models/Membership.js";

export const requireOrg = async(req,res,next)=>{
    const orgId = req.headers['x-org-id'];
    const userId = req.user.userId;

    if(!orgId){
        return res.status(400).json({
            message:"Missing x-org-id header"
        })
    }

    const membership = await Membership.findOne({userId,orgId});
    if(!membership){
        return res.status(403).json({message:"No access to this organisation"})
    }
    req.org = {
        orgId,
        role:membership.role
    };
    next();
}