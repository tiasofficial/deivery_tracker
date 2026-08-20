import { Router } from 'express';
import * as merchantController from '../controllers/merchant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['VENDOR']));

router.get('/', merchantController.getMerchants);
router.post('/', merchantController.createMerchant);
router.put('/:id', merchantController.updateMerchant);
router.delete('/:id', merchantController.deleteMerchant);
router.get('/:id/history', merchantController.getMerchantHistory);

export default router;
