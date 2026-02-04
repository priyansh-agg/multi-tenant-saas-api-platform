import express from 'express'
import { createApiKey, listApiKeys, revokeApiKey } from './apiKeysController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireOrg } from '../../middlewares/orgMiddleware.js';

const router = express.Router();
router.post("/",requireAuth,requireOrg,createApiKey)
router.get("/",requireAuth,requireOrg,listApiKeys)
router.delete("/:keyId",requireAuth,requireOrg,revokeApiKey)
export default router;