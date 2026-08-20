import { Router } from 'express';
const router = Router();
router.patch('/', (req, res) => {
  res.json({ body: req.body });
});
export default router;
