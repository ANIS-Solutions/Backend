import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import config from '@/configs/base';
import routes from '@/routes/base';

const app = express();

// app.use(cors());
// app.options('*', cors());

(async () => {
  try {
    app.use(morgan('dev'));
    app.use('/api/v1', routes);
    console.log(process.env.PORT);

    app.listen(config.PORT, () => {
      console.log(
        `-> START: Server Running: http://localhost:${config.PORT}/api/v1`,
      );
    });
  } catch (err) {
    console.log('-> FAILURE: Failed to start the server, ', err);
  }
})();

const handleServerShutdown = async () => {
  try {
    console.log('-> SHUTDOWN: Server shutdown.');
    process.exit(0);
  } catch (err) {
    console.log('-> ERROR: Server shutdown with error, ', err);
  }
};

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
