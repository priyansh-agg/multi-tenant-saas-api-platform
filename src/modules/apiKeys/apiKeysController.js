import ApiKey from "../../../models/ApiKey.js";
import { generateApiKey, hashApiKey } from "../../utils/apiKey.js";


export const createApiKey = async(req,res)=>{
    const {name,permissions} = req.body;
    const {orgId,role} = req.org;

    if(!["OWNER","ADMIN"].includes(role)){
        return res.status(403).json({message:"Insufficient Permissions"})
    }
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    await ApiKey.create({
        name,
        permissions,
        keyHash,
        orgId
    })
    res.status(200).json({
        message:"Api Key Created",
        apiKey: rawKey
    })
}

export const listApiKeys = async(req,res)=>{
    const {orgId,role} = req.org;

    if(!["OWNER","ADMIN"].includes(role)){
        return res.status(403).json({message:"Forbidden"})
    }

    const keys = await ApiKey.find({orgId}).select(
        "name permissions isActive createdAt lastUsedAt"
    )

    res.json(keys);
}

export const revokeApiKey = async (req, res) => {
    const { orgId, role } = req.org;
    const { keyId } = req.params;
  
    if (!["OWNER", "ADMIN"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
  
    const result = await ApiKey.findOneAndUpdate(
      { _id: keyId, orgId },
      { isActive: false }
    );
    if (!result) {
        return res.status(404).json({ message: "API key not found" });
    }
  
    res.json({ message: "API key revoked" });
};