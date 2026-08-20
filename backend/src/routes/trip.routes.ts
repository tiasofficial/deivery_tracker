import { Router } from 'express';
import * as tripController from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import stopRoutes from './stop.routes';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', tripController.getTrips);
router.post('/', requireRole(['VENDOR']), tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.patch('/:id', requireRole(['VENDOR']), tripController.updateTrip);
router.delete('/:id', requireRole(['VENDOR']), tripController.deleteTrip);
router.patch('/:id/start', requireRole(['DRIVER']), tripController.startTrip);
router.patch('/:id/complete', requireRole(['DRIVER']), tripController.completeTrip);

// Mount stop routes under trips
router.use('/:tripId/stops', stopRoutes);

export default router;
