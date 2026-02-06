import config from '@configs/base';
import logger from '@core/utils/logger';
import mongoose from 'mongoose';

const dbConnect = async (): Promise<void> => {
  const CONNECTION_URI = config.DATABASE.replace(
    '<PASSWORD>',
    config.DATABASE_PASSWORD,
  ).replace('<USERNAME>', config.DATABASE_USERNAME);
  logger.info(CONNECTION_URI);
  await mongoose
    .connect(CONNECTION_URI)
    .catch((err) => {
      logger.error('[MONGO_DB] mongoose => Connection failed: ', err);
      throw new Error('=========== Code-Stopped ===========');
    })
    .then(() => logger.info('[MONGO_DB] mongoose => Connected Successfully.'));
};
export default dbConnect;
