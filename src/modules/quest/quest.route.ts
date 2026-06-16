import bindRoute from '@/core/utils/routeBounder';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  addQuest,
  cancelQuest,
  completeQuest,
  getAllQuest,
  getMyQuests,
  getQuest,
  startQuest,
  stopQuest,
  updateQuest,
} from './quest.controller.js';
import {
  addQuestSchema,
  cancelQuestSchema,
  completeQuestSchema,
  getAllQuestSchema,
  getQuestSchema,
  startQuestSchema,
  stopQuestSchema,
  updateQuestSchema,
} from './quest.schema.js';

const {
  ADD,
  GET_ALL,
  GET,
  UPDATE,
  START,
  CANCEL,
  COMPLETE,
  STOP,
  GET_MY_QUESTS,
} = API.QUEST.ROUTES;
const questRouter = Router({ mergeParams: true });
bindRoute(questRouter, GET_MY_QUESTS, getMyQuests);

bindRoute(questRouter, ADD, addQuest, addQuestSchema);
bindRoute(questRouter, UPDATE, updateQuest, updateQuestSchema);
bindRoute(questRouter, START, startQuest, startQuestSchema);
bindRoute(questRouter, CANCEL, cancelQuest, cancelQuestSchema);
bindRoute(questRouter, COMPLETE, completeQuest, completeQuestSchema);
bindRoute(questRouter, STOP, stopQuest, stopQuestSchema);
bindRoute(questRouter, GET_ALL, getAllQuest, getAllQuestSchema);
bindRoute(questRouter, GET, getQuest, getQuestSchema);

export default questRouter;
