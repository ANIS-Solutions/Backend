import config from '@/config/base';
import { toJSON } from '@/core/plugins/toJSON.plugin';
import logger from '@/core/utils/logger';
import mongoose from 'mongoose';
import { Logger } from 'winston';

mongoose.plugin(toJSON);

const dbConnect = async (): Promise<mongoose.Mongoose | Logger> => {
  const CONNECTION_URI =
    config.DATABASE.replace('<PASSWORD>', config.DATABASE_PASSWORD).replace(
      '<USERNAME>',
      config.DATABASE_USERNAME,
    ) +
    '/' +
    config.DATABASE_NAME;
  logger.info(CONNECTION_URI);
  const con = await mongoose
    .connect(CONNECTION_URI)
    .then(() => logger.info('[MONGO_DB] mongoose => Connected Successfully.'))
    .catch((err) => {
      logger.error('[MONGO_DB] mongoose => Connection failed: ', err);
      throw new Error('=========== Code-Stopped ===========');
    });
  return con;
};
export default dbConnect;
