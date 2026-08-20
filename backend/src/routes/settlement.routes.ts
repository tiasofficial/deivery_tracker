import { Router } from 'express';
import * as settlementController from '../controllers/settlement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['VENDOR']));

router.get('/', settlementController.getSettlements);
router.post('/', settlementController.createSettlement);
router.get('/:id', settlementController.getSettlementById);

export default router;
