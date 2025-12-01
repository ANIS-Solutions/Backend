import config from '@configs/base';
import mongoose from 'mongoose';

const dbConnect = async (): Promise<void> => {
  const CONNECTION_URI = config.DATABASE.replace(
    '<PASSWORD>',
    config.DATABASE_PASSWORD,
  ).replace('<USERNAME>', config.DATABASE_USERNAME);
  /* eslint no-console: "off" */
  console.log(CONNECTION_URI);
  await mongoose
    .connect(CONNECTION_URI)
    .catch((err) => {
      console.error('[MONGO_DB] mongoose => Connection failed: ', err);
      throw new Error('=========== Code-Stopped ===========');
    })
    .then(() => console.log('[MONGO_DB] mongoose => Connected Successfully.'));
};
export default dbConnect;
