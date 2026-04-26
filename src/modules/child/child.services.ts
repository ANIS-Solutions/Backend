import { CacheService } from '@/core/cache/cache.service';
import { signAccessToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import { QrCode } from '@/core/utils/qrcode.utils';
import {
  HttpStatusCode,
  IChildBase,
  IJwtPayload,
  UserRoles,
  UserScopes,
} from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import { toChildProfile } from './child.dto.js';
import { ChildModel, IChild } from './child.model.js';
import {
  CreateChildBodyInput,
  GetMyChildParamsInput,
  PairChildInput,
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
    '120M',
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
  const redisKey = `pairing:pending:${token}`;

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
    10 * 60,
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

export const pairChildService = async (
  pairChildData: PairChildInput,
): Promise<{ childData: IChildBase; accessToken: string }> => {
  const { token, deviceId, deviceName, fcmToken } = pairChildData;
  const redisKey = `pairing:pending:${token}`;
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
