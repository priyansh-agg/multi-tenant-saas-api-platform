import express from 'express'
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { requireOrg } from '../../middlewares/orgMiddleware.js';
import { acceptInvite, createInvite } from './inviteController.js';

const router = express.Router();

router.post('/',requireAuth,requireOrg,createInvite);
router.post("/accept/:token",requireAuth,acceptInvite);

export default router;