import {
  CreateQuest,
  getAllQuests,
  // startQuest,
} from '@controllers/questController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import {
  createQuestSchema,
  getAllQuestsSchema,
  startQuestSchema,
} from '@schemas/questSchema';
import { Router } from 'express';

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
