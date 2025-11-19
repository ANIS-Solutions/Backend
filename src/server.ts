import express from 'express';
import config from '@/configs';
import routes from '@/routes';

const app = express();

(async () => {
  try {
    app.use('/api/v1', routes);
    app.listen(config.PORT, () => {
      console.log(`-> START: Server Running: http://localhost:${config.PORT}`);
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
