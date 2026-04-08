import { QuestModel } from './quest.model.js';
import { AddQuestBodyInput } from './quest.schema.js';

export const addQuestService = async (
  parentID: string,
  questData: AddQuestBodyInput,
) => {
  const newQuest = await QuestModel.create({
    title: questData.title,
    child: questData.child,
    parent: parentID,
    target: questData.target,
    reward: questData.reward,
    schedule: questData.schedule,
    ...(questData.description && { description: questData.description }),
  });
  return newQuest;
};
