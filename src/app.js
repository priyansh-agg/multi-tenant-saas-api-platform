import express from 'express'
import helmet from 'helmet';
import cors from 'cors'
import authRoutes from './modules/auth/authRoutes.js'
import orgRoutes from './modules/organization/orgRoutes.js'
import apiKeyRoutes from './modules/apiKeys/apiKeysRoutes.js'
import inviteRoutes from './modules/invite/inviteRoutes.js'
import { requireAuth } from './middlewares/authMiddleware.js';
import { requireOrg } from './middlewares/orgMiddleware.js';
import { requireApiKey } from './middlewares/apiKeyMiddleware.js';
import { logUsage } from './middlewares/logUage.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { enforceBilling } from './middlewares/enforceBilling.js';

const app = express();

//CORS middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

//Health check
app.get('/health',(req,res)=>{
    res.status(200).json({
        status:"OK",
        uptime:process.uptime(),
        timestamp: new Date()
    })
})
app.get("/protected",requireAuth,(req,res)=>{
    res.json({user:res.user})
})
app.get("/org-dashboard",requireAuth,requireOrg,(req,res)=>{
    res.json({
        user:req.user,
        organization:req.org
    })
})
//api data route
app.get("/v1/data",requireApiKey,rateLimit,enforceBilling,logUsage,(req,res)=>{
    res.json({
        message:"API data accessed",
        orgId: req.org.orgId
    })
})
//api usage 
app.use('/auth',authRoutes)
app.use('/org',orgRoutes)
app.use('/api-keys',apiKeyRoutes)
app.use('/invites',inviteRoutes);

export default app;