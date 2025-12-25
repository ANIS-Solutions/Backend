import { addEdu } from '@controllers/eduController';
import { authMiddleware } from '@middlewares/authMiddleware';
import { authValidate } from '@middlewares/validationMiddleware';
import { addEduSchema } from '@schemas/eduSchema';
import { Router } from 'express';

export const eduRouter = Router();

eduRouter.post('/add', authMiddleware, authValidate(addEduSchema), addEdu);

export default eduRouter;
