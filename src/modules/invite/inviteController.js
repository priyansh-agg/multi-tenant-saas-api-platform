import crypto from 'crypto'
import OrgInvites from '../../../models/OrgInvites.js';
import Membership from '../../../models/Membership.js';

export const createInvite = async(req,res)=>{
    const {email,role} = req.body;
    const {orgId,role:userRole} = req.org;

    if (!["OWNER", "ADMIN"].includes(userRole)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const token = crypto.randomBytes(32).toString("hex")
    const invite = await OrgInvites.create({
        orgId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    //email sender to be added

    res.status(201).json({
        message: "Invite created",
        inviteToken: token
    })
}

export const acceptInvite = async(req,res)=>{
    const {token} = req.params;
    const userId = req.user.userId;

    const invite = await OrgInvites.findOne({
        token,
        acceptedAt:null,
        expiresAt: {$gt: new Date()}
    })

    if(!invite){
        return res.status(400).json({message:"Invalid or expired invite"})
    }

    await Membership.create({
        userId,
        orgId:invite.orgId,
        role:invite.role
    })

    invite.acceptedAt = new Date();
    await invite.save();

    res.json({message:"Joined Organization successfully"})
}