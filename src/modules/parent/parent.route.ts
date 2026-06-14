import bindRoute from '@/core/utils/routeBounder';
import {
  changePasswordSchema,
  deactivateAccountSchema,
  reactivateAccountRequestSchema,
  reactivateAccountSchema,
  updateProfileSchema,
} from '@/modules/parent/parent.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

import {
  change_password,
  deactivate_account,
  get_me,
  reactivate_account,
  reactivate_account_request,
  update_profile,
} from './parent.controller.js';

const parentRouter = Router();
const {
  ME,
  CHANGE_PASSWORD,
  UPDATE_PROFILE,
  DEACTIVATE,
  REACTIVATE,
  REACTIVATE_REQUEST,
} = API.PARENT.ROUTES;

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────
bindRoute(
  parentRouter,
  REACTIVATE_REQUEST,
  reactivate_account_request,
  reactivateAccountRequestSchema,
);
bindRoute(
  parentRouter,
  REACTIVATE,
  reactivate_account,
  reactivateAccountSchema,
);

// ─── PROTECTED ROUTES ──────────────────────────────────────────────────────
bindRoute(parentRouter, ME, get_me);
bindRoute(parentRouter, CHANGE_PASSWORD, change_password, changePasswordSchema);
bindRoute(parentRouter, UPDATE_PROFILE, update_profile, updateProfileSchema);
bindRoute(
  parentRouter,
  DEACTIVATE,
  deactivate_account,
  deactivateAccountSchema,
);

export default parentRouter;
