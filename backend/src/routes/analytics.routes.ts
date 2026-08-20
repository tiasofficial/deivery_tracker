import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['VENDOR']));

router.get('/summary', analyticsController.getSummary);
router.get('/collections', analyticsController.getCollections);
router.get('/trips', analyticsController.getTripsAnalytics);
router.get('/drivers', analyticsController.getDriversAnalytics);
router.get('/merchants', analyticsController.getMerchantsAnalytics);
router.get('/boxes', analyticsController.getBoxesAnalytics);

export default router;
