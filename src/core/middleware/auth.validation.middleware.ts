import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import { ChildModel } from '@/modules/child/child.model';
import { ParentModel } from '@/modules/parent/parent.model';
import { HttpStatusCode, IJwtPayload, UserRoles } from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import logger from '../utils/logger.js';

type JWT_TYPE = JwtPayload & IJwtPayload;
type RoleValidator = (decoded: JWT_TYPE) => Promise<boolean>;

export const RoleValidators: Record<string, RoleValidator> = {
  [UserRoles.PARENT]: async (decoded: JWT_TYPE) => {
    const stillUser = await ParentModel.findById(decoded.id);

    if (!stillUser || !stillUser.isActive) {
      throw new AppError(
        'The user belonging to this token no longer exists.',
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (!stillUser.refreshToken) {
      throw new AppError(
        'Session expired. Please log in again.',
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (
      decoded.iat &&
      AuthUtils.isPasswordChangedAfterAccessTokenIAT(
        stillUser.createdAt,
        stillUser.passwordChangedAt,
        decoded.iat,
      )
    ) {
      throw new AppError(
        'User recently changed password! Please log in again.',
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    return stillUser.isActive;
  },

  [UserRoles.CHILD]: async (decoded: JWT_TYPE) => {
    const stillChild = await ChildModel.findById(decoded.id);

    if (!stillChild || !stillChild.isActive) {
      throw new AppError(
        'The device belonging to this token has been removed or deactivated.',
        HttpStatusCode.UNAUTHORIZED,
      );
    }
    logger.error(decoded);
    if (
      !decoded.iat ||
      !decoded.deviceId ||
      !decoded.isActive ||
      AuthUtils.isUnPairedAfterAccessTokenIAT(
        // TODO: verify if child be in active (un pair) then activate it again (pair)
        { isActive: decoded.isActive, deviceId: decoded.deviceId },
        { isActive: stillChild.isActive, deviceId: stillChild.deviceId },
      )
    ) {
      throw new AppError(
        'This device has been unpaired by the parent. Access denied.',
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    return stillChild.isActive;
  },
};
