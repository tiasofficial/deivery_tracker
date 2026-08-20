import { Router } from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['VENDOR']));

router.get('/', driverController.getDrivers);
router.post('/', driverController.createDriver);
router.get('/:id', driverController.getDriverById);
router.get('/:id/trips', driverController.getDriverTrips);
router.put('/:id', driverController.updateDriver);
router.patch('/:id/password', driverController.updateDriverPassword);
router.delete('/:id', driverController.deleteDriver);

export default router;
