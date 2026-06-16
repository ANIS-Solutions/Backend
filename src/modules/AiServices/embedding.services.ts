import { enqueueEmbedding } from '@/core/queues/embeddingService.queue';
import AppError from '@/core/utils/AppError';
import { HttpStatusCode, IPromptBase } from '@anis/shared';

import { toPromptInfo } from './embedding.dto.js';
import { PromptModel } from './embedding.model.js';
import {
  AddPromptBodyInput,
  AddPromptParamsInput,
  DeletePromptParamsInput,
  GetAllPromptParamsInput,
  GetPromptParamsInput,
  UpdatePromptBodyInput,
  UpdatePromptParamsInput,
} from './embedding.schema.js';

const buildEmbeddingPayload = (prompt: {
  id: string;
  key: string;
  description?: string;
  title: string;
}) => ({
  promptId: prompt.id,
  safeBaseline:
    'Safe, innocent, everyday objects, normal content, people smiling.',
  activeThreats: {
    [prompt.key]: prompt.description ?? prompt.title,
  },
});

export const addPromptService = async (
  reqParams: AddPromptParamsInput,
  reqBody: AddPromptBodyInput,
): Promise<IPromptBase> => {
  const { childId } = reqParams;
  const { title, key, description, LevelOfStrictness, threat, action } =
    reqBody;
  const currPrompt = await PromptModel.create({
    childId,
    title,
    key,
    description,
    LevelOfStrictness,
    threat,
    action,
    embeddingStatus: 'pending',
  });
  await enqueueEmbedding(buildEmbeddingPayload(currPrompt));
  return toPromptInfo(currPrompt);
};

export const getPromptService = async (
  reqParams: GetPromptParamsInput,
): Promise<IPromptBase> => {
  const { childId, promptId } = reqParams;
  const currPrompt = await PromptModel.findOne({ _id: promptId, childId });
  if (!currPrompt) {
    throw new AppError(
      `No prompt with id ${promptId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toPromptInfo(currPrompt);
};

export const getAllPromptService = async (
  reqParams: GetAllPromptParamsInput,
): Promise<IPromptBase[]> => {
  const { childId } = reqParams;
  const currPrompt = await PromptModel.find({ childId });
  if (!currPrompt) {
    throw new AppError(
      `No prompt for child id ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return currPrompt.map(toPromptInfo);
};

export const getPromptsEmbeddingsService = async (
  childId: string,
): Promise<object> => {
  const currPrompts = await PromptModel.find({ childId })
    .select('_id embedding updatedAt embeddedAt')
    .lean();
  if (!currPrompts) {
    throw new AppError(
      `No prompt for child id ${childId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return currPrompts.map((prompt) => ({
    id: prompt._id.toString(),
    embedding: prompt.embedding ?? null,
    updatedAt: prompt.updatedAt,
    embeddedAt: prompt.embeddedAt ?? null,
  }));
};

export const updatePromptService = async (
  reqParams: UpdatePromptParamsInput,
  reqBody: UpdatePromptBodyInput,
): Promise<IPromptBase> => {
  const { childId, promptId } = reqParams;
  const currPrompt = await PromptModel.findOneAndUpdate(
    { _id: promptId, childId },
    { ...reqBody },
    { new: true, runValidators: true },
  );
  if (!currPrompt) {
    throw new AppError(
      `No prompt with id ${promptId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
  return toPromptInfo(currPrompt);
};

export const deletePromptService = async (
  reqParams: DeletePromptParamsInput,
): Promise<void> => {
  const { childId, promptId } = reqParams;
  const currPrompt = await PromptModel.findOneAndDelete({
    _id: promptId,
    childId,
  });
  if (!currPrompt) {
    throw new AppError(
      `No prompt with id ${promptId}`,
      HttpStatusCode.NOT_FOUND,
    );
  }
};
