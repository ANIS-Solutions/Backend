import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

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
import {
  addQuestService,
  cancelQuestService,
  completeQuestService,
  getAllQuestService,
  getMyQuestsService,
  getQuestService,
  startQuestService,
  stopQuestService,
  updateQuestService,
} from './quest.services.js';

export const addQuest = catchAsync(
  async (
    req: Request<AddQuestParamsInput, {}, AddQuestBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await addQuestService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Quest is created successfully!',
      { data: quest },
    );
  },
);

export const updateQuest = catchAsync(
  async (
    req: Request<UpdateQuestParamsInput, {}, UpdateQuestBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await updateQuestService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Quest is updated successfully!',
      { data: quest },
    );
  },
);
export const getQuest = catchAsync(
  async (
    req: Request<GetQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await getQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quest is founded successfully!',
      { data: quest },
    );
  },
);
export const getAllQuest = catchAsync(
  async (
    req: Request<GetAllQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quests = await getAllQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quests is founded successfully!',
      { data: quests },
    );
  },
);
export const getMyQuests = catchAsync(
  async (req: Request<{}, {}, {}>, res: Response, next: NextFunction) => {
    const quests = await getMyQuestsService(req.user!.id);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quests is founded successfully!',
      { data: quests },
    );
  },
);
export const cancelQuest = catchAsync(
  async (
    req: Request<CancelQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await cancelQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quest is cancelled successfully!',
      {
        data: {
          questStatus: quest.status,
        },
      },
    );
  },
);

export const completeQuest = catchAsync(
  async (
    req: Request<CompleteQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await completeQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quest is completed successfully!',
      {
        data: {
          questStatus: quest.status,
        },
      },
    );
  },
);

export const startQuest = catchAsync(
  async (
    req: Request<StartQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await startQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quest is started successfully!',
      {
        data: {
          questStatus: quest.status,
        },
      },
    );
  },
);

export const stopQuest = catchAsync(
  async (
    req: Request<StopQuestParamsInput, {}, {}>,
    res: Response,
    next: NextFunction,
  ) => {
    const quest = await stopQuestService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.OK,
      'Quest is stopped successfully!, and now is pending',
      {
        data: {
          questStatus: quest.status,
        },
      },
    );
  },
);
