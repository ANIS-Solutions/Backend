import ApiResponse from '@/core/handlers/api.handler';
import { catchAsync } from '@/core/utils/catchAsync';
import { HttpStatusCode } from '@anis/shared';
import { NextFunction, Request, Response } from 'express';

import {
  AddPromptBodyInput,
  AddPromptParamsInput,
  DeletePromptParamsInput,
  GetAllPromptParamsInput,
  GetPromptParamsInput,
  UpdatePromptBodyInput,
  UpdatePromptParamsInput,
} from './embedding.schema.js';
import {
  addPromptService,
  deletePromptService,
  getAllPromptService,
  getPromptService,
  updatePromptService,
} from './embedding.services.js';

export const addPrompt = catchAsync(
  async (
    req: Request<AddPromptParamsInput, {}, AddPromptBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const prompt = await addPromptService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Prompt is added successfully!',
      { data: prompt },
    );
  },
);

export const getPrompt = catchAsync(
  async (
    req: Request<GetPromptParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const prompt = await getPromptService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Prompt is retrieved successfully!',
      { data: prompt },
    );
  },
);

export const getAllPrompts = catchAsync(
  async (
    req: Request<GetAllPromptParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const prompts = await getAllPromptService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Prompts is retrieved successfully!',
      { data: prompts },
    );
  },
);

export const updatePrompt = catchAsync(
  async (
    req: Request<UpdatePromptParamsInput, {}, UpdatePromptBodyInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const prompt = await updatePromptService(req.params, req.body);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Prompt is updated successfully!',
      { data: prompt },
    );
  },
);

export const deletePrompt = catchAsync(
  async (
    req: Request<DeletePromptParamsInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await deletePromptService(req.params);
    ApiResponse.success(
      res,
      HttpStatusCode.CREATED,
      'Prompt is deleted successfully!',
    );
  },
);
