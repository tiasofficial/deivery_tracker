import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.patch('/', (req, res) => {
  res.json({ body: req.body });
});

router.post('/fix-db', async (req, res) => {
  const result = await prisma.trip.updateMany({
    where: { isSettled: true, status: 'COMPLETED' },
    data: { status: 'SETTLED' }
  });
  res.json({ fixed: result.count });
});

export default router;
