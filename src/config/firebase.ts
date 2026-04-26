import fs from 'fs';
import path from 'path';

import config from '@/config/base';
import logger from '@/core/utils/logger';
import admin from 'firebase-admin';

export const initFirebase = (): void => {
  if (admin.apps.length > 0) return;

  try {
    let credential;
    if (process.env.FIREBASE_CREDENTIALS) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_CREDENTIALS,
      ) as admin.ServiceAccount;

      credential = admin.credential.cert(serviceAccount);
    } else if (config.FIREBASE_KEY_PATH) {
      const absolutePath = path.resolve(
        process.cwd(),
        config.FIREBASE_KEY_PATH,
      );
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Firebase key file not found at: ${absolutePath}`);
      }
      credential = admin.credential.cert(absolutePath);
    } else {
      throw new Error(
        'No Firebase credentials provided in environment or config.',
      );
    }

    admin.initializeApp({ credential });
    logger.info('Firebase Admin Initialized Successfully');
  } catch (error) {
    logger.error('Firebase Admin Initialization Failed:', error);
  }
};

export { admin as firebaseAdmin };
