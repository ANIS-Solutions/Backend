import { authMiddleware } from '@/core/middleware/auth.middleware';
import { reqValidate } from '@/core/middleware/validation.middleware';
import { API } from '@anis/shared';
import { Router } from 'express';

import { AddQuest } from './quest.controller.js';
import { addQuestSchema } from './quest.schema.js';

const questRouter = Router();
const { ADD, GET, GET_ALL, START } = API.QUEST.ROUTES;

questRouter[ADD.method](
  ADD.path,
  authMiddleware,
  reqValidate(addQuestSchema),
  AddQuest,
);

// questRouter[GET.method](
//   GET.path,
//   authMiddleware,
//   reqValidate(getAllQuestsSchema),
//   getAllQuests,
// );

// questRouter[START.method](
//   START.path,
//   authMiddleware,
//   reqValidate(startQuestSchema),
//   // startQuest,
// );

// questRouter.patch('/:id/start');
// questRouter.patch('/:id/complete');
// questRouter.patch('/:id/cancel');
// questRouter.get('/history');
// questRouter.get('/active');
export default questRouter;
