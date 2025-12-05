import authRouter from '@routes/authRoute';
import AppError from '@utils/AppError';
import HttpStatusCode from '@utils/HttpStatusCode';
import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  try {
    res.status(HttpStatusCode.OK).json({
      message: 'API is a live',
      status: 'ok',
      version: '1.0.0',
      database_status: mongoose.STATES[mongoose.connection.readyState],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(HttpStatusCode.OK).json({
      status: 'stopped',
      err,
      message: 'API is a stopped',
      version: '1.0.0',
      database_status: mongoose.STATES[mongoose.connection.readyState],
      timestamp: new Date().toISOString(),
    });
  }
});

router.use('/auth', authRouter);

// https://stackoverflow.com/a/79554232/28759450
router.all('/{*splat}', (req, res, next) => {
  // res.status(HttpStatusCode.NOT_FOUND).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      HttpStatusCode.NOT_FOUND,
    ),
  );
});
export default router;
