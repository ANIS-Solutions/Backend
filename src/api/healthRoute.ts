import HttpStatusCode from '@core/utils/HttpStatusCode';
import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  res.status(HttpStatusCode.OK).json({
    status: 'ok',
    version: process.env.npm_package_version,
    database_status: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
});

export default router;
