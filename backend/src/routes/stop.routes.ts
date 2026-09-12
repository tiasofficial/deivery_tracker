import { Router } from 'express';
import * as stopController from '../controllers/stop.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireRole(['DRIVER', 'VENDOR']));

router.patch('/:stopId/arrive', stopController.arriveAtStop);
router.patch('/:stopId/deliver', stopController.deliverAtStop);
router.post('/:stopId/collect', stopController.collectAtStop);
router.patch('/:stopId/skip', stopController.skipStop);
router.patch('/:stopId', stopController.updateStop);

export default router;

