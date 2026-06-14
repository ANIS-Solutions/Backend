import { IQuestBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IQuest } from './quest.model.js';

type LeanQuest = Omit<IQuest, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toQuestInfo = (quest: IQuest | LeanQuest): IQuestBase => {
  const safeId = (quest as IQuest).id || (quest as LeanQuest)._id.toString();
  const safeChildId =
    (quest as IQuest).childId.toString() ||
    (quest as LeanQuest).childId.toString();

  return {
    id: safeId,
    childId: safeChildId,
    title: quest.title,
    type: quest.type,
    status: quest.status,
    description: quest.description,
    deadline: quest.deadline,
    ...(quest.points && quest.points !== 0 && { points: quest.points }),
  };
};
