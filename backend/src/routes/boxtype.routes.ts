import { Router } from 'express';
import * as boxtypeController from '../controllers/boxtype.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['VENDOR']));

router.get('/', boxtypeController.getBoxTypes);
router.post('/', boxtypeController.createBoxType);
router.put('/:id', boxtypeController.updateBoxType);
router.delete('/:id', boxtypeController.deleteBoxType);

export default router;
