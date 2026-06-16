import AppError from '@/core/utils/AppError';
import logger from '@/core/utils/logger';
import { HttpStatusCode, IQuestBase, QuestProgress } from '@anis/shared';

import { ChildModel } from '../child/child.model.js';
import { toQuestInfo } from './quest.dto.js';
import { QuestModel } from './quest.model.js';
import {
  AddQuestBodyInput,
  AddQuestParamsInput,
  CancelQuestParamsInput,
  CompleteQuestParamsInput,
  GetAllQuestParamsInput,
  GetQuestParamsInput,
  StartQuestParamsInput,
  StopQuestParamsInput,
  UpdateQuestBodyInput,
  UpdateQuestParamsInput,
} from './quest.schema.js';

export const addQuestService = async (
  reqParams: AddQuestParamsInput,
  reqBody: AddQuestBodyInput,
): Promise<IQuestBase> => {
  const { childId } = reqParams;
  const { title, description, type, status, points, deadline } = reqBody;
  const currQuest = await QuestModel.create({
    title,
    childId,
    description,
    points,
    type,
    status,
    deadline,
  });
  return toQuestInfo(currQuest);
};

export const getQuestService = async (
  reqParams: GetQuestParamsInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const currQuest = await QuestModel.findOne({ _id: questId, childId });
  if (!currQuest) {
    throw new AppError(
      `No quest for child id ${childId} with id ${questId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toQuestInfo(currQuest);
};

export const getMyQuestsService = async (
  childId: string,
): Promise<IQuestBase[]> => {
  const currQuest = await QuestModel.find({ childId });
  if (!currQuest) {
    throw new AppError(
      `No quests for child id ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return currQuest.map(toQuestInfo);
};

export const getAllQuestService = async (
  reqParams: GetAllQuestParamsInput,
): Promise<IQuestBase[]> => {
  const { childId } = reqParams;
  const currQuest = await QuestModel.find({ childId });
  if (!currQuest) {
    throw new AppError(
      `No quests for child id ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return currQuest.map(toQuestInfo);
};

export const updateQuestService = async (
  reqParams: UpdateQuestParamsInput,
  reqBody: UpdateQuestBodyInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const updateValues = reqBody;
  const currQuest = await QuestModel.findOneAndUpdate(
    { _id: questId, childId },
    { ...updateValues },
  );
  if (!currQuest) {
    throw new AppError(`No quest with id ${questId}`, HttpStatusCode.NOT_FOUND);
  }
  return toQuestInfo(currQuest);
};

export const cancelQuestService = async (
  reqParams: CancelQuestParamsInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const currQuest = await QuestModel.findOneAndUpdate(
    { _id: questId, childId },
    { status: QuestProgress.CANCELED },
    { new: true },
  );
  if (!currQuest) {
    throw new AppError(
      `No quest with id ${questId} for child ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toQuestInfo(currQuest);
};

export const completeQuestService = async (
  reqParams: CompleteQuestParamsInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const currQuest = await QuestModel.findOneAndUpdate(
    { _id: questId, childId },
    { status: QuestProgress.COMPLETED },
    { new: true },
  );
  if (!currQuest) {
    throw new AppError(
      `No quest with id ${questId} for child ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  const currChild = await ChildModel.findByIdAndUpdate(
    { _id: childId },
    { $inc: { points: currQuest.points } },
  );
  logger.error(currChild?.points);
  return toQuestInfo(currQuest);
};

export const startQuestService = async (
  reqParams: StartQuestParamsInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const currQuest = await QuestModel.findOneAndUpdate(
    { _id: questId, childId },
    { status: QuestProgress.IN_PROGRESS },
    { new: true },
  );
  if (!currQuest) {
    throw new AppError(
      `No quest with id ${questId} for child ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toQuestInfo(currQuest);
};

export const stopQuestService = async (
  reqParams: StopQuestParamsInput,
): Promise<IQuestBase> => {
  const { childId, questId } = reqParams;
  const currQuest = await QuestModel.findOneAndUpdate(
    { _id: questId, childId },
    { status: QuestProgress.PENDING },
    { new: true },
  );
  if (!currQuest) {
    throw new AppError(
      `No quest with id ${questId} for child ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toQuestInfo(currQuest);
};
