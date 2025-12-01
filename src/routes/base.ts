import authRouter from '@routes/authRoute';
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'API is a live',
    status: 'ok',
    version: '1.0.0',
    database_status: 'live ...',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRouter);

export default router;
