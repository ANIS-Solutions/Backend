import { authMiddleware } from '@core/middlewares/authMiddleware';
import { authValidate } from '@core/middlewares/validationMiddleware';
import { Router } from 'express';

import {
  CreateQuest,
  getAllQuests,
  // startQuest,
} from './questController.js';
import {
  createQuestSchema,
  getAllQuestsSchema,
  startQuestSchema,
} from './questSchema.js';

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
