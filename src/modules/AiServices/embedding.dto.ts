import { IPromptBase } from '@anis/shared';
import { Types } from 'mongoose';

import { IPrompt } from './embedding.model.js';

type LeanPrompt = Omit<IPrompt, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toPromptInfo = (prompt: IPrompt | LeanPrompt): IPromptBase => {
  const safeId =
    (prompt as IPrompt).id || (prompt as LeanPrompt)._id.toString();
  const safeChildId =
    (prompt as IPrompt).childId.toString() ||
    (prompt as LeanPrompt).childId.toString();

  return {
    id: safeId,
    childId: safeChildId,
    title: prompt.title,
    key: prompt.key,
    LevelOfStrictness: prompt.LevelOfStrictness,
    threat: prompt.threat,
    action: prompt.action,
    description: prompt.description,
  };
};
