import { MulterConfig } from '@/core/middleware/multer.middleware';
import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import { uploadChildSessions } from './childSessions.controller.js';
import { uploadChildSessionsSchema } from './childSessions.schema.js';

const childSessionsRouter = Router();
const { SEND } = API.CHILD_SESSIONS.ROUTES;

bindRoute(
  childSessionsRouter,
  SEND,
  uploadChildSessions,
  uploadChildSessionsSchema,
  {
    multer: {
      allowedMimetypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSizeBytes: 5 * 1024 * 1024,
      maxFileCount: 50,
      storageMode: 'disk',
      destination: 'uploads/temp/',
    } as MulterConfig,
  },
);

export default childSessionsRouter;
