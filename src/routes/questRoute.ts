import { CreateQuest } from '@controllers/questController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { createQuestSchema } from '@schemas/questSchema';
import { Router } from 'express';

const questRouter = Router();

questRouter.post(
  '/',
  authMiddleware,
  authValidate(createQuestSchema),
  CreateQuest,
);
// questRouter.get('/child/:id');
// questRouter.patch('/:id/start');
// questRouter.patch('/:id/complete');
// questRouter.patch('/:id/cancel');
// questRouter.get('/history');
// questRouter.get('/active');
export default questRouter;
