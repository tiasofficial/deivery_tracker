import { Router } from 'express';
import * as pickupRequestController from '../controllers/pickupRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.post('/', requireRole(['DRIVER']), pickupRequestController.createPickupRequest);
router.get('/', pickupRequestController.getPickupRequests);
router.patch('/:id', requireRole(['VENDOR']), pickupRequestController.updatePickupRequest);

export default router;
