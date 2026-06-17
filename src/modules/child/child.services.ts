import { CacheService } from '@/core/cache/cache.service';
import { AUTH } from '@/core/constants/auth.constants';
import { CACHE } from '@/core/constants/cache.constants';
import { signAccessToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import { FCMService } from '@/core/utils/fcm.utils';
import { QrCode } from '@/core/utils/qrcode.utils';
import {
  FcmAction,
  HttpStatusCode,
  IChildBase,
  IJwtPayload,
  NotificationType,
  UserRoles,
  UserScopes,
} from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import { ParentModel } from '../parent/parent.model.js';
import { toChildProfile } from './child.dto.js';
import { ChildModel, IChild } from './child.model.js';
import {
  CreateChildBodyInput,
  DeleteChildParamsInput,
  GetMyChildParamsInput,
  PairChildInput,
  RepairChildInput,
  RequestRepairChildParamsInput,
  UpdateChildBodyInput,
} from './child.schema.js';

const genAccessToken = (user: IChild): string => {
  return signAccessToken(
    {
      id: user.id,
      role: UserRoles.CHILD,
      deviceId: user.deviceId,
      isActive: user.isActive,
      scopes: [UserScopes.WRITE_TELEMETRY],
    } as Partial<IJwtPayload>,
    AUTH.JWT_CHILD_TOKEN,
  );
};

export const addChildService = async (
  reqUser: JwtPayload & IJwtPayload,
  addChildData: CreateChildBodyInput,
): Promise<{
  pairingQrCode: string;
  pairToken: string;
}> => {
  const parentId = reqUser.id;
  const { firstName, gender, hobbies, dob } = addChildData;
  const { token } = AuthUtils.generateCryptoUUID();
  const redisKey = CACHE.PREFIX.PAIRING_PENDING + token;

  const pendingChildData = {
    parentId,
    firstName,
    gender,
    hobbies: hobbies ?? [],
    dob,
  };
  await CacheService.setWithTTL(
    redisKey,
    JSON.stringify(pendingChildData),
    CACHE.TTL.PAIRING_PENDING,
  );

  const qrPayload = {
    action: 'PAIR_DEVICE',
    token: token,
  };
  const pairingQrCode = await QrCode.generateBase64(qrPayload);
  return { pairingQrCode, pairToken: token };
};

export const GetMyChildrenService = async (
  reqUser: JwtPayload & IJwtPayload,
): Promise<IChildBase[]> => {
  const parentId = reqUser.id;
  const children = await ChildModel.find({ parentId }).sort({
    createdAt: -1,
  });
  return children.map(toChildProfile);
};

export const getMyChildService = async (
  reqUser: JwtPayload & IJwtPayload,
  reqParams: GetMyChildParamsInput,
): Promise<IChildBase> => {
  const parentId = reqUser.id;
  const childId = reqParams.childId;
  const child = await ChildModel.findOne({
    _id: childId,
    parentId,
  }).lean();

  return toChildProfile(child!);
};

export const updateMyChildService = async (
  parentId: string,
  childId: string,
  updatedChildData: UpdateChildBodyInput,
): Promise<IChildBase> => {
  const updatedChild = await ChildModel.findByIdAndUpdate(
    {
      _id: childId,
      parentId: parentId,
    },
    { $set: updatedChildData },
    {
      new: true,
      runValidators: true,
    },
  ).exec();

  return toChildProfile(updatedChild!);
};

export const deleteMyChildService = async (
  parentId: string,
  childId: string,
): Promise<void> => {
  const deletedChild = await ChildModel.findOneAndDelete({
    _id: childId,
    parentId,
  }).exec();

  if (!deletedChild) {
    throw new AppError(
      'Child not found or already deleted',
      HttpStatusCode.NOT_FOUND,
    );
  }
};

export const pairChildService = async (
  pairChildData: PairChildInput,
): Promise<{ childData: IChildBase; accessToken: string }> => {
  const { token, deviceId, deviceName, fcmToken } = pairChildData;
  const redisKey = CACHE.PREFIX.PAIRING_PENDING + token;
  const cachedData = await CacheService.get(redisKey);
  if (!cachedData) {
    throw new AppError(
      'QR code has expired or is invalid. Please generate a new one.',
      HttpStatusCode.FORBIDDEN,
    );
  }
  const pendingChild = JSON.parse(cachedData) as CreateChildBodyInput & {
    parentId: string;
  };
  const newChild = await ChildModel.create({
    firstName: pendingChild.firstName,
    gender: pendingChild.gender,
    parentId: pendingChild.parentId,
    dob: pendingChild.dob,
    hobbies: pendingChild.hobbies ?? [],
    deviceId,
    deviceName: deviceName ?? '',
    fcmToken,
  });
  const parent = await ParentModel.findById(pendingChild.parentId)
    .select('devices firstName')
    .lean();

  if (parent && parent.devices.length > 0) {
    const fcmTokens = parent.devices.map((d) => d.fcmToken);

    const { staleTokens } = await FCMService.sendMulticastNotification({
      recipientId: pendingChild.parentId,
      fcmTokens,
      title: 'Child Device Paired',
      body: `${pendingChild.firstName}'s device has been successfully linked to your account.`,
      type: NotificationType.NEW_CHILD,
      action: FcmAction.NEW_CHILD_PAIRED,
      payload: {
        childId: String(newChild._id),
        childName: pendingChild.firstName,
        deviceName: deviceName ?? '',
      },
    });

    if (staleTokens.length > 0) {
      await FCMService.removeStaleFcmTokens(
        ParentModel,
        pendingChild.parentId,
        staleTokens,
      );
    }
  }
  await CacheService.delete(redisKey);
  const accessToken = genAccessToken(newChild);
  return { childData: toChildProfile(newChild), accessToken };
};

export const getMeService = async (userId: string): Promise<IChildBase> => {
  const currUser = await ChildModel.findById(userId).lean();
  if (!currUser)
    throw new AppError('No current user', HttpStatusCode.NOT_FOUND);
  return toChildProfile(currUser);
};

export const requestRepairChildService = async (
  reqUser: JwtPayload & IJwtPayload,
  reqParams: RequestRepairChildParamsInput,
): Promise<{
  pairingQrCode: string;
  pairToken: string;
}> => {
  const parentId = reqUser.id;
  const childId = reqParams.childId;

  const child = await ChildModel.findOne({ _id: childId, parentId }).lean();
  if (!child) {
    throw new AppError('Child not found', HttpStatusCode.NOT_FOUND);
  }

  const { token } = AuthUtils.generateCryptoUUID();
  const redisKey = CACHE.PREFIX.REPAIR_PENDING + token;

  const pendingRepairData = {
    childId: child._id.toString(),
  };

  await CacheService.setWithTTL(
    redisKey,
    JSON.stringify(pendingRepairData),
    CACHE.TTL.REPAIR_PENDING,
  );

  const qrPayload = {
    action: 'REPAIR_DEVICE',
    token: token,
  };
  const pairingQrCode = await QrCode.generateBase64(qrPayload);

  return { pairingQrCode, pairToken: token };
};

export const repairChildService = async (
  repairData: RepairChildInput,
): Promise<{ childData: IChildBase; accessToken: string }> => {
  const { token, deviceId, deviceName, fcmToken } = repairData;
  const redisKey = CACHE.PREFIX.REPAIR_PENDING + token;
  const cachedData = await CacheService.get(redisKey);

  if (!cachedData) {
    throw new AppError(
      'QR code has expired or is invalid. Please generate a new one.',
      HttpStatusCode.FORBIDDEN,
    );
  }

  const pendingRepair = JSON.parse(cachedData) as { childId: string };

  const updatedChild = await ChildModel.findByIdAndUpdate(
    pendingRepair.childId,
    {
      $set: {
        deviceId,
        deviceName: deviceName ?? '',
        fcmToken,
        isActive: true,
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedChild) {
    throw new AppError('Child not found', HttpStatusCode.NOT_FOUND);
  }

  const parent = await ParentModel.findById(updatedChild.parentId)
    .select('devices firstName')
    .lean();

  if (parent && parent.devices.length > 0) {
    const fcmTokens = parent.devices.map((d) => d.fcmToken);

    const { staleTokens } = await FCMService.sendMulticastNotification({
      recipientId: updatedChild.parentId.toString(),
      fcmTokens,
      title: 'Child Device Re-paired',
      body: `${updatedChild.firstName}'s device has been successfully re-linked.`,
      type: NotificationType.NEW_CHILD,
      action: FcmAction.CHILD_REPAIRED,
      payload: {
        childId: String(updatedChild._id),
        childName: updatedChild.firstName,
        deviceName: deviceName ?? '',
      },
    });

    if (staleTokens.length > 0) {
      await FCMService.removeStaleFcmTokens(
        ParentModel,
        updatedChild.parentId.toString(),
        staleTokens,
      );
    }
  }

  await CacheService.delete(redisKey);
  const accessToken = genAccessToken(updatedChild);

  return { childData: toChildProfile(updatedChild), accessToken };
};
