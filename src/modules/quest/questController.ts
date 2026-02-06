import { catchAsync } from '@core/utils/catchAsync';
import HttpStatusCode from '@core/utils/HttpStatusCode';
import { IParent } from '@modules/auth/authModel';
import { NextFunction, Request, Response } from 'express';

import { QuestModel } from './questModel.js';
import { CreateQuestInput, GetAllQuestsInput } from './questSchema.js';

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
      child,
      parent: parentID,
      target,
      reward,
      schedule,
      ...(description && { description }),
    });

    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: 'Quest created successfully',
      data: { questId: newQuest._id },
    });
  },
);

export const getAllQuests = catchAsync(
  async (
    // Request<Params, ResBody, ReqBody, Query>
    req: Request<{}, {}, {}, GetAllQuestsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { status, child } = req.query;
    const parentId = (req.user as IParent)._id;

    const filter: Record<string, unknown> = {
      parent: parentId,
      ...(status && { status }),
      ...(child && { child }),
    };

    const quests = await QuestModel.find(filter)
      .populate('child', 'name age')
      .sort({ createdAt: -1 });

    return res.status(HttpStatusCode.OK).json({
      success: true,
      results: quests.length,
      data: {
        quests,
      },
    });
  },
);

// export const startQuest = catchAsync(
//   async (
//     req: Request<startQuestInput, {}, {}, {}>,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     const { questId } = req.params;
//   },
// );

export const startQuest = (): void => {
  //console.log('Hello');
};
