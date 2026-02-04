import Organisation from "../../models/Organisation.js";
import { PLANS } from "../config/plans.js";
import { getMonthlyUsage } from "../modules/billings/billService.js";


export const enforceBilling = async (req, res, next) => {
    const orgId = req.org.orgId;
  
    const org = await Organisation.findById(orgId);
  
    if (!org) {
      return res.status(404).json({
        message: "Organization not found"
      });
    }
  
    const plan = PLANS[org.plan];
    const usage = await getMonthlyUsage(orgId);
  
    if (usage >= plan.monthlyRequestLimit) {
      return res.status(402).json({
        message: "Monthly limit exceeded. Upgrade your plan"
      });
    }
  
    next(); // ✅ CRITICAL
};