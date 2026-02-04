import express from 'express'
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { createOrganization, listOrganisations } from './orgController.js';
import { requireOrg } from '../../middlewares/orgMiddleware.js';
import {getUsageSummary} from '../usage/usageController.js'

const router = express.Router();

router.post("/",requireAuth,createOrganization)
router.get("/",requireAuth,listOrganisations)
router.get("/usage",requireAuth,requireOrg,getUsageSummary)

export default router;