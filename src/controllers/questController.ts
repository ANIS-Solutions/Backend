/* eslint-disable @typescript-eslint/no-empty-object-type */
import { IParent } from '@models/authModels';
import { QuestModel } from '@models/questModel';
import { CreateQuestInput } from '@schemas/questSchema';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const CreateQuest = catchAsync(
  async (
    req: Request<{}, {}, CreateQuestInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { title, description, child, target, reward, schedule } = req.body;

    const parentID = (req.user as IParent)._id;

    const newQuest = await QuestModel.create({
      title,
      description,
      child,
      parent: parentID,
      target,
      reward,
      schedule,
    });

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Quest created successfully',
      data: {
        questId: newQuest._id?.toString(),
      },
    });
  },
);

// export const createQuest = catchAsync(
//   async (
//     req: Request<{}, {}, CreateQuestInput>,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     const { title, description, child, target, reward, schedule } = req.body;

//     // Parent from auth middleware
//     const parentId = (req.user as IParent)._id;

//     // (Optional) Extra safety: prevent invalid ObjectId usage
//     if (!mongoose.Types.ObjectId.isValid(child)) {
//       throw new AppError('Invalid child ID', HttpStatusCode.BAD_REQUEST);
//     }

//     // Create quest
//     const quest = await QuestModel.create({
//       title,
//       description,
//       child,
//       parent: parentId,
//       target,
//       reward,
//       schedule,
//     });

//     return res.status(HttpStatusCode.CREATED).json({
//       success: true,
//       message: 'Quest created successfully',
//       data: {
//         questId: quest._id,
//       },
//     });
//   },
// );
