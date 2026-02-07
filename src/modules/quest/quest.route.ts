import { authMiddleware } from '@core/middleware/authMiddleware';
import { authValidate } from '@core/middleware/validationMiddleware';
import { Router } from 'express';

import {
  CreateQuest,
  getAllQuests,
  // startQuest,
} from './quest.controller.js';
import {
  createQuestSchema,
  getAllQuestsSchema,
  startQuestSchema,
} from './quest.schema.js';

const questRouter = Router();

questRouter.post(
  '/add',
  authMiddleware,
  authValidate(createQuestSchema),
  CreateQuest,
);

questRouter.get(
  '/',
  authMiddleware,
  authValidate(getAllQuestsSchema),
  getAllQuests,
);

questRouter.patch(
  '/start',
  authMiddleware,
  authValidate(startQuestSchema),
  // startQuest,
);

// questRouter.patch('/:id/start');
// questRouter.patch('/:id/complete');
// questRouter.patch('/:id/cancel');
// questRouter.get('/history');
// questRouter.get('/active');
export default questRouter;
