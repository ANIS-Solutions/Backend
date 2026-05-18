import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addPrompt,
  deletePrompt,
  getAllPrompts,
  getPrompt,
  updatePrompt,
} from './embedding.controller.js';
import {
  addPromptSchema,
  deletePromptSchema,
  getAllPromptSchema,
  getPromptSchema,
  updatePromptSchema,
} from './embedding.schema.js';

const { ADD_PROMPT, GET_PROMPT, GET_ALL_PROMPT, UPDATE_PROMPT, DELETE_PROMPT } =
  API.AI_SERVICES.ROUTES;
const aiServicesRouter = Router({ mergeParams: true });

bindRoute(aiServicesRouter, ADD_PROMPT, addPrompt, addPromptSchema);
bindRoute(aiServicesRouter, GET_PROMPT, getPrompt, getPromptSchema);
bindRoute(aiServicesRouter, GET_ALL_PROMPT, getAllPrompts, getAllPromptSchema);

bindRoute(aiServicesRouter, UPDATE_PROMPT, updatePrompt, updatePromptSchema);
bindRoute(aiServicesRouter, DELETE_PROMPT, deletePrompt, deletePromptSchema);

export default aiServicesRouter;
