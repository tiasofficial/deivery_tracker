import { Router } from 'express';
import authRoutes from './auth.routes';
import tripRoutes from './trip.routes';
import driverRoutes from './driver.routes';
import merchantRoutes from './merchant.routes';
import boxtypeRoutes from './boxtype.routes';
import analyticsRoutes from './analytics.routes';
import settlementRoutes from './settlement.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/drivers', driverRoutes);
router.use('/merchants', merchantRoutes);
router.use('/boxtypes', boxtypeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settlements', settlementRoutes);

export default router;
